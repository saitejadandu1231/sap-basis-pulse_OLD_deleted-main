using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Text;
using System.Text.Json;

namespace SapBasisPulse.Api.Services
{
    public class BrevoEmailSender : IEmailSender
    {
        private readonly IConfiguration _config;
        private readonly ILogger<BrevoEmailSender> _logger;
        private readonly HttpClient _httpClient;
        
        public BrevoEmailSender(IConfiguration config, ILogger<BrevoEmailSender> logger, HttpClient httpClient)
        {
            _config = config;
            _logger = logger;
            _httpClient = httpClient;
        }

        public async Task SendEmailAsync(string to, string subject, string htmlBody)
        {
            _logger.LogInformation("[BREVO] Starting to send email to {To} with subject: {Subject}", to, subject);
            
            // Check if email is disabled for development
            var brevoSection = _config.GetSection("Brevo");
            if (brevoSection["DisableInDevelopment"]?.ToLower() == "true" && 
                _config["ASPNETCORE_ENVIRONMENT"]?.ToLower() == "development")
            {
                _logger.LogInformation("Email sending is disabled in development. Would have sent email to {To} with subject {Subject}", to, subject);
                _logger.LogDebug("Email content: {Content}", htmlBody);
                return; // Skip sending in development if disabled
            }

            try
            {
                await SendViaBrevoApiAsync(to, subject, htmlBody);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[BREVO] Error sending email to {To}. Error: {Message}", to, ex.Message);
                
                // In production, we still want to continue registration even if email fails
                if (_config["ASPNETCORE_ENVIRONMENT"]?.ToLower() == "production")
                {
                    _logger.LogWarning("[BREVO] Continuing registration despite email failure in production");
                }
                else
                {
                    throw;
                }
            }
        }

        private async Task SendViaBrevoApiAsync(string to, string subject, string htmlBody)
        {
            var brevoSection = _config.GetSection("Brevo");
            var apiKey = brevoSection["ApiKey"];
            
            if (string.IsNullOrEmpty(apiKey))
            {
                throw new InvalidOperationException("Brevo API key is not configured");
            }

            _logger.LogInformation("[BREVO] Preparing email request for {To}", to);

            // Create the email request payload
            // Extract a reasonable name from the email address (part before @)
            var recipientName = to.Contains("@") ? to.Substring(0, to.IndexOf("@")) : "User";
            
            // Ensure the name is not empty or null
            recipientName = string.IsNullOrWhiteSpace(recipientName) ? "User" : recipientName;
            
            _logger.LogInformation("[BREVO] Using recipient name: '{RecipientName}' for email: {Email}", recipientName, to);
            
            var emailRequest = new
            {
                sender = new
                {
                    name = brevoSection["FromName"] ?? "Yuktor SAP BASIS Support",
                    email = brevoSection["FromEmail"] ?? "noreply@yuktor.com"
                },
                to = new[]
                {
                    new { email = to, name = recipientName }
                },
                subject = subject,
                htmlContent = htmlBody
            };

            var json = JsonSerializer.Serialize(emailRequest, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });
            
            _logger.LogInformation("[BREVO] Request payload: {Json}", json);
            
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Set up HTTP client headers
            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("api-key", apiKey);
            _httpClient.DefaultRequestHeaders.Add("accept", "application/json");

            _logger.LogInformation("[BREVO] Sending email via Brevo API...");
            
            var startTime = DateTime.UtcNow;
            var response = await _httpClient.PostAsync("https://api.brevo.com/v3/smtp/email", content);
            var endTime = DateTime.UtcNow;
            
            if (response.IsSuccessStatusCode)
            {
                var responseContent = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("[BREVO] Email sent successfully to {To} in {Duration}ms. Response: {Response}", 
                    to, (endTime - startTime).TotalMilliseconds, responseContent);
            }
            else
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError("[BREVO] Failed to send email. Status: {Status}, Error: {Error}", 
                    response.StatusCode, errorContent);
                throw new InvalidOperationException($"Brevo API error: {response.StatusCode} - {errorContent}");
            }
        }
    }
}