using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SapBasisPulse.Api.Data;
using System.Linq;
using System.Threading.Tasks;

namespace SapBasisPulse.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AnalyticsController : ControllerBase
    {
        private readonly AppDbContext _context;
        public AnalyticsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("summary")]
        public IActionResult GetSummary()
        {
            var userCount = _context.Users.Count();
            var consultantCount = _context.Users.Count(u => u.Role == Entities.UserRole.Consultant);
            var customerCount = _context.Users.Count(u => u.Role == Entities.UserRole.Customer);
            var openTickets = _context.Orders.Include(o => o.Status).Count(o => o.Status.StatusCode == "New" || o.Status.StatusCode == "InProgress");
            var closedTickets = _context.Orders.Include(o => o.Status).Count(o => o.Status.StatusCode == "Closed");
            var totalTickets = _context.Orders.Count();
            return Ok(new
            {
                userCount,
                consultantCount,
                customerCount,
                openTickets,
                closedTickets,
                totalTickets
            });
        }

        [HttpGet("payments")]
        public async Task<IActionResult> GetPaymentAnalytics()
        {
            var payments = await _context.Payments.ToListAsync();

            var totalPayments = payments.Count;
            var totalAmount = payments.Sum(p => p.AmountInPaise) / 100m; // Convert paise to rupees
            var successfulPayments = payments.Count(p => p.Status == Entities.PaymentStatus.Paid || p.Status == Entities.PaymentStatus.EscrowReleased || p.Status == Entities.PaymentStatus.PayoutCompleted);
            var failedPayments = payments.Count(p => p.Status == Entities.PaymentStatus.Failed || p.Status == Entities.PaymentStatus.PayoutFailed);
            var pendingPayments = payments.Count(p => p.Status == Entities.PaymentStatus.Created);

            // Escrow analytics
            var escrowPayments = payments.Count(p => p.IsInEscrow);
            var releasedEscrowPayments = payments.Count(p => p.Status == Entities.PaymentStatus.EscrowReleased);
            var activeEscrowPayments = payments.Count(p => p.IsInEscrow && p.Status == Entities.PaymentStatus.InEscrow);
            var cancelledEscrowPayments = payments.Count(p => p.Status == Entities.PaymentStatus.EscrowCancelled);

            // Amount in escrow
            var totalAmountInEscrow = payments.Where(p => p.IsInEscrow && p.Status == Entities.PaymentStatus.InEscrow)
                                             .Sum(p => p.AmountInPaise) / 100m;

            // Monthly payment trends (last 12 months)
            var monthlyTrends = await _context.Payments
                .Where(p => p.CreatedAt >= DateTime.UtcNow.AddMonths(-12))
                .GroupBy(p => new { p.CreatedAt.Year, p.CreatedAt.Month })
                .Select(g => new
                {
                    Month = $"{g.Key.Year}-{g.Key.Month:D2}",
                    TotalAmount = g.Sum(p => p.AmountInPaise) / 100m,
                    PaymentCount = g.Count(),
                    SuccessfulPayments = g.Count(p => p.Status == Entities.PaymentStatus.Paid || p.Status == Entities.PaymentStatus.EscrowReleased || p.Status == Entities.PaymentStatus.PayoutCompleted)
                })
                .OrderBy(x => x.Month)
                .ToListAsync();

            // Payment method distribution - using currency as proxy for now
            var paymentMethodStats = payments
                .GroupBy(p => p.Currency)
                .Select(g => new
                {
                    Method = g.Key,
                    Count = g.Count(),
                    TotalAmount = g.Sum(p => p.AmountInPaise) / 100m
                })
                .ToList();

            return Ok(new
            {
                overview = new
                {
                    totalPayments,
                    totalAmount,
                    successfulPayments,
                    failedPayments,
                    pendingPayments,
                    successRate = totalPayments > 0 ? (decimal)successfulPayments / totalPayments * 100 : 0
                },
                escrow = new
                {
                    escrowPayments,
                    activeEscrowPayments,
                    releasedEscrowPayments,
                    cancelledEscrowPayments,
                    totalAmountInEscrow,
                    escrowRate = totalPayments > 0 ? (decimal)escrowPayments / totalPayments * 100 : 0
                },
                trends = monthlyTrends,
                paymentMethods = paymentMethodStats
            });
        }

        [HttpGet("payments/escrow-status")]
        public async Task<IActionResult> GetEscrowStatusAnalytics()
        {
            var escrowPayments = await _context.Payments
                .Where(p => p.IsInEscrow)
                .Include(p => p.Order)
                .ThenInclude(o => o.Status)
                .ToListAsync();

            var escrowByStatus = escrowPayments
                .GroupBy(p => p.Status)
                .Select(g => new
                {
                    Status = g.Key.ToString(),
                    Count = g.Count(),
                    TotalAmount = g.Sum(p => p.AmountInPaise) / 100m
                })
                .ToList();

            // Escrow aging analysis
            var now = DateTime.UtcNow;
            var escrowAging = new
            {
                lessThan7Days = escrowPayments.Count(p => p.IsInEscrow && (now - p.EscrowInitiatedAt).Value.TotalDays < 7),
                between7And30Days = escrowPayments.Count(p => p.IsInEscrow && (now - p.EscrowInitiatedAt).Value.TotalDays >= 7 && (now - p.EscrowInitiatedAt).Value.TotalDays < 30),
                moreThan30Days = escrowPayments.Count(p => p.IsInEscrow && (now - p.EscrowInitiatedAt).Value.TotalDays >= 30),
                averageEscrowDuration = escrowPayments
                    .Where(p => p.EscrowReleasedAt.HasValue)
                    .Select(p => (p.EscrowReleasedAt.Value - p.EscrowInitiatedAt.Value).TotalDays)
                    .DefaultIfEmpty(0)
                    .Average()
            };

            // Orders ready for escrow release (service completed but payment still in escrow)
            var readyForRelease = escrowPayments
                .Count(p => p.IsInEscrow &&
                           p.Status == Entities.PaymentStatus.InEscrow &&
                           p.Order != null &&
                           p.Order.Status.StatusCode == "Closed");

            return Ok(new
            {
                escrowByStatus,
                escrowAging,
                readyForRelease,
                totalEscrowPayments = escrowPayments.Count
            });
        }
    }
}
