using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using SapBasisPulse.Api.Data;
using SapBasisPulse.Api.Entities;
using SapBasisPulse.Api.DTOs;
using SapBasisPulse.Api.Services;

namespace SapBasisPulse.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentsWebhookController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IConfiguration _config;
        private readonly ILogger<PaymentsWebhookController> _logger;
        private readonly IEscrowNotificationService _notificationService;
        private readonly IEscrowService _escrowService;

        public PaymentsWebhookController(AppDbContext db, IConfiguration config, ILogger<PaymentsWebhookController> logger, IEscrowNotificationService notificationService, IEscrowService escrowService)
        {
            _db = db;
            _config = config;
            _logger = logger;
            _notificationService = notificationService;
            _escrowService = escrowService;
        }

        [HttpPost]
        public async Task<IActionResult> Post()
        {
            var secret = _config["Razorpay:WebhookSecret"] ?? _config["RAZORPAY_WEBHOOK_SECRET"];
            if (string.IsNullOrEmpty(secret))
            {
                _logger.LogWarning("Razorpay webhook secret not configured");
                return StatusCode(500);
            }

            // Read raw body
            string body;
            using (var reader = new StreamReader(Request.Body))
            {
                body = await reader.ReadToEndAsync();
            }

            // Validate signature header
            if (!Request.Headers.TryGetValue("X-Razorpay-Signature", out var sigHeader))
            {
                _logger.LogWarning("Missing Razorpay signature header");
                return BadRequest();
            }

            var expectedSig = ComputeHmacSha256(body, secret);
            if (!string.Equals(expectedSig, sigHeader.ToString(), StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogWarning("Invalid Razorpay webhook signature");
                return BadRequest();
            }

            // Parse event
            RazorpayWebhookPayload? payload = null;
            try
            {
                payload = JsonSerializer.Deserialize<RazorpayWebhookPayload>(body);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to deserialize Razorpay webhook payload");
                return BadRequest();
            }

            if (payload == null)
            {
                _logger.LogWarning("Empty webhook payload");
                return BadRequest();
            }

            try
            {
                // We handle payment events. payload.Payload contains nested objects; extract payment entity
                if (payload.Event == "payment.captured" || payload.Event == "payment.failed")
                {
                    // Navigate payload to payment.entity
                    if (payload.Payload.TryGetProperty("payment", out var paymentWrapper) && paymentWrapper.TryGetProperty("entity", out var entity))
                    {
                        var rzpPayment = JsonSerializer.Deserialize<RazorpayEntityPayment>(entity.GetRawText());
                        if (rzpPayment != null)
                        {
                            // Find Payment by RazorpayOrderId
                            var payment = await _db.Payments.FirstOrDefaultAsync(p => p.RazorpayOrderId == rzpPayment.OrderId);
                            if (payment == null)
                            {
                                _logger.LogInformation("Payment not found for Razorpay order id {OrderId}", rzpPayment.OrderId);
                                return Ok(); // swallow to avoid webhook retries for unknown ids
                            }

                            // Idempotent update
                            if (payload.Event == "payment.captured")
                            {
                                if (payment.Status != PaymentStatus.Paid)
                                {
                                    payment.Status = PaymentStatus.Paid;
                                    payment.CapturedAt = DateTime.UtcNow;
                                    payment.RazorpayPaymentId = rzpPayment.Id;
                                    await _db.SaveChangesAsync();
                                }
                            }
                            else if (payload.Event == "payment.failed")
                            {
                                if (payment.Status != PaymentStatus.Failed)
                                {
                                    payment.Status = PaymentStatus.Failed;
                                    payment.FailedAt = DateTime.UtcNow;
                                    payment.RazorpayPaymentId = rzpPayment.Id;
                                    await _db.SaveChangesAsync();
                                }
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing webhook event {Event}", payload.Event);
                return StatusCode(500);
            }

            return Ok();
        }

        private static string ComputeHmacSha256(string data, string secret)
        {
            var keyBytes = Encoding.UTF8.GetBytes(secret);
            var dataBytes = Encoding.UTF8.GetBytes(data);
            using var hmac = new HMACSHA256(keyBytes);
            var hash = hmac.ComputeHash(dataBytes);
            return BitConverter.ToString(hash).Replace("-", string.Empty).ToLowerInvariant();
        }
    }
}
