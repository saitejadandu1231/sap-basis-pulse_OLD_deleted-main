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
    }
}
