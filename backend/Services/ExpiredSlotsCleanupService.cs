using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SapBasisPulse.Api.Services;

namespace SapBasisPulse.Api.Services
{
    public class ExpiredSlotsCleanupService : BackgroundService
    {
        private readonly ILogger<ExpiredSlotsCleanupService> _logger;
        private readonly IServiceProvider _serviceProvider;
        private readonly TimeSpan _cleanupInterval = TimeSpan.FromHours(1); // Run every hour

        public ExpiredSlotsCleanupService(
            ILogger<ExpiredSlotsCleanupService> logger,
            IServiceProvider serviceProvider)
        {
            _logger = logger;
            _serviceProvider = serviceProvider;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("ExpiredSlotsCleanupService is starting.");

            using var timer = new PeriodicTimer(_cleanupInterval);

            while (await timer.WaitForNextTickAsync(stoppingToken))
            {
                try
                {
                    await CleanupExpiredSlotsAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred while cleaning up expired slots.");
                }
            }

            _logger.LogInformation("ExpiredSlotsCleanupService is stopping.");
        }

        private async Task CleanupExpiredSlotsAsync()
        {
            using var scope = _serviceProvider.CreateScope();
            var availabilityService = scope.ServiceProvider.GetRequiredService<IConsultantAvailabilityService>();

            var deletedCount = await availabilityService.DeleteExpiredSlotsAsync();

            if (deletedCount > 0)
            {
                _logger.LogInformation("Cleaned up {Count} expired consultant availability slots.", deletedCount);
            }
        }
    }
}