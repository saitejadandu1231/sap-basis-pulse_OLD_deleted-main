using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SapBasisPulse.Api.Data;
using SapBasisPulse.Api.Entities;

namespace SapBasisPulse.Api.Services
{
    public interface IEscrowService
    {
        Task<bool> PlacePaymentInEscrowAsync(Guid paymentId, string releaseCondition, string? notes = null);
        Task<bool> ReleasePaymentFromEscrowAsync(Guid paymentId, string? notes = null);
        Task<bool> CancelEscrowAsync(Guid paymentId, string? notes = null);
        Task<bool> CheckAndAutoReleaseEscrowAsync(Guid paymentId);
        Task<Payment?> GetPaymentAsync(Guid paymentId);
    }

    public class EscrowService : IEscrowService
    {
        private readonly AppDbContext _db;
        private readonly ILogger<EscrowService> _logger;
        private readonly IEscrowNotificationService _notificationService;

        public EscrowService(AppDbContext db, ILogger<EscrowService> logger, IEscrowNotificationService notificationService)
        {
            _db = db;
            _logger = logger;
            _notificationService = notificationService;
        }

        public async Task<bool> PlacePaymentInEscrowAsync(Guid paymentId, string releaseCondition, string? notes = null)
        {
            try
            {
                var payment = await _db.Payments.FindAsync(paymentId);
                if (payment == null)
                {
                    _logger.LogWarning("Payment {PaymentId} not found for escrow", paymentId);
                    return false;
                }

                if (payment.Status != PaymentStatus.Paid)
                {
                    _logger.LogWarning("Payment {PaymentId} is not in Paid status, cannot place in escrow", paymentId);
                    return false;
                }

                if (payment.IsInEscrow)
                {
                    _logger.LogWarning("Payment {PaymentId} is already in escrow", paymentId);
                    return false;
                }

                payment.IsInEscrow = true;
                payment.Status = PaymentStatus.InEscrow;
                payment.EscrowInitiatedAt = DateTime.UtcNow;
                payment.EscrowReleaseCondition = releaseCondition;
                payment.EscrowNotes = notes;

                await _db.SaveChangesAsync();

                _logger.LogInformation("Payment {PaymentId} placed in escrow with condition: {Condition}", paymentId, releaseCondition);

                // Send notification about escrow placement
                var message = $"Your payment of ₹{payment.AmountInPaise / 100} has been placed in escrow. Funds will be released to the consultant once the service is completed.";
                await _notificationService.NotifyEscrowStatusChangeAsync(paymentId, "InEscrow", message);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error placing payment {PaymentId} in escrow", paymentId);
                return false;
            }
        }

        public async Task<bool> ReleasePaymentFromEscrowAsync(Guid paymentId, string? notes = null)
        {
            try
            {
                var payment = await _db.Payments.FindAsync(paymentId);
                if (payment == null)
                {
                    _logger.LogWarning("Payment {PaymentId} not found for escrow release", paymentId);
                    return false;
                }

                if (!payment.IsInEscrow || (payment.Status != PaymentStatus.InEscrow && payment.Status != PaymentStatus.EscrowReadyForRelease))
                {
                    _logger.LogWarning("Payment {PaymentId} is not in escrow or ready for release", paymentId);
                    return false;
                }

                payment.IsInEscrow = false;
                payment.Status = PaymentStatus.PayoutInitiated; // Ready for consultant payout
                payment.EscrowReleasedAt = DateTime.UtcNow;

                if (!string.IsNullOrEmpty(notes))
                {
                    payment.EscrowNotes = string.IsNullOrEmpty(payment.EscrowNotes)
                        ? notes
                        : $"{payment.EscrowNotes}; Release: {notes}";
                }

                await _db.SaveChangesAsync();

                _logger.LogInformation("Payment {PaymentId} released from escrow", paymentId);
                
                // Send notifications
                await _notificationService.NotifyEscrowStatusChangeAsync(
                    paymentId, 
                    "EscrowReleased", 
                    "Your escrow payment has been released and funds are now available."
                );
                
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error releasing payment {PaymentId} from escrow", paymentId);
                return false;
            }
        }

        public async Task<bool> CancelEscrowAsync(Guid paymentId, string? notes = null)
        {
            try
            {
                var payment = await _db.Payments.FindAsync(paymentId);
                if (payment == null)
                {
                    _logger.LogWarning("Payment {PaymentId} not found for escrow cancellation", paymentId);
                    return false;
                }

                if (!payment.IsInEscrow || payment.Status != PaymentStatus.InEscrow)
                {
                    _logger.LogWarning("Payment {PaymentId} is not in escrow", paymentId);
                    return false;
                }

                payment.IsInEscrow = false;
                payment.Status = PaymentStatus.EscrowCancelled;
                payment.EscrowCancelledAt = DateTime.UtcNow;

                if (!string.IsNullOrEmpty(notes))
                {
                    payment.EscrowNotes = string.IsNullOrEmpty(payment.EscrowNotes)
                        ? notes
                        : $"{payment.EscrowNotes}; Cancelled: {notes}";
                }

                await _db.SaveChangesAsync();

                _logger.LogInformation("Escrow cancelled for payment {PaymentId}", paymentId);
                
                // Send notifications
                await _notificationService.NotifyEscrowStatusChangeAsync(
                    paymentId, 
                    "EscrowCancelled", 
                    "Your escrow payment has been cancelled. Please contact support for further assistance."
                );
                
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cancelling escrow for payment {PaymentId}", paymentId);
                return false;
            }
        }

        public async Task<bool> CheckAndAutoReleaseEscrowAsync(Guid paymentId)
        {
            try
            {
                var payment = await _db.Payments
                    .Include(p => p.Order)
                    .FirstOrDefaultAsync(p => p.Id == paymentId);

                if (payment == null || !payment.IsInEscrow || payment.Status != PaymentStatus.InEscrow)
                {
                    return false;
                }

                bool shouldRelease = false;
                string releaseReason = string.Empty;

                switch (payment.EscrowReleaseCondition)
                {
                    case "ServiceCompleted":
                        // Check if the order is completed
                        if (payment.Order?.Status?.StatusCode == "Closed")
                        {
                            shouldRelease = true;
                            releaseReason = "Service marked as completed";
                        }
                        break;

                    case "AdminApproval":
                        // Manual release by admin only - don't auto-release
                        break;

                    case "TimeBased":
                        // Release after 30 days in escrow
                        if (payment.EscrowInitiatedAt.HasValue &&
                            (DateTime.UtcNow - payment.EscrowInitiatedAt.Value).TotalDays >= 30)
                        {
                            shouldRelease = true;
                            releaseReason = "30-day escrow period completed";
                        }
                        break;

                    case "Manual":
                        // Manual release only - don't auto-release
                        break;

                    default:
                        _logger.LogWarning("Unknown escrow release condition: {Condition}", payment.EscrowReleaseCondition);
                        break;
                }

                if (shouldRelease)
                {
                    return await ReleasePaymentFromEscrowAsync(paymentId, releaseReason);
                }

                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking auto-release for payment {PaymentId}", paymentId);
                return false;
            }
        }

        public async Task<Payment?> GetPaymentAsync(Guid paymentId)
        {
            return await _db.Payments.FindAsync(paymentId);
        }
    }
}