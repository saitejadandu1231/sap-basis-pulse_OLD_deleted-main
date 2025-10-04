using Microsoft.Extensions.Configuration;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using System.Text;
using System.Text.Json;

namespace SapBasisPulse.Api.Services
{
    public class SmtpEmailSender : IEmailSender
    {
        private readonly IConfiguration _config;
        private readonly ILogger<SmtpEmailSender> _logger;
        private readonly HttpClient _httpClient;
        
        public SmtpEmailSender(IConfiguration config, ILogger<SmtpEmailSender> logger, HttpClient httpClient)
        {
            _config = config;
            _logger = logger;
            _httpClient = httpClient;
        }

        public async Task SendEmailAsync(string to, string subject, string htmlBody)
        {
            _logger.LogInformation("[EMAIL] Starting to send email to {To} with subject: {Subject}", to, subject);
            
            // Check if email is disabled for development
            var smtpSection = _config.GetSection("Smtp");
            if (smtpSection["DisableInDevelopment"]?.ToLower() == "true" && 
                _config["ASPNETCORE_ENVIRONMENT"]?.ToLower() == "development")
            {
                _logger.LogInformation("Email sending is disabled in development. Would have sent email to {To} with subject {Subject}", to, subject);
                _logger.LogDebug("Email content: {Content}", htmlBody);
                return; // Skip sending in development if disabled
            }

            // Try Gmail API first if configured, then fallback to SMTP
            var emailProvider = _config["EmailProvider"];
            if (emailProvider == "GmailApi" && !string.IsNullOrEmpty(_config["Gmail:RefreshToken"]))
            {
                try
                {
                    await SendViaGmailApiAsync(to, subject, htmlBody);
                    return;
                }
                catch (Exception gmailEx)
                {
                    _logger.LogWarning(gmailEx, "[EMAIL] Gmail API failed, falling back to SMTP: {Message}", gmailEx.Message);
                    // Continue to SMTP fallback
                }
            }
            
            // SMTP fallback
            await SendViaSmtpAsync(to, subject, htmlBody);
        }

        private async Task SendViaSmtpAsync(string to, string subject, string htmlBody)
        {
            var smtpSection = _config.GetSection("Smtp");

            SmtpClient client = null;
            MailMessage mail = null;
            
            try
            {
                _logger.LogInformation("[EMAIL] Creating SMTP client for host: {Host}:{Port}", smtpSection["Host"], smtpSection["Port"]);
                
                client = new SmtpClient(smtpSection["Host"], int.Parse(smtpSection["Port"]))
                {
                    Credentials = new NetworkCredential(smtpSection["Username"], smtpSection["Password"]),
                    EnableSsl = bool.Parse(smtpSection["EnableSsl"] ?? "true"),
                    Timeout = 15000 // 15 seconds timeout to match our cancellation token
                };
                
                _logger.LogInformation("[EMAIL] SMTP client created. EnableSsl: {EnableSsl}, Username: {Username}, Timeout: {Timeout}ms", 
                    client.EnableSsl, smtpSection["Username"], client.Timeout);
                
                // Test TCP connection with fallback ports
                var originalPort = int.Parse(smtpSection["Port"]);
                var host = smtpSection["Host"];
                var workingPort = originalPort;
                
                _logger.LogInformation("[EMAIL] Testing TCP connection to {Host}:{Port}...", host, originalPort);
                try
                {
                    using var tcpClient = new System.Net.Sockets.TcpClient();
                    var connectTask = tcpClient.ConnectAsync(host, originalPort);
                    await connectTask.WaitAsync(TimeSpan.FromSeconds(5));
                    _logger.LogInformation("[EMAIL] TCP connection successful to {Host}:{Port}", host, originalPort);
                }
                catch (Exception tcpEx)
                {
                    _logger.LogWarning("[EMAIL] TCP connection failed to {Host}:{Port}, trying port 465...", host, originalPort);
                    
                    try
                    {
                        using var tcpClient = new System.Net.Sockets.TcpClient();
                        var connectTask = tcpClient.ConnectAsync(host, 465);
                        await connectTask.WaitAsync(TimeSpan.FromSeconds(5));
                        workingPort = 465;
                        _logger.LogInformation("[EMAIL] TCP connection successful to {Host}:465", host);
                        
                        // Recreate SMTP client with working port
                        client.Dispose();
                        client = new SmtpClient(host, 465)
                        {
                            Credentials = new NetworkCredential(smtpSection["Username"], smtpSection["Password"]),
                            EnableSsl = true,
                            Timeout = 15000
                        };
                        _logger.LogInformation("[EMAIL] Switched to port 465 for SMTP connection");
                    }
                    catch (Exception altEx)
                    {
                        _logger.LogError(altEx, "[EMAIL] Both ports 587 and 465 failed for {Host}", host);
                        throw new InvalidOperationException($"Cannot reach Gmail SMTP server on any port: {tcpEx.Message}", tcpEx);
                    }
                }
                
                mail = new MailMessage();
                mail.From = new MailAddress(smtpSection["From"], "Yuktor SAP BASIS Support");
                mail.To.Add(new MailAddress(to));
                mail.Subject = subject;
                mail.Body = htmlBody;
                mail.IsBodyHtml = true;
                
                _logger.LogInformation("[EMAIL] Mail message created. Attempting to send from {From} to {To}...", smtpSection["From"], to);
                
                var startTime = DateTime.UtcNow;
                await client.SendMailAsync(mail);
                var endTime = DateTime.UtcNow;
                
                _logger.LogInformation("[EMAIL] Email sent successfully to {To} in {Duration}ms", to, (endTime - startTime).TotalMilliseconds);
                
                _logger.LogInformation("[EMAIL] Email sent successfully to {To}", to);
            }
            catch (SmtpException smtpEx)
            {
                _logger.LogError(smtpEx, "[EMAIL] SMTP error sending email to {To}. StatusCode: {StatusCode}", 
                    to, smtpEx.StatusCode);
                
                // In production, we still want to continue registration even if email fails
                if (_config["ASPNETCORE_ENVIRONMENT"]?.ToLower() == "production")
                {
                    _logger.LogWarning("[EMAIL] Continuing registration despite email failure in production");
                }
                else
                {
                    throw;
                }
            }
            catch (System.Exception ex)
            {
                _logger.LogError(ex, "[EMAIL] General error sending email to {To}. Error: {Message}", to, ex.Message);
                
                // In production, we still want to continue registration even if email fails
                if (_config["ASPNETCORE_ENVIRONMENT"]?.ToLower() == "production")
                {
                    _logger.LogWarning("[EMAIL] Continuing registration despite email failure in production");
                }
                else
                {
                    throw;
                }
            }
            finally
            {
                mail?.Dispose();
                client?.Dispose();
                _logger.LogInformation("[EMAIL] Email sending process completed for {To}", to);
            }
        }

        private async Task SendViaGmailApiAsync(string to, string subject, string htmlBody)
        {
            var gmailSection = _config.GetSection("Gmail");
            
            _logger.LogInformation("[GMAIL-API] Starting to send email to {To} with subject: {Subject}", to, subject);
            
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
                throw; // Re-throw to allow fallback to SMTP
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
