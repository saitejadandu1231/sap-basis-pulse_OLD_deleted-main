using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SapBasisPulse.Api.Data;
using SapBasisPulse.Api.DTOs;
using System;
using System.Threading.Tasks;

namespace SapBasisPulse.Api.Controllers
{
    [ApiController]
    [Route("api/consultant-profile")] // public read-only endpoints for consultant profiles
    [Authorize] // any authenticated user can read consultant public profile (rate/verification)
    public class ConsultantProfilesPublicController : ControllerBase
    {
        private readonly AppDbContext _db;

        public ConsultantProfilesPublicController(AppDbContext db)
        {
            _db = db;
        }

        // GET: api/consultant-profile/{consultantId}
        [HttpGet("{consultantId}")]
        public async Task<ActionResult<ConsultantProfileDto>> GetByConsultantId(Guid consultantId)
        {
            var profile = await _db.ConsultantProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.ConsultantId == consultantId);

            if (profile == null)
            {
                // Return defaults if not set yet, consumers treat 0 rate as unavailable
                return Ok(new ConsultantProfileDto
                {
                    HourlyRate = 0,
                    UPIId = null,
                    IsVerified = false
                });
            }

            return Ok(new ConsultantProfileDto
            {
                HourlyRate = profile.HourlyRate,
                UPIId = null, // do not expose payout details publicly
                IsVerified = profile.IsVerified
            });
        }
    }
}
