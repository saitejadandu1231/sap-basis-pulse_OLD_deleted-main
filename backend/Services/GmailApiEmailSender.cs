using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Net.Http;
using System.Text;
using System.Text.Json;

namespace SapBasisPulse.Api.Services
{
    public class GmailApiEmailSender : IEmailSender
    {
        private readonly IConfiguration _config;
        private readonly ILogger<GmailApiEmailSender> _logger;
        private readonly HttpClient _httpClient;

        public GmailApiEmailSender(IConfiguration config, ILogger<GmailApiEmailSender> logger, HttpClient httpClient)
        {
            _config = config;
            _logger = logger;
            _httpClient = httpClient;
        }

        public async Task SendEmailAsync(string to, string subject, string htmlBody)
        {
            var gmailSection = _config.GetSection("Gmail");
            
            _logger.LogInformation("[GMAIL-API] Starting to send email to {To} with subject: {Subject}", to, subject);
            
            // Check if email is disabled for development
            if (_config.GetSection("Smtp")["DisableInDevelopment"]?.ToLower() == "true" && 
                _config["ASPNETCORE_ENVIRONMENT"]?.ToLower() == "development")
            {
                _logger.LogInformation("Email sending is disabled in development. Would have sent email to {To} with subject {Subject}", to, subject);
                return;
            }

            try
            {
                // Get access token using refresh token
                var accessToken = await GetAccessTokenAsync();
                if (string.IsNullOrEmpty(accessToken))
                {
                    throw new InvalidOperationException("Failed to obtain Gmail API access token");
                }

                // Create email message in RFC 2822 format
                var fromName = gmailSection["FromName"] ?? "Yuktor SAP BASIS Support";
                var fromEmail = gmailSection["FromEmail"];
                
                var emailMessage = CreateRfc2822Message(fromEmail, fromName, to, subject, htmlBody);
                var base64Message = Convert.ToBase64String(Encoding.UTF8.GetBytes(emailMessage))
                    .Replace('+', '-')
                    .Replace('/', '_')
                    .Replace("=", "");

                // Send via Gmail API
                var requestBody = new
                {
                    raw = base64Message
                };

                var json = JsonSerializer.Serialize(requestBody);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {accessToken}");

                _logger.LogInformation("[GMAIL-API] Sending email via Gmail API...");
                
                var response = await _httpClient.PostAsync("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", content);
                
                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("[GMAIL-API] Email sent successfully to {To}", to);
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("[GMAIL-API] Failed to send email. Status: {Status}, Error: {Error}", 
                        response.StatusCode, errorContent);
                    throw new InvalidOperationException($"Gmail API error: {response.StatusCode} - {errorContent}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[GMAIL-API] Error sending email to {To}. Error: {Message}", to, ex.Message);
                
                // In production, continue registration even if email fails
                if (_config["ASPNETCORE_ENVIRONMENT"]?.ToLower() == "production")
                {
                    _logger.LogWarning("[GMAIL-API] Continuing registration despite email failure in production");
                }
                else
                {
                    throw;
                }
            }
        }

        private async Task<string?> GetAccessTokenAsync()
        {
            try
            {
                var gmailSection = _config.GetSection("Gmail");
                var clientId = gmailSection["ClientId"];
                var clientSecret = gmailSection["ClientSecret"];
                var refreshToken = gmailSection["RefreshToken"];

                if (string.IsNullOrEmpty(refreshToken))
                {
                    _logger.LogError("[GMAIL-API] No refresh token configured");
                    return null;
                }

                var requestBody = new Dictionary<string, string>
                {
                    {"client_id", clientId},
                    {"client_secret", clientSecret},
                    {"refresh_token", refreshToken},
                    {"grant_type", "refresh_token"}
                };

                var formContent = new FormUrlEncodedContent(requestBody);
                
                _logger.LogInformation("[GMAIL-API] Requesting access token...");
                var response = await _httpClient.PostAsync("https://oauth2.googleapis.com/token", formContent);
                
                if (response.IsSuccessStatusCode)
                {
                    var jsonResponse = await response.Content.ReadAsStringAsync();
                    var tokenData = JsonSerializer.Deserialize<JsonElement>(jsonResponse);
                    var accessToken = tokenData.GetProperty("access_token").GetString();
                    _logger.LogInformation("[GMAIL-API] Access token obtained successfully");
                    return accessToken;
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("[GMAIL-API] Failed to get access token. Status: {Status}, Error: {Error}", 
                        response.StatusCode, errorContent);
                    return null;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[GMAIL-API] Exception getting access token: {Message}", ex.Message);
                return null;
            }
        }

        private string CreateRfc2822Message(string fromEmail, string fromName, string to, string subject, string htmlBody)
        {
            var message = new StringBuilder();
            message.AppendLine($"From: {fromName} <{fromEmail}>");
            message.AppendLine($"To: {to}");
            message.AppendLine($"Subject: {subject}");
            message.AppendLine("MIME-Version: 1.0");
            message.AppendLine("Content-Type: text/html; charset=utf-8");
            message.AppendLine("Content-Transfer-Encoding: 7bit");
            message.AppendLine();
            message.AppendLine(htmlBody);
            
            return message.ToString();
        }
    }
}