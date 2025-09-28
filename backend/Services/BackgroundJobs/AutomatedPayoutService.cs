using Hangfire;
using Microsoft.EntityFrameworkCore;
using SapBasisPulse.Api.Data;
using SapBasisPulse.Api.Entities;
using SapBasisPulse.Api.Services.Payments;

namespace SapBasisPulse.Api.Services.BackgroundJobs;

public class AutomatedPayoutService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<AutomatedPayoutService> _logger;

    public AutomatedPayoutService(IServiceProvider serviceProvider, ILogger<AutomatedPayoutService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    /// <summary>
    /// Processes automated payouts for completed orders that are ready for payout
    /// This job should run periodically (e.g., daily)
    /// </summary>
    [AutomaticRetry(Attempts = 3, DelaysInSeconds = new[] { 60, 300, 900 })]
    public async Task ProcessAutomatedPayouts()
    {
        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var paymentService = scope.ServiceProvider.GetRequiredService<IPaymentService>();

        try
        {
            _logger.LogInformation("Starting automated payout processing...");

            // Get admin payment settings
            var adminSettings = await dbContext.AdminPaymentSettings.FirstOrDefaultAsync();
            if (adminSettings == null || !adminSettings.PaymentsEnabled)
            {
                _logger.LogInformation("Automated payouts are disabled in admin settings");
                return;
            }

            // Find orders that are completed and haven't been paid out yet
            var completedOrders = await dbContext.Orders
                .Include(o => o.Consultant)
                .Where(o => o.StatusId == GetCompletedStatusId(dbContext)) // Assuming there's a completed status
                .Where(o => o.ConsultantId != null)
                .ToListAsync();

            // Get payments for these orders
            var orderIds = completedOrders.Select(o => o.Id).ToList();
            var payments = await dbContext.Payments
                .Where(p => orderIds.Contains(p.OrderId))
                .Where(p => p.Status == PaymentStatus.Paid) // Payment captured but not yet paid out
                .Where(p => p.PayoutId == null) // Not yet paid out
                .ToListAsync();

            // Join orders with payments
            var ordersWithPayments = completedOrders
                .Join(payments, o => o.Id, p => p.OrderId, (o, p) => new { Order = o, Payment = p })
                .ToList();

            _logger.LogInformation($"Found {ordersWithPayments.Count} completed orders eligible for payout");

            _logger.LogInformation($"Found {completedOrders.Count} completed orders eligible for payout");

            int successCount = 0;
            int failureCount = 0;

            foreach (var orderPayment in ordersWithPayments)
            {
                try
                {
                    await ProcessPayoutForOrder(orderPayment.Order, orderPayment.Payment, paymentService, adminSettings.PlatformCommissionPercent);
                    successCount++;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Failed to process payout for order {orderPayment.Order.Id}");
                    failureCount++;
                }
            }

            _logger.LogInformation($"Automated payout processing completed. Success: {successCount}, Failures: {failureCount}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in automated payout processing");
            throw; // Let Hangfire handle retry
        }
    }

    /// <summary>
    /// Processes payout for a specific order
    /// </summary>
    private async Task ProcessPayoutForOrder(Order order, Payment payment, IPaymentService paymentService, decimal platformCommissionPercent)
    {
        if (order.Consultant == null)
        {
            _logger.LogWarning($"Order {order.Id} missing consultant information");
            return;
        }

        // Calculate consultant earning (after platform commission)
        var totalAmount = payment.AmountInPaise;
        var platformFee = (long)(totalAmount * (platformCommissionPercent / 100m));
        var consultantEarning = totalAmount - platformFee;

        _logger.LogInformation($"Processing payout for Order {order.Id}: Total={totalAmount}, PlatformFee={platformFee}, ConsultantEarning={consultantEarning}");

        // Process the payout via Razorpay
        try
        {
            await paymentService.ProcessPayoutAsync(order.Id);
            _logger.LogInformation($"Successfully initiated payout for Order {order.Id}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Failed to process payout for Order {order.Id}");
            throw;
        }
    }

    /// <summary>
    /// Sends payment reminders for overdue payments
    /// This job should run periodically (e.g., daily)
    /// </summary>
    [AutomaticRetry(Attempts = 3, DelaysInSeconds = new[] { 60, 300, 900 })]
    public async Task SendPaymentReminders()
    {
        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var paymentService = scope.ServiceProvider.GetRequiredService<IPaymentService>();

        try
        {
            _logger.LogInformation("Starting payment reminder processing...");

            // Find payments that are overdue (created more than 7 days ago and still pending)
            var overduePayments = await dbContext.Payments
                .Include(p => p.Order)
                .ThenInclude(o => o.CreatedByUser)
                .Where(p => p.Status == PaymentStatus.Created) // Payment initiated but not captured
                .Where(p => p.CreatedAt < DateTime.UtcNow.AddDays(-7)) // Older than 7 days
                .Where(p => p.Order != null && p.Order.CreatedByUser != null)
                .ToListAsync();

            _logger.LogInformation($"Found {overduePayments.Count} overdue payments for reminders");

            int reminderCount = 0;

            foreach (var payment in overduePayments)
            {
                try
                {
                    // Send reminder via payment service
                    var reminderSent = await paymentService.SendPaymentReminderAsync(payment.OrderId);

                    if (reminderSent)
                    {
                        reminderCount++;
                        _logger.LogInformation($"Sent payment reminder for Order {payment.OrderId}");
                    }
                    else
                    {
                        _logger.LogWarning($"Failed to send reminder for Order {payment.OrderId}");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Error sending reminder for payment {payment.Id}");
                }
            }

            _logger.LogInformation($"Payment reminder processing completed. Sent {reminderCount} reminders");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in payment reminder processing");
            throw; // Let Hangfire handle retry
        }
    }

    /// <summary>
    /// Helper method to get the completed status ID
    /// </summary>
    private int GetCompletedStatusId(AppDbContext dbContext)
    {
        // This should be replaced with actual logic to get the completed status
        // For now, we'll assume there's a status with "completed" in the name
        var completedStatus = dbContext.StatusMaster
            .FirstOrDefault(s => s.StatusCode.ToLower().Contains("completed") ||
                               s.StatusName.ToLower().Contains("completed"));

        if (completedStatus != null)
        {
            return completedStatus.Id;
        }

        // Fallback - you might want to hardcode this or get it from configuration
        _logger.LogWarning("Could not find completed status, using default");
        return 0; // This should be replaced with actual completed status ID
    }
}