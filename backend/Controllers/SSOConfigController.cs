using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SapBasisPulse.Api.Data;
using SapBasisPulse.Api.DTOs;
using SapBasisPulse.Api.Entities;

namespace SapBasisPulse.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SSOConfigController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SSOConfigController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("status")]
        public async Task<IActionResult> GetSSOStatus()
        {
            try
            {
                var ssoConfig = await _context.SSOConfigurations.FirstOrDefaultAsync();
                return Ok(new
                {
                    googleEnabled = ssoConfig?.GoogleEnabled ?? false,
                    appleEnabled = ssoConfig?.AppleEnabled ?? false,
                    supabaseEnabled = ssoConfig?.SupabaseEnabled ?? false
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to fetch SSO configuration", details = ex.Message });
            }
        }

        [HttpPost("update")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateSSOConfig([FromBody] SSOConfigDto config)
        {
            try
            {
                if (config == null)
                {
                    return BadRequest(new { error = "SSO configuration is required" });
                }

                var existingConfig = await _context.SSOConfigurations.FirstOrDefaultAsync();
                if (existingConfig == null)
                {
                    existingConfig = new SSOConfiguration
                    {
                        GoogleEnabled = config.GoogleEnabled,
                        AppleEnabled = config.AppleEnabled,
                        SupabaseEnabled = config.SupabaseEnabled,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _context.SSOConfigurations.Add(existingConfig);
                }
                else
                {
                    existingConfig.GoogleEnabled = config.GoogleEnabled;
                    existingConfig.AppleEnabled = config.AppleEnabled;
                    existingConfig.SupabaseEnabled = config.SupabaseEnabled;
                    existingConfig.UpdatedAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();
                
                return Ok(new { 
                    message = "SSO configuration updated successfully",
                    config = new
                    {
                        googleEnabled = existingConfig.GoogleEnabled,
                        appleEnabled = existingConfig.AppleEnabled,
                        supabaseEnabled = existingConfig.SupabaseEnabled
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to update SSO configuration", details = ex.Message });
            }
        }

        [HttpPost("initialize")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> InitializeSSOConfig()
        {
            try
            {
                var existingConfig = await _context.SSOConfigurations.FirstOrDefaultAsync();
                if (existingConfig != null)
                {
                    return Ok(new { message = "SSO configuration already exists" });
                }

                var defaultConfig = new SSOConfiguration
                {
                    GoogleEnabled = false,
                    AppleEnabled = false,
                    SupabaseEnabled = false,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.SSOConfigurations.Add(defaultConfig);
                await _context.SaveChangesAsync();

                return Ok(new { message = "SSO configuration initialized with default settings" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to initialize SSO configuration", details = ex.Message });
            }
        }
    }
}