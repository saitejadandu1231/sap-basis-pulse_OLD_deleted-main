using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SapBasisPulse.Api.Data;
using SapBasisPulse.Api.DTOs;
using SapBasisPulse.Api.Entities;
using System.Security.Claims;

namespace SapBasisPulse.Api.Controllers
{
    [ApiController]
    [Route("api/consultant/profile")]
    [Authorize(Roles = "Consultant,Admin")]
    public class ConsultantProfileController : ControllerBase
    {
        private readonly AppDbContext _db;
        public ConsultantProfileController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<ActionResult<ConsultantProfileDto>> Get()
        {
            var consultantId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var profile = await _db.ConsultantProfiles.AsNoTracking().FirstOrDefaultAsync(p => p.ConsultantId == consultantId);
            if (profile == null)
            {
                return Ok(new ConsultantProfileDto { HourlyRate = 0, UPIId = null, IsVerified = false });
            }
            return Ok(new ConsultantProfileDto { HourlyRate = profile.HourlyRate, UPIId = profile.UPIId, IsVerified = profile.IsVerified });
        }

        [HttpPut]
        public async Task<ActionResult<ConsultantProfileDto>> Update([FromBody] ConsultantProfileDto dto)
        {
            var consultantId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var profile = await _db.ConsultantProfiles.FirstOrDefaultAsync(p => p.ConsultantId == consultantId);
            if (profile == null)
            {
                profile = new ConsultantProfile { ConsultantId = consultantId, HourlyRate = dto.HourlyRate, UPIId = dto.UPIId, IsVerified = false };
                _db.ConsultantProfiles.Add(profile);
            }
            else
            {
                profile.HourlyRate = dto.HourlyRate;
                profile.UPIId = dto.UPIId;
                profile.UpdatedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync();
            return Ok(new ConsultantProfileDto { HourlyRate = profile.HourlyRate, UPIId = profile.UPIId, IsVerified = profile.IsVerified });
        }
    }
}
