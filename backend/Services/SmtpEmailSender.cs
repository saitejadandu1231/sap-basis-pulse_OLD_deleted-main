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
            var client = new SmtpClient(smtpSection["Host"], int.Parse(smtpSection["Port"]))
            {
                Credentials = new NetworkCredential(smtpSection["Username"], smtpSection["Password"]),
                EnableSsl = bool.Parse(smtpSection["EnableSsl"] ?? "true")
            };
            var mail = new MailMessage(smtpSection["From"], to, subject, htmlBody) { IsBodyHtml = true };
            try
            {
                await client.SendMailAsync(mail);
            }
            catch (System.Exception ex)
            {
                // In development we don't want email send failures to block user registration.
                _logger.LogWarning(ex, "Failed to send email to {To}. Continuing without blocking registration.", to);
            }
        }
    }
}
