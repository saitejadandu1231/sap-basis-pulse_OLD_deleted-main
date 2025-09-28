using System.Threading.Tasks;

namespace SapBasisPulse.Api.Services
{
    public interface IEmailSender
    {
        Task SendEmailAsync(string to, string subject, string htmlBody);
        Task SendEscrowNotificationAsync(string to, string subject, string message, string escrowStatus);
        Task SendSmsNotificationAsync(string phoneNumber, string message);
    }
}
