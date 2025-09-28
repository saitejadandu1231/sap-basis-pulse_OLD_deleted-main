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
        private readonly ISupabaseEmailService _supabaseEmailService;

        public SmtpEmailSender(IConfiguration config, ILogger<SmtpEmailSender> logger, ISupabaseEmailService supabaseEmailService)
        {
            _config = config;
            _logger = logger;
            _supabaseEmailService = supabaseEmailService;
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

        public async Task SendEscrowNotificationAsync(string to, string subject, string message, string escrowStatus)
        {
            var htmlBody = GenerateEscrowEmailHtml(subject, message, escrowStatus);
            await SendEmailAsync(to, subject, htmlBody);
        }

        public async Task SendSmsNotificationAsync(string email, string message)
        {
            // Send additional notification email via Supabase instead of SMS
            var supabaseSection = _config.GetSection("Supabase");

            // Check if additional email notifications are disabled for development
            if (supabaseSection["DisableAdditionalEmailsInDevelopment"]?.ToLower() == "true" &&
                _config["ASPNETCORE_ENVIRONMENT"]?.ToLower() == "development")
            {
                _logger.LogInformation("Additional email notifications are disabled in development. Would have sent additional email to {Email} with message: {Message}", email, message);
                return;
            }

            try
            {
                // Send a simple text-based email via Supabase as additional notification
                var subject = "SapBasis Pulse - Important Notification";
                var htmlContent = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <title>{subject}</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f8f9fa; }}
        .container {{ max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
        .header {{ text-align: center; border-bottom: 2px solid #007bff; padding-bottom: 20px; margin-bottom: 30px; }}
        .logo {{ font-size: 24px; font-weight: bold; color: #007bff; }}
        .message {{ font-size: 16px; line-height: 1.6; color: #333; margin: 20px 0; }}
        .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 14px; color: #6c757d; text-align: center; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <div class='logo'>SapBasis Pulse</div>
            <h1>Important Notification</h1>
        </div>

        <div class='message'>
            <p>{message}</p>
            <p>This is an additional notification to ensure you receive important updates about your account and services.</p>
        </div>

        <div class='footer'>
            <p>SapBasis Pulse - Professional SAP Consulting Services</p>
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>";

                await _supabaseEmailService.SendEmailAsync(email, subject, htmlContent);
                _logger.LogInformation("Additional notification email sent via Supabase to {Email}", email);
            }
            catch (System.Exception ex)
            {
                _logger.LogWarning(ex, "Failed to send additional notification email to {Email}", email);

                // Don't throw - notification failures shouldn't break business logic
                if (_config["ASPNETCORE_ENVIRONMENT"]?.ToLower() != "development")
                {
                    throw;
                }
            }
        }

        private string GenerateEscrowEmailHtml(string subject, string message, string escrowStatus)
        {
            var statusColor = escrowStatus switch
            {
                "InEscrow" => "#FFA500", // Orange
                "EscrowReleased" => "#28A745", // Green
                "EscrowCancelled" => "#DC3545", // Red
                _ => "#6C757D" // Gray
            };

            return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <title>{subject}</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f8f9fa; }}
        .container {{ max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
        .header {{ text-align: center; border-bottom: 2px solid #007bff; padding-bottom: 20px; margin-bottom: 30px; }}
        .logo {{ font-size: 24px; font-weight: bold; color: #007bff; }}
        .status-badge {{ display: inline-block; padding: 8px 16px; border-radius: 20px; color: white; font-weight: bold; background-color: {statusColor}; }}
        .message {{ font-size: 16px; line-height: 1.6; color: #333; margin: 20px 0; }}
        .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 14px; color: #6c757d; text-align: center; }}
        .highlight {{ background-color: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid {statusColor}; margin: 20px 0; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <div class='logo'>SapBasis Pulse</div>
            <h1>{subject}</h1>
        </div>
        
        <div class='status-badge'>{escrowStatus.Replace("Escrow", "Escrow ")}</div>
        
        <div class='highlight'>
            <strong>Escrow Status Update:</strong> {message}
        </div>
        
        <div class='message'>
            <p>This is an automated notification regarding your escrow payment status. Our escrow system ensures secure transactions by holding funds until service completion is verified.</p>
            
            <p>If you have any questions about this escrow status update, please contact our support team.</p>
        </div>
        
        <div class='footer'>
            <p>SapBasis Pulse - Professional SAP Consulting Services</p>
            <p>For support: support@sapbasis.com | Phone: +91-XXXXXXXXXX</p>
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>";
        }
    }
}
