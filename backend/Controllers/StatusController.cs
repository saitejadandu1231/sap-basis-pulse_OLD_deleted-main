using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SapBasisPulse.Api.Data;
using SapBasisPulse.Api.Entities;
using System.Security.Claims;

namespace SapBasisPulse.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class StatusController : ControllerBase
    {
        private readonly AppDbContext _context;

        public StatusController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("health")]
        [AllowAnonymous]
        public IActionResult Health()
        {
            return Ok(new { 
                status = "healthy", 
                timestamp = DateTime.UtcNow,
                version = "1.0.0",
                environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development"
            });
        }

        [HttpGet("options")]
        public async Task<IActionResult> GetStatusOptions()
        {
            var statusOptions = await _context.StatusMaster
                .Where(sm => sm.IsActive)
                .OrderBy(sm => sm.SortOrder)
                .Select(sm => new
                {
                    sm.Id,
                    sm.StatusCode,
                    sm.StatusName,
                    sm.Description,
                    sm.ColorCode,
                    sm.IconCode
                })
                .ToListAsync();

            return Ok(statusOptions);
        }

        [HttpGet("history/{orderId}")]
        public async Task<IActionResult> GetStatusHistory(Guid orderId)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var userRole = User.FindFirstValue(ClaimTypes.Role);

            // For customers, ensure they can only view their own ticket history
            if (userRole == "Customer")
            {
                var order = await _context.Orders
                    .Where(o => o.Id == orderId && o.CreatedByUserId == userId)
                    .FirstOrDefaultAsync();

                if (order == null)
                {
                    return NotFound(new { error = "Ticket not found or access denied" });
                }
            }

            var statusHistory = await _context.StatusChangeLogs
                .Where(scl => scl.OrderId == orderId)
                .Include(scl => scl.FromStatus)
                .Include(scl => scl.ToStatus)
                .Include(scl => scl.ChangedByUser)
                .OrderBy(scl => scl.ChangedAt)
                .Select(scl => new
                {
                    scl.Id,
                    scl.ChangedAt,
                    FromStatus = scl.FromStatus.StatusName,
                    ToStatus = scl.ToStatus.StatusName,
                    ChangedBy = scl.ChangedByUser.FirstName + " " + scl.ChangedByUser.LastName,
                    scl.Comment,
                    scl.IpAddress
                })
                .ToListAsync();

            return Ok(statusHistory);
        }
    }
}