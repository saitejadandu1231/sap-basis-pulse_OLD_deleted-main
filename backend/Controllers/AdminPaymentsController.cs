using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SapBasisPulse.Api.Data;
using SapBasisPulse.Api.Entities;

namespace SapBasisPulse.Api.Controllers
{
    [ApiController]
    [Route("api/admin/payments")] 
    [Authorize(Roles = "Admin")]
    public class AdminPaymentsController : ControllerBase
    {
        private readonly AppDbContext _db;
        public AdminPaymentsController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet("settings")]
        public async Task<ActionResult<AdminPaymentSettings>> GetSettings()
        {
            var settings = await _db.AdminPaymentSettings.AsNoTracking().FirstOrDefaultAsync();
            if (settings == null)
            {
                settings = new AdminPaymentSettings();
                _db.AdminPaymentSettings.Add(settings);
                await _db.SaveChangesAsync();
            }
            return Ok(settings);
        }

        [HttpPut("settings")]
        public async Task<ActionResult<AdminPaymentSettings>> UpdateSettings([FromBody] AdminPaymentSettings incoming)
        {
            var settings = await _db.AdminPaymentSettings.FirstOrDefaultAsync();
            if (settings == null)
            {
                settings = new AdminPaymentSettings();
                _db.AdminPaymentSettings.Add(settings);
            }

            settings.PaymentsEnabled = incoming.PaymentsEnabled;
            settings.Currency = string.IsNullOrWhiteSpace(incoming.Currency) ? settings.Currency : incoming.Currency;
            settings.PlatformCommissionPercent = incoming.PlatformCommissionPercent;
            settings.RazorpayKeyIdHint = incoming.RazorpayKeyIdHint;
            settings.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(settings);
        }
    }
}
