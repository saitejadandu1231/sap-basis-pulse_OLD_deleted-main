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
            
            // Check if email is disabled for development
            if (smtpSection["DisableInDevelopment"]?.ToLower() == "true" && 
                _config["ASPNETCORE_ENVIRONMENT"]?.ToLower() == "development")
            {
                _logger.LogInformation("Email sending is disabled in development. Would have sent email to {To} with subject {Subject}", to, subject);
                _logger.LogDebug("Email content: {Content}", htmlBody);
                return; // Skip sending in development if disabled
            }

            var client = new SmtpClient(smtpSection["Host"], int.Parse(smtpSection["Port"]))
            {
                Credentials = new NetworkCredential(smtpSection["Username"], smtpSection["Password"]),
                EnableSsl = bool.Parse(smtpSection["EnableSsl"] ?? "true")
            };
            var mail = new MailMessage(smtpSection["From"], to, subject, htmlBody) { IsBodyHtml = true };
            try
            {
                await client.SendMailAsync(mail);
                _logger.LogInformation("Email sent successfully to {To}", to);
            }
            catch (System.Exception ex)
            {
                // In development we don't want email send failures to block user registration.
                _logger.LogWarning(ex, "Failed to send email to {To}. Continuing without blocking registration.", to);
                
                // Throw the exception if we're not in development environment to properly handle it upstream
                if (_config["ASPNETCORE_ENVIRONMENT"]?.ToLower() != "development")
                {
                    throw;
                }
            }
        }
    }
}
