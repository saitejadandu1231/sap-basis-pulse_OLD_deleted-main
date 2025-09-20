using System.Threading.Tasks;

namespace SapBasisPulse.Api.Services
{
    public interface IEmailSender
    {
        Task SendEmailAsync(string to, string subject, string htmlBody);
    }
}
