using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SapBasisPulse.Api.Data;
using SapBasisPulse.Api.DTOs;
using SapBasisPulse.Api.Entities;

namespace SapBasisPulse.Api.Services.Payments
{
    public class RazorpayPaymentService : IPaymentService
    {
        private readonly AppDbContext _db;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _config;
        private readonly ILogger<RazorpayPaymentService> _logger;

        public RazorpayPaymentService(AppDbContext db, IHttpClientFactory httpClientFactory, IConfiguration config, ILogger<RazorpayPaymentService> logger)
        {
            _db = db;
            _httpClientFactory = httpClientFactory;
            _config = config;
            _logger = logger;
        }

        private (string keyId, string keySecret) GetKeys()
        {
            var keyId = _config["Razorpay:KeyId"] ?? _config["RAZORPAY_KEY_ID"];
            var keySecret = _config["Razorpay:KeySecret"] ?? _config["RAZORPAY_KEY_SECRET"];
            if (string.IsNullOrWhiteSpace(keyId) || string.IsNullOrWhiteSpace(keySecret))
                throw new InvalidOperationException("Razorpay keys are not configured");
            return (keyId!, keySecret!);
        }

        public async Task<CreatePaymentOrderResponse> CreateOrderAsync(Guid orderId, Guid userId)
        {
            var settings = await _db.AdminPaymentSettings.AsNoTracking().FirstOrDefaultAsync();
            if (settings == null || !settings.PaymentsEnabled)
                throw new InvalidOperationException("Payments are disabled");

            var order = await _db.Orders
                .Include(o => o.TimeSlot) // Keep for backward compatibility
                .Include(o => o.OrderSlots).ThenInclude(os => os.Slot)
                .Include(o => o.Consultant)
                .FirstOrDefaultAsync(o => o.Id == orderId);
            if (order == null)
                throw new InvalidOperationException("Order not found");

            if (order.CreatedByUserId != userId)
                throw new UnauthorizedAccessException("You cannot pay for this order");

            // Check if order has slots (new way) or single slot (backward compatibility)
            if ((order.OrderSlots == null || order.OrderSlots.Count == 0) && order.TimeSlotId == null)
                throw new InvalidOperationException("Order is missing time slots");

            // Ensure consultant rate exists
            var profile = await _db.ConsultantProfiles.AsNoTracking()
                .FirstOrDefaultAsync(p => p.ConsultantId == order.ConsultantId);
            if (profile == null || profile.HourlyRate <= 0)
                throw new InvalidOperationException("Consultant rate not configured");

            // Compute total duration in hours from all slots
            decimal totalDurationHours = 0;
            
            if (order.OrderSlots != null && order.OrderSlots.Count > 0)
            {
                // New way: calculate from multiple slots
                foreach (var orderSlot in order.OrderSlots)
                {
                    var durationHours = (decimal)(orderSlot.Slot.SlotEndTime - orderSlot.Slot.SlotStartTime).TotalMinutes / 60m;
                    if (durationHours <= 0)
                        throw new InvalidOperationException("Invalid slot duration");
                    totalDurationHours += durationHours;
                }
            }
            else if (order.TimeSlot != null)
            {
                // Backward compatibility: single slot
                totalDurationHours = (decimal)(order.TimeSlot.SlotEndTime - order.TimeSlot.SlotStartTime).TotalMinutes / 60m;
                if (totalDurationHours <= 0)
                    throw new InvalidOperationException("Invalid slot duration");
            }

            var gross = profile.HourlyRate * totalDurationHours; // INR
            // Convert to paise
            var amountPaise = (long)Math.Round(gross * 100m, MidpointRounding.AwayFromZero);

            // Commission and earnings (computed after capture too)
            var platformFeePaise = (long)Math.Round((gross * settings.PlatformCommissionPercent / 100m) * 100m, MidpointRounding.AwayFromZero);
            var consultantPaise = amountPaise - platformFeePaise;

            var (keyId, keySecret) = GetKeys();

            // Create Razorpay order
            var client = _httpClientFactory.CreateClient();
            var req = new HttpRequestMessage(HttpMethod.Post, "https://api.razorpay.com/v1/orders");
            var authBytes = Encoding.ASCII.GetBytes($"{keyId}:{keySecret}");
            req.Headers.Authorization = new AuthenticationHeaderValue("Basic", Convert.ToBase64String(authBytes));

            var payload = new
            {
                amount = amountPaise,
                currency = settings.Currency ?? "INR",
                receipt = $"order_{order.Id.ToString().Substring(0, 8)}",
                notes = new { orderId = order.Id.ToString() },
            };
            req.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

            var resp = await client.SendAsync(req);
            var body = await resp.Content.ReadAsStringAsync();
            if (!resp.IsSuccessStatusCode)
                throw new InvalidOperationException($"Razorpay order create failed: {body}");

            using var doc = JsonDocument.Parse(body);
            var rzpOrderId = doc.RootElement.GetProperty("id").GetString() ?? string.Empty;

            var payment = new Payment
            {
                Id = Guid.NewGuid(),
                OrderId = order.Id,
                RazorpayOrderId = rzpOrderId,
                AmountInPaise = amountPaise,
                Currency = settings.Currency ?? "INR",
                PlatformCommissionPercent = settings.PlatformCommissionPercent,
                PlatformFeeInPaise = platformFeePaise,
                ConsultantEarningInPaise = consultantPaise,
                Status = PaymentStatus.Created,
                CreatedAt = DateTime.UtcNow
            };

            _db.Payments.Add(payment);
            await _db.SaveChangesAsync();

            return new CreatePaymentOrderResponse
            {
                RazorpayOrderId = rzpOrderId,
                AmountInPaise = amountPaise,
                Currency = payment.Currency,
                RazorpayKeyId = keyId,
                Description = $"Consultation payment for ticket {order.Id.ToString().Substring(0, 8)}",
                Receipt = payload.receipt
            };
        }

        public async Task<CreatePaymentOrderResponse> CreateOrderOnCloseAsync(Guid orderId, Guid consultantUserId)
        {
            // Called by consultant when closing a ticket to create a Razorpay order for the existing order
            var settings = await _db.AdminPaymentSettings.AsNoTracking().FirstOrDefaultAsync();
            if (settings == null || !settings.PaymentsEnabled)
                throw new InvalidOperationException("Payments are disabled");

            var order = await _db.Orders
                .Include(o => o.TimeSlot)
                .Include(o => o.Consultant)
                .FirstOrDefaultAsync(o => o.Id == orderId);
            if (order == null)
                throw new InvalidOperationException("Order not found");

            // Ensure the caller is the assigned consultant for the order
            if (order.ConsultantId == null || order.ConsultantId != consultantUserId)
                throw new UnauthorizedAccessException("Only the assigned consultant can create the payment on close");

            // Reuse CreateOrderAsync's calculation path but ensure payment created for the order creator
            // We'll temporarily impersonate the order creator by passing their userId check through
            // Create a Razorpay order and Payment record similar to CreateOrderAsync

            // Ensure consultant rate exists
            var profile = await _db.ConsultantProfiles.AsNoTracking()
                .FirstOrDefaultAsync(p => p.ConsultantId == order.ConsultantId);
            if (profile == null || profile.HourlyRate <= 0)
                throw new InvalidOperationException("Consultant rate not configured");

            var durationHours = (decimal)(order.TimeSlot.SlotEndTime - order.TimeSlot.SlotStartTime).TotalMinutes / 60m;
            if (durationHours <= 0)
                throw new InvalidOperationException("Invalid slot duration");

            var gross = profile.HourlyRate * durationHours; // INR
            var amountPaise = (long)Math.Round(gross * 100m, MidpointRounding.AwayFromZero);
            var platformFeePaise = (long)Math.Round((gross * settings.PlatformCommissionPercent / 100m) * 100m, MidpointRounding.AwayFromZero);
            var consultantPaise = amountPaise - platformFeePaise;

            var (keyId, keySecret) = GetKeys();

            var client = _httpClientFactory.CreateClient();
            var req = new HttpRequestMessage(HttpMethod.Post, "https://api.razorpay.com/v1/orders");
            var authBytes = Encoding.ASCII.GetBytes($"{keyId}:{keySecret}");
            req.Headers.Authorization = new AuthenticationHeaderValue("Basic", Convert.ToBase64String(authBytes));

            var payload = new
            {
                amount = amountPaise,
                currency = settings.Currency ?? "INR",
                receipt = $"order_{order.Id.ToString().Substring(0, 8)}",
                notes = new { orderId = order.Id.ToString() },
            };
            req.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

            var resp = await client.SendAsync(req);
            var body = await resp.Content.ReadAsStringAsync();
            if (!resp.IsSuccessStatusCode)
                throw new InvalidOperationException($"Razorpay order create failed: {body}");

            using var doc = JsonDocument.Parse(body);
            var rzpOrderId = doc.RootElement.GetProperty("id").GetString() ?? string.Empty;

            var payment = new Payment
            {
                Id = Guid.NewGuid(),
                OrderId = order.Id,
                RazorpayOrderId = rzpOrderId,
                AmountInPaise = amountPaise,
                Currency = settings.Currency ?? "INR",
                PlatformCommissionPercent = settings.PlatformCommissionPercent,
                PlatformFeeInPaise = platformFeePaise,
                ConsultantEarningInPaise = consultantPaise,
                Status = PaymentStatus.Created,
                CreatedAt = DateTime.UtcNow
            };

            _db.Payments.Add(payment);
            await _db.SaveChangesAsync();

            return new CreatePaymentOrderResponse
            {
                RazorpayOrderId = rzpOrderId,
                AmountInPaise = amountPaise,
                Currency = payment.Currency,
                RazorpayKeyId = keyId,
                Description = $"Consultation payment for ticket {order.Id.ToString().Substring(0, 8)}",
                Receipt = payload.receipt
            };
        }

        public async Task<PaymentSummaryDto> VerifyPaymentAsync(VerifyPaymentRequest request, Guid userId)
        {
            var (keyId, keySecret) = GetKeys(); // needed for signature verification

            var order = await _db.Orders.AsNoTracking().FirstOrDefaultAsync(o => o.Id == request.OrderId);
            if (order == null) throw new InvalidOperationException("Order not found");
            if (order.CreatedByUserId != userId) throw new UnauthorizedAccessException("Not your order");

            var payment = await _db.Payments.FirstOrDefaultAsync(p => p.RazorpayOrderId == request.RazorpayOrderId && p.OrderId == request.OrderId);
            if (payment == null) throw new InvalidOperationException("Payment not found");

            // Compute signature: HMAC_SHA256(order_id + "|" + payment_id)
            var data = Encoding.UTF8.GetBytes($"{request.RazorpayOrderId}|{request.RazorpayPaymentId}");
            var secretBytes = Encoding.UTF8.GetBytes(keySecret);
            using var hmac = new HMACSHA256(secretBytes);
            var hash = hmac.ComputeHash(data);
            var expected = BitConverter.ToString(hash).Replace("-", string.Empty).ToLowerInvariant();

            if (!string.Equals(expected, request.RazorpaySignature, StringComparison.OrdinalIgnoreCase))
            {
                payment.Status = PaymentStatus.Failed;
                payment.FailedAt = DateTime.UtcNow;
                payment.RazorpayPaymentId = request.RazorpayPaymentId;
                payment.RazorpaySignature = request.RazorpaySignature;
                await _db.SaveChangesAsync();
                throw new InvalidOperationException("Invalid payment signature");
            }

            payment.Status = PaymentStatus.Paid;
            payment.CapturedAt = DateTime.UtcNow;
            payment.RazorpayPaymentId = request.RazorpayPaymentId;
            payment.RazorpaySignature = request.RazorpaySignature;
            await _db.SaveChangesAsync();

            return new PaymentSummaryDto
            {
                OrderId = payment.OrderId,
                Status = payment.Status.ToString(),
                AmountInPaise = payment.AmountInPaise,
                PlatformFeeInPaise = payment.PlatformFeeInPaise,
                ConsultantEarningInPaise = payment.ConsultantEarningInPaise,
                Currency = payment.Currency,
                CapturedAt = payment.CapturedAt
            };
        }

        public async Task<PaymentSummaryDto?> GetPaymentSummaryAsync(Guid orderId)
        {
            var payment = await _db.Payments.AsNoTracking().FirstOrDefaultAsync(p => p.OrderId == orderId);
            if (payment == null) return null;
            var keyId = _config["Razorpay:KeyId"] ?? _config["RAZORPAY_KEY_ID"] ?? string.Empty;
            return new PaymentSummaryDto
            {
                OrderId = payment.OrderId,
                Status = payment.Status.ToString(),
                AmountInPaise = payment.AmountInPaise,
                PlatformFeeInPaise = payment.PlatformFeeInPaise,
                ConsultantEarningInPaise = payment.ConsultantEarningInPaise,
                Currency = payment.Currency,
                CapturedAt = payment.CapturedAt,
                RazorpayOrderId = payment.RazorpayOrderId,
                RazorpayKeyId = keyId,
                PayoutStatus = payment.Status >= PaymentStatus.PayoutInitiated ? payment.Status.ToString() : null,
                PayoutCompletedAt = payment.PayoutCompletedAt,
                RefundAmountInPaise = payment.RefundAmountInPaise,
                RefundedAt = payment.RefundedAt
            };
        }

        public async Task<Payment?> GetPaymentByOrderIdAsync(Guid orderId)
        {
            return await _db.Payments.FirstOrDefaultAsync(p => p.OrderId == orderId);
        }

        public async Task ProcessPayoutAsync(Guid orderId)
        {
            var payment = await _db.Payments.FirstOrDefaultAsync(p => p.OrderId == orderId);
            if (payment == null)
                throw new InvalidOperationException("Payment not found");

            if (payment.Status != PaymentStatus.Paid && payment.Status != PaymentStatus.PayoutInitiated)
                throw new InvalidOperationException("Payment must be completed or escrow released before payout");

            if (payment.Status >= PaymentStatus.PayoutInitiated && payment.Status != PaymentStatus.PayoutInitiated)
                throw new InvalidOperationException("Payout already processed or completed");

            // Get consultant UPI details
            var order = await _db.Orders
                .Include(o => o.Consultant)
                .FirstOrDefaultAsync(o => o.Id == orderId);

            var consultantProfile = await _db.ConsultantProfiles
                .FirstOrDefaultAsync(cp => cp.ConsultantId == order.Consultant.Id);

            if (consultantProfile?.UPIId == null)
                throw new InvalidOperationException("Consultant UPI details not configured");

            // For development/test environment, simulate payout success
            // In production, this would integrate with Razorpay Payouts API
            var (keyId, keySecret) = GetKeys();

            // Check if this is development environment (always simulate for now)
            // TODO: Remove this simulation once Razorpay payouts are properly configured
            if (true) // Always simulate for development
            {
                // Simulate successful payout for development environment
                payment.Status = PaymentStatus.PayoutCompleted;
                payment.PayoutId = $"dev_payout_{orderId}_{DateTime.UtcNow:yyyyMMddHHmmss}";
                payment.PayoutReference = $"dev_ref_{orderId}_{DateTime.UtcNow:yyyyMMddHHmmss}";
                payment.PayoutInitiatedAt = DateTime.UtcNow;
                payment.PayoutCompletedAt = DateTime.UtcNow;

                await _db.SaveChangesAsync();

                _logger.LogInformation("Development payout simulated for order {OrderId}, payment {PaymentId}", orderId, payment.Id);
                return;
            }

            // Production payout logic (requires proper Razorpay setup)
            var client = _httpClientFactory.CreateClient();

            // First, create a fund account for the consultant
            var fundAccountRequest = new
            {
                contact = new
                {
                    name = order.Consultant.FirstName + " " + order.Consultant.LastName,
                    email = order.Consultant.Email,
                    contact = order.Consultant.PhoneNumber ?? "9999999999",
                    type = "employee",
                    reference_id = $"consultant_{order.Consultant.Id}"
                },
                account_type = "vpa",
                vpa = new
                {
                    address = consultantProfile.UPIId
                }
            };

            var fundAccountReq = new HttpRequestMessage(HttpMethod.Post, "https://api.razorpay.com/v1/fund_accounts");
            var authBytes = Encoding.ASCII.GetBytes($"{keyId}:{keySecret}");
            fundAccountReq.Headers.Authorization = new AuthenticationHeaderValue("Basic", Convert.ToBase64String(authBytes));
            fundAccountReq.Content = new StringContent(JsonSerializer.Serialize(fundAccountRequest), Encoding.UTF8, "application/json");

            var fundAccountResp = await client.SendAsync(fundAccountReq);
            var fundAccountBody = await fundAccountResp.Content.ReadAsStringAsync();

            if (!fundAccountResp.IsSuccessStatusCode)
            {
                payment.Status = PaymentStatus.PayoutFailed;
                payment.PayoutFailedAt = DateTime.UtcNow;
                payment.PayoutFailureReason = $"Fund account creation failed: {fundAccountBody}";
                await _db.SaveChangesAsync();
                throw new InvalidOperationException($"Fund account creation failed: {fundAccountBody}");
            }

            using var fundAccountDoc = JsonDocument.Parse(fundAccountBody);
            var fundAccountId = fundAccountDoc.RootElement.GetProperty("id").GetString() ?? string.Empty;

            // Now create the payout
            var payoutRequest = new
            {
                account_number = consultantProfile.UPIId,
                fund_account_id = fundAccountId,
                amount = payment.ConsultantEarningInPaise,
                currency = payment.Currency,
                mode = "UPI",
                purpose = "payout",
                queue_if_low_balance = true,
                reference_id = $"payout_{orderId}_{DateTime.UtcNow:yyyyMMddHHmmss}",
                narration = $"Payment for consultation - Order {orderId.ToString().Substring(0, 8)}"
            };

            var req = new HttpRequestMessage(HttpMethod.Post, "https://api.razorpay.com/v1/payouts");
            req.Headers.Authorization = new AuthenticationHeaderValue("Basic", Convert.ToBase64String(authBytes));
            req.Content = new StringContent(JsonSerializer.Serialize(payoutRequest), Encoding.UTF8, "application/json");

            var resp = await client.SendAsync(req);
            var body = await resp.Content.ReadAsStringAsync();

            if (!resp.IsSuccessStatusCode)
            {
                payment.Status = PaymentStatus.PayoutFailed;
                payment.PayoutFailedAt = DateTime.UtcNow;
                payment.PayoutFailureReason = body;
                await _db.SaveChangesAsync();
                throw new InvalidOperationException($"Payout failed: {body}");
            }

            using var doc = JsonDocument.Parse(body);
            var payoutId = doc.RootElement.GetProperty("id").GetString() ?? string.Empty;
            var status = doc.RootElement.GetProperty("status").GetString();

            payment.Status = status == "processed" ? PaymentStatus.PayoutCompleted : PaymentStatus.PayoutInitiated;
            payment.PayoutId = payoutId;
            payment.PayoutReference = payoutRequest.reference_id;
            payment.PayoutInitiatedAt = DateTime.UtcNow;

            if (payment.Status == PaymentStatus.PayoutCompleted)
            {
                payment.PayoutCompletedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync();
        }

        public async Task<RefundResponse> ProcessRefundAsync(Guid orderId, string reason, long? amountInPaise = null)
        {
            var payment = await _db.Payments.FirstOrDefaultAsync(p => p.OrderId == orderId);
            if (payment == null)
                throw new InvalidOperationException("Payment not found");

            if (payment.Status != PaymentStatus.Paid)
                throw new InvalidOperationException("Only completed payments can be refunded");

            if (payment.Status == PaymentStatus.Refunded)
                throw new InvalidOperationException("Payment already refunded");

            var refundAmount = amountInPaise ?? payment.AmountInPaise;
            if (refundAmount > payment.AmountInPaise)
                throw new InvalidOperationException("Refund amount cannot exceed payment amount");

            var (keyId, keySecret) = GetKeys();
            var client = _httpClientFactory.CreateClient();

            var refundRequest = new
            {
                payment_id = payment.RazorpayPaymentId,
                amount = refundAmount,
                notes = new
                {
                    reason = reason,
                    order_id = orderId.ToString()
                }
            };

            var req = new HttpRequestMessage(HttpMethod.Post, $"https://api.razorpay.com/v1/payments/{payment.RazorpayPaymentId}/refund");
            var authBytes = Encoding.ASCII.GetBytes($"{keyId}:{keySecret}");
            req.Headers.Authorization = new AuthenticationHeaderValue("Basic", Convert.ToBase64String(authBytes));
            req.Content = new StringContent(JsonSerializer.Serialize(refundRequest), Encoding.UTF8, "application/json");

            var resp = await client.SendAsync(req);
            var body = await resp.Content.ReadAsStringAsync();

            if (!resp.IsSuccessStatusCode)
            {
                return new RefundResponse
                {
                    Success = false,
                    Error = $"Refund failed: {body}"
                };
            }

            using var doc = JsonDocument.Parse(body);
            var refundId = doc.RootElement.GetProperty("id").GetString() ?? string.Empty;

            payment.Status = PaymentStatus.Refunded;
            payment.RefundAmountInPaise = refundAmount;
            payment.RefundId = refundId;
            payment.RefundReason = reason;
            payment.RefundedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            return new RefundResponse
            {
                Success = true,
                RefundId = refundId,
                RefundAmountInPaise = refundAmount
            };
        }

        public async Task<PaymentAnalyticsDto> GetPaymentAnalyticsAsync(DateTime? startDate = null, DateTime? endDate = null)
        {
            var query = _db.Payments.AsNoTracking();

            if (startDate.HasValue)
                query = query.Where(p => p.CreatedAt >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(p => p.CreatedAt <= endDate.Value);

            var payments = await query.ToListAsync();

            var totalRevenue = payments.Where(p => p.Status == PaymentStatus.Paid || p.Status == PaymentStatus.Refunded)
                                      .Sum(p => p.AmountInPaise) / 100m;

            var totalPlatformFees = payments.Where(p => p.Status == PaymentStatus.Paid || p.Status == PaymentStatus.Refunded)
                                           .Sum(p => p.PlatformFeeInPaise) / 100m;

            var totalConsultantPayouts = payments.Where(p => p.Status == PaymentStatus.PayoutCompleted)
                                                .Sum(p => p.ConsultantEarningInPaise) / 100m;

            var completedPayments = payments.Count(p => p.Status == PaymentStatus.Paid || p.Status == PaymentStatus.Refunded);
            var refundedPayments = payments.Count(p => p.Status == PaymentStatus.Refunded);

            var monthlyData = payments
                .GroupBy(p => new { p.CreatedAt.Year, p.CreatedAt.Month })
                .Select(g => new MonthlyPaymentData
                {
                    Month = $"{g.Key.Year}-{g.Key.Month:D2}",
                    Revenue = g.Where(p => p.Status == PaymentStatus.Paid || p.Status == PaymentStatus.Refunded)
                              .Sum(p => p.AmountInPaise) / 100m,
                    TransactionCount = g.Count(p => p.Status == PaymentStatus.Paid || p.Status == PaymentStatus.Refunded),
                    PlatformFees = g.Where(p => p.Status == PaymentStatus.Paid || p.Status == PaymentStatus.Refunded)
                                   .Sum(p => p.PlatformFeeInPaise) / 100m
                })
                .OrderBy(m => m.Month)
                .ToArray();

            return new PaymentAnalyticsDto
            {
                TotalRevenue = totalRevenue,
                TotalTransactions = completedPayments,
                AverageTransactionValue = completedPayments > 0 ? totalRevenue / completedPayments : 0,
                TotalPlatformFees = totalPlatformFees,
                TotalConsultantPayouts = totalConsultantPayouts,
                PendingPayouts = payments.Count(p => p.Status == PaymentStatus.Paid),
                FailedPayouts = payments.Count(p => p.Status == PaymentStatus.PayoutFailed),
                RefundRate = completedPayments > 0 ? (decimal)refundedPayments / completedPayments : 0,
                MonthlyData = monthlyData
            };
        }

        public async Task<ConsultantEarningsDto> GetConsultantEarningsAsync(Guid consultantId, DateTime? startDate = null, DateTime? endDate = null)
        {
            var query = _db.Payments
                .AsNoTracking()
                .Include(p => p.Order)
                .Where(p => p.Order.ConsultantId == consultantId);

            if (startDate.HasValue)
                query = query.Where(p => p.CreatedAt >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(p => p.CreatedAt <= endDate.Value);

            var payments = await query.ToListAsync();

            var totalEarned = payments.Where(p => p.Status >= PaymentStatus.Paid)
                                     .Sum(p => p.ConsultantEarningInPaise) / 100m;

            var platformFeesDeducted = payments.Where(p => p.Status >= PaymentStatus.Paid)
                                              .Sum(p => p.PlatformFeeInPaise) / 100m;

            var completedSessions = payments.Count(p => p.Status >= PaymentStatus.Paid);

            // Get average rating from ticket ratings
            var orderIds = payments.Select(p => p.OrderId).ToList();
            var averageRating = await _db.TicketRatings
                .AsNoTracking()
                .Where(tr => orderIds.Contains(tr.OrderId))
                .AverageAsync(tr => (tr.ResolutionQuality + tr.ResponseTime + tr.CommunicationProfessionalism) / 3m) ?? 0m;

            var monthlyBreakdown = payments
                .GroupBy(p => new { p.CreatedAt.Year, p.CreatedAt.Month })
                .Select(g => new ConsultantEarningBreakdown
                {
                    Month = $"{g.Key.Year}-{g.Key.Month:D2}",
                    GrossEarnings = g.Where(p => p.Status >= PaymentStatus.Paid)
                                    .Sum(p => (p.ConsultantEarningInPaise + p.PlatformFeeInPaise)) / 100m,
                    PlatformFees = g.Where(p => p.Status >= PaymentStatus.Paid)
                                   .Sum(p => p.PlatformFeeInPaise) / 100m,
                    NetEarnings = g.Where(p => p.Status >= PaymentStatus.Paid)
                                  .Sum(p => p.ConsultantEarningInPaise) / 100m,
                    SessionsCount = g.Count(p => p.Status >= PaymentStatus.Paid)
                })
                .OrderBy(m => m.Month)
                .ToArray();

            var pendingPayouts = payments
                .Where(p => p.Status == PaymentStatus.Paid)
                .Select(p => new PendingPayout
                {
                    OrderId = p.OrderId,
                    Amount = p.ConsultantEarningInPaise / 100m,
                    CompletedAt = p.Order.CreatedAt,
                    Status = "Pending Payout"
                })
                .ToArray();

            return new ConsultantEarningsDto
            {
                ConsultantId = consultantId,
                TotalEarned = totalEarned,
                PlatformFeesDeducted = platformFeesDeducted,
                NetReceived = totalEarned,
                CompletedSessions = completedSessions,
                AverageRating = averageRating,
                MonthlyBreakdown = monthlyBreakdown,
                PendingPayouts = pendingPayouts
            };
        }

        public async Task<ConsultantPaymentDto[]> GetConsultantPaymentsAsync(Guid consultantId)
        {
            var payments = await _db.Payments
                .AsNoTracking()
                .Include(p => p.Order).ThenInclude(o => o.CreatedByUser)
                .Where(p => p.Order.ConsultantId == consultantId)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            return payments.Select(p => new ConsultantPaymentDto
            {
                Id = p.Id.ToString(),
                OrderId = p.OrderId.ToString(),
                OrderNumber = $"SR-{p.OrderId.ToString().Substring(0, 8)}",
                CustomerName = p.Order.CreatedByUser != null
                    ? $"{p.Order.CreatedByUser.FirstName} {p.Order.CreatedByUser.LastName}"
                    : "Unknown Customer",
                Amount = p.AmountInPaise / 100m,
                ConsultantEarning = p.ConsultantEarningInPaise / 100m,
                Status = p.Status.ToString(),
                CreatedAt = p.CreatedAt,
                CompletedAt = p.Status >= PaymentStatus.Paid ? p.CapturedAt : null,
                PaymentDate = p.CapturedAt
            }).ToArray();
        }

        public async Task<ConsultantEarningsSummaryDto> GetConsultantEarningsSummaryAsync(Guid consultantId)
        {
            var payments = await _db.Payments
                .AsNoTracking()
                .Include(p => p.Order)
                .Where(p => p.Order.ConsultantId == consultantId)
                .ToListAsync();

            var completedPayments = payments.Where(p => p.Status >= PaymentStatus.Paid).ToList();
            var pendingPayments = payments.Where(p => p.Status < PaymentStatus.Paid).ToList();

            var totalEarned = completedPayments.Sum(p => p.ConsultantEarningInPaise) / 100m;

            // Calculate monthly earnings (current month)
            var currentMonth = DateTime.UtcNow.Month;
            var currentYear = DateTime.UtcNow.Year;
            var monthlyEarnings = completedPayments
                .Where(p => p.CreatedAt.Month == currentMonth && p.CreatedAt.Year == currentYear)
                .Sum(p => p.ConsultantEarningInPaise) / 100m;

            // Get average rating from ticket ratings
            var orderIds = completedPayments.Select(p => p.OrderId).ToList();
            var averageRating = orderIds.Any()
                ? await _db.TicketRatings
                    .AsNoTracking()
                    .Where(tr => orderIds.Contains(tr.OrderId))
                    .AverageAsync(tr => (tr.ResolutionQuality + tr.ResponseTime + tr.CommunicationProfessionalism) / 3m) ?? 0m
                : 0m;

            return new ConsultantEarningsSummaryDto
            {
                TotalEarned = totalEarned,
                MonthlyEarnings = monthlyEarnings,
                PendingPayments = pendingPayments.Count,
                CompletedPayments = completedPayments.Count,
                AverageRating = averageRating,
                TotalSessions = completedPayments.Count
            };
        }

        public async Task<bool> SendPaymentReminderAsync(Guid orderId)
        {
            // Get payment and order details
            var payment = await _db.Payments
                .Include(p => p.Order).ThenInclude(o => o.CreatedByUser)
                .FirstOrDefaultAsync(p => p.OrderId == orderId);

            if (payment == null || payment.Order == null)
                throw new InvalidOperationException("Payment or order not found");

            if (payment.Status == PaymentStatus.Paid)
                throw new InvalidOperationException("Payment is already completed");

            // Placeholder for sending reminder email/SMS
            // In a real implementation, integrate with email service (SendGrid, AWS SES)
            // and SMS service (Twilio, AWS SNS)

            // For now, just log the reminder attempt
            // You would typically send an email/SMS here

            return true;
        }

        public async Task<bool> SchedulePaymentReminderAsync(Guid orderId, DateTime scheduledFor, string reminderType, string? message = null)
        {
            // Get payment and order details
            var payment = await _db.Payments
                .Include(p => p.Order).ThenInclude(o => o.CreatedByUser)
                .FirstOrDefaultAsync(p => p.OrderId == orderId);

            if (payment == null || payment.Order == null)
                throw new InvalidOperationException("Payment or order not found");

            if (payment.Status == PaymentStatus.Paid)
                throw new InvalidOperationException("Payment is already completed");

            // Placeholder for scheduling reminder
            // In a real implementation, use a job scheduler like Hangfire or Quartz.NET
            // to schedule the reminder at the specified time

            // For now, just validate the schedule time
            if (scheduledFor <= DateTime.UtcNow)
                throw new InvalidOperationException("Scheduled time must be in the future");

            // You would typically store this in a database table for scheduled jobs
            // and have a background service process them

            return true;
        }
    }
}
