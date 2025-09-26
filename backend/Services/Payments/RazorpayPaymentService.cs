using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
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

        public RazorpayPaymentService(AppDbContext db, IHttpClientFactory httpClientFactory, IConfiguration config)
        {
            _db = db;
            _httpClientFactory = httpClientFactory;
            _config = config;
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
                .Include(o => o.TimeSlot)
                .Include(o => o.Consultant)
                .FirstOrDefaultAsync(o => o.Id == orderId);
            if (order == null)
                throw new InvalidOperationException("Order not found");

            if (order.CreatedByUserId != userId)
                throw new UnauthorizedAccessException("You cannot pay for this order");

            if (order.TimeSlotId == null || order.TimeSlot == null)
                throw new InvalidOperationException("Order is missing a time slot");

            // Ensure consultant rate exists
            var profile = await _db.ConsultantProfiles.AsNoTracking()
                .FirstOrDefaultAsync(p => p.ConsultantId == order.ConsultantId);
            if (profile == null || profile.HourlyRate <= 0)
                throw new InvalidOperationException("Consultant rate not configured");

            // Compute duration in hours
            var durationHours = (decimal)(order.TimeSlot.SlotEndTime - order.TimeSlot.SlotStartTime).TotalMinutes / 60m;
            if (durationHours <= 0)
                throw new InvalidOperationException("Invalid slot duration");

            var gross = profile.HourlyRate * durationHours; // INR
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
                RazorpayKeyId = keyId
            };
        }
    }
}
