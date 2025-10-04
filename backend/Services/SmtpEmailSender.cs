using Microsoft.Extensions.Configuration;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace SapBasisPulse.Api.Services
{
    public class SmtpEmailSender : IEmailSender
    {
        private readonly IConfiguration _config;
        private readonly ILogger<SmtpEmailSender> _logger;
        public SmtpEmailSender(IConfiguration config, ILogger<SmtpEmailSender> logger)
        {
            _config = config;
            _logger = logger;
        }

        public async Task SendEmailAsync(string to, string subject, string htmlBody)
        {
            var smtpSection = _config.GetSection("Smtp");
            
            _logger.LogInformation("[EMAIL] Starting to send email to {To} with subject: {Subject}", to, subject);
            
            // Check if email is disabled for development
            if (smtpSection["DisableInDevelopment"]?.ToLower() == "true" && 
                _config["ASPNETCORE_ENVIRONMENT"]?.ToLower() == "development")
            {
                _logger.LogInformation("Email sending is disabled in development. Would have sent email to {To} with subject {Subject}", to, subject);
                _logger.LogDebug("Email content: {Content}", htmlBody);
                return; // Skip sending in development if disabled
            }

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
                
                // Test TCP connection first
                _logger.LogInformation("[EMAIL] Testing TCP connection to {Host}:{Port}...", smtpSection["Host"], smtpSection["Port"]);
                try
                {
                    using var tcpClient = new System.Net.Sockets.TcpClient();
                    var connectTask = tcpClient.ConnectAsync(smtpSection["Host"], int.Parse(smtpSection["Port"]));
                    await connectTask.WaitAsync(TimeSpan.FromSeconds(10));
                    _logger.LogInformation("[EMAIL] TCP connection successful to Gmail SMTP server");
                }
                catch (Exception tcpEx)
                {
                    _logger.LogError(tcpEx, "[EMAIL] TCP connection failed to {Host}:{Port}", smtpSection["Host"], smtpSection["Port"]);
                    throw new InvalidOperationException($"Cannot reach Gmail SMTP server: {tcpEx.Message}", tcpEx);
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
    }
}
