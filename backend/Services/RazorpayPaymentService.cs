using System;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using SapBasisPulse.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace SapBasisPulse.Api.Services
{
    public class RazorpayPaymentService : IPaymentService
    {
        private readonly IConfiguration _configuration;
        private readonly AppDbContext _context;
        private readonly HttpClient _httpClient;

        public RazorpayPaymentService(IConfiguration configuration, AppDbContext context, HttpClient httpClient)
        {
            _configuration = configuration;
            _context = context;
            _httpClient = httpClient;
        }

        public async Task<(bool success, string? error, object? response)> CreatePaymentOrderAsync(decimal amount, string currency, Guid orderId)
        {
            try
            {
                var razorpayConfig = _configuration.GetSection("Razorpay");
                var keyId = razorpayConfig["KeyId"];
                var keySecret = razorpayConfig["KeySecret"];

                if (string.IsNullOrEmpty(keyId) || string.IsNullOrEmpty(keySecret))
                {
                    return (false, "Razorpay configuration is missing", null);
                }

                // Convert amount to paisa (Razorpay expects amount in smallest currency unit)
                var amountInPaisa = (int)(amount * 100);

                var orderData = new
                {
                    amount = amountInPaisa,
                    currency = currency.ToUpper(),
                    receipt = orderId.ToString(),
                    payment_capture = 1
                };

                var jsonContent = JsonSerializer.Serialize(orderData);
                var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

                // Set basic auth
                var authToken = Convert.ToBase64String(Encoding.ASCII.GetBytes($"{keyId}:{keySecret}"));
                _httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Basic", authToken);

                var response = await _httpClient.PostAsync("https://api.razorpay.com/v1/orders", content);

                if (response.IsSuccessStatusCode)
                {
                    var responseContent = await response.Content.ReadAsStringAsync();
                    var orderResponse = JsonSerializer.Deserialize<JsonElement>(responseContent);

                    // Update order with Razorpay order ID
                    var order = await _context.Orders.FindAsync(orderId);
                    if (order != null)
                    {
                        order.RazorpayOrderId = orderResponse.GetProperty("id").GetString();
                        await _context.SaveChangesAsync();
                    }

                    return (true, null, new
                    {
                        razorpayOrderId = orderResponse.GetProperty("id").GetString(),
                        amount = orderResponse.GetProperty("amount").GetInt32(),
                        currency = orderResponse.GetProperty("currency").GetString(),
                        key = keyId
                    });
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    return (false, $"Razorpay API error: {errorContent}", null);
                }
            }
            catch (Exception ex)
            {
                return (false, $"Payment order creation failed: {ex.Message}", null);
            }
        }

        public async Task<(bool success, string? error, object? response)> VerifyPaymentAsync(string razorpayOrderId, string razorpayPaymentId, string razorpaySignature)
        {
            try
            {
                var razorpayConfig = _configuration.GetSection("Razorpay");
                var keySecret = razorpayConfig["KeySecret"];

                if (string.IsNullOrEmpty(keySecret))
                {
                    return (false, "Razorpay configuration is missing", null);
                }

                // Create signature for verification
                var signatureData = $"{razorpayOrderId}|{razorpayPaymentId}";
                var expectedSignature = GenerateSignature(signatureData, keySecret);

                if (expectedSignature == razorpaySignature)
                {
                    // Find the order and update payment status
                    var order = await _context.Orders.FirstOrDefaultAsync(o => o.RazorpayOrderId == razorpayOrderId);
                    if (order != null)
                    {
                        order.PaymentStatus = "Paid";
                        order.RazorpayPaymentId = razorpayPaymentId;
                        order.PaymentCompletedAt = DateTime.UtcNow;

                        // Keep the main ticket status as "Closed" - only update payment status
                        order.LastUpdated = DateTime.UtcNow;

                        await _context.SaveChangesAsync();

                        return (true, null, new
                        {
                            orderId = order.Id,
                            paymentId = razorpayPaymentId,
                            status = "success"
                        });
                    }
                    else
                    {
                        return (false, "Order not found", null);
                    }
                }
                else
                {
                    return (false, "Payment signature verification failed", null);
                }
            }
            catch (Exception ex)
            {
                return (false, $"Payment verification failed: {ex.Message}", null);
            }
        }

        public async Task<(bool success, string? error)> UpdateOrderPaymentStatusAsync(Guid orderId, string paymentStatus, string? razorpayPaymentId = null)
        {
            try
            {
                var order = await _context.Orders.FindAsync(orderId);
                if (order == null)
                {
                    return (false, "Order not found");
                }

                order.PaymentStatus = paymentStatus;
                if (!string.IsNullOrEmpty(razorpayPaymentId))
                {
                    order.RazorpayPaymentId = razorpayPaymentId;
                }

                if (paymentStatus == "Paid")
                {
                    order.PaymentCompletedAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();
                return (true, null);
            }
            catch (Exception ex)
            {
                return (false, $"Failed to update payment status: {ex.Message}");
            }
        }

        private string GenerateSignature(string data, string key)
        {
            using (var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(key)))
            {
                var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
                return BitConverter.ToString(hash).Replace("-", "").ToLower();
            }
        }
    }
}