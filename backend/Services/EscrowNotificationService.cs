using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SapBasisPulse.Api.Data;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace SapBasisPulse.Api.Services
{
    public interface IEscrowNotificationService
    {
        Task NotifyEscrowStatusChangeAsync(Guid paymentId, string escrowStatus, string message);
        Task NotifyEscrowAutoReleaseAsync(Guid paymentId);
        Task NotifyEscrowManualActionAsync(Guid paymentId, string action, string adminEmail);
    }

    public class EscrowNotificationService : IEscrowNotificationService
    {
        private readonly AppDbContext _context;
        private readonly IEmailSender _emailSender;
        private readonly ILogger<EscrowNotificationService> _logger;

        public EscrowNotificationService(
            AppDbContext context,
            IEmailSender emailSender,
            ILogger<EscrowNotificationService> logger)
        {
            _context = context;
            _emailSender = emailSender;
            _logger = logger;
        }

        public async Task NotifyEscrowStatusChangeAsync(Guid paymentId, string escrowStatus, string message)
        {
            try
            {
                var payment = await _context.Payments
                    .Include(p => p.Order)
                    .ThenInclude(o => o.CustomerChoice)
                    .ThenInclude(cc => cc.User)
                    .Include(p => p.Order)
                    .ThenInclude(o => o.Consultant)
                    .FirstOrDefaultAsync(p => p.Id == paymentId);

                if (payment == null)
                {
                    _logger.LogWarning("Payment not found for escrow notification: {PaymentId}", paymentId);
                    return;
                }

                var customer = payment.Order?.CustomerChoice?.User;
                var consultant = payment.Order?.Consultant;

                if (customer != null)
                {
                    // Email notification to customer
                    var customerSubject = $"Escrow Status Update - Order {payment.Order?.OrderNumber}";
                    await _emailSender.SendEscrowNotificationAsync(
                        customer.Email,
                        customerSubject,
                        message,
                        escrowStatus
                    );

                    // Additional email notification to customer via Supabase
                    var additionalMessage = $"Escrow Update: {message} - Order {payment.Order?.OrderNumber}";
                    await _emailSender.SendSmsNotificationAsync(customer.Email, additionalMessage);
                }

                if (consultant != null)
                {
                    // Email notification to consultant
                    var consultantSubject = $"Escrow Status Update - Your Service Order {payment.Order?.OrderNumber}";
                    await _emailSender.SendEscrowNotificationAsync(
                        consultant.Email,
                        consultantSubject,
                        message,
                        escrowStatus
                    );

                    // Additional email notification to consultant via Supabase
                    var additionalMessage = $"Escrow Update: {message} - Your service Order {payment.Order?.OrderNumber}";
                    await _emailSender.SendSmsNotificationAsync(consultant.Email, additionalMessage);
                }

                _logger.LogInformation("Escrow notifications sent for payment {PaymentId}, status: {EscrowStatus}", paymentId, escrowStatus);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send escrow status change notifications for payment {PaymentId}", paymentId);
                // Don't throw - notification failures shouldn't break business logic
            }
        }

        public async Task NotifyEscrowAutoReleaseAsync(Guid paymentId)
        {
            var message = "Your escrow payment has been automatically released as the service has been marked as completed.";
            await NotifyEscrowStatusChangeAsync(paymentId, "EscrowReleased", message);
        }

        public async Task NotifyEscrowManualActionAsync(Guid paymentId, string action, string adminEmail)
        {
            var message = $"Escrow payment has been {action.ToLower()} by administrator ({adminEmail}).";
            var status = action == "released" ? "EscrowReleased" : "EscrowCancelled";
            await NotifyEscrowStatusChangeAsync(paymentId, status, message);
        }
    }
}