using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SapBasisPulse.Api.Services;
using SapBasisPulse.Api.DTOs;

namespace SapBasisPulse.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly ISupportRequestService _supportRequestService;
        private readonly IAuditLogService _auditLogService;
        private readonly IEmailSettingsService _emailSettingsService;
        
        public AdminController(IUserService userService, ISupportRequestService supportRequestService, IAuditLogService auditLogService, IEmailSettingsService emailSettingsService)
        {
            _userService = userService;
            _supportRequestService = supportRequestService;
            _auditLogService = auditLogService;
            _emailSettingsService = emailSettingsService;
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _userService.GetAllAsync();
            return Ok(users);
        }

        [HttpPut("users/{id}/role")]
        public async Task<IActionResult> UpdateUserRole(Guid id, [FromBody] string role)
        {
            var result = await _userService.UpdateUserRoleAsync(id, role);
            var adminId = User.Identity?.IsAuthenticated == true ? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier) : null;
            await _auditLogService.LogAsync(adminId != null ? Guid.Parse(adminId.Value) : (Guid?)null, "UpdateUserRole", "User", id.ToString(), $"Role changed to {role}", HttpContext.Connection.RemoteIpAddress?.ToString() ?? "");
            if (!result) return BadRequest(new { error = "Invalid user or role" });
            return Ok(new { message = "Role updated" });
        }

        [HttpGet("support-requests")]
        public async Task<IActionResult> GetAllSupportRequests()
        {
            var requests = await _supportRequestService.GetAllAsync();
            var adminId = User.Identity?.IsAuthenticated == true ? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier) : null;
            await _auditLogService.LogAsync(adminId != null ? Guid.Parse(adminId.Value) : (Guid?)null, "GetAllSupportRequests", "Order", "", "Fetched all support requests", HttpContext.Connection.RemoteIpAddress?.ToString() ?? "");
            return Ok(requests);
        }

        [HttpGet("email-settings")]
        public async Task<IActionResult> GetEmailSettings()
        {
            try
            {
                var settings = new EmailSettingsDto
                {
                    EnableEmailVerification = _emailSettingsService.IsEmailVerificationEnabled(),
                    RequireEmailVerification = _emailSettingsService.IsEmailVerificationRequired(),
                    EmailVerificationTokenExpiryHours = _emailSettingsService.GetEmailVerificationTokenExpiryHours()
                };

                var adminId = User.Identity?.IsAuthenticated == true ? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier) : null;
                await _auditLogService.LogAsync(
                    adminId != null ? Guid.Parse(adminId.Value) : (Guid?)null, 
                    "GetEmailSettings", 
                    "EmailSettings", 
                    "", 
                    "Retrieved email verification settings", 
                    HttpContext.Connection.RemoteIpAddress?.ToString() ?? ""
                );

                return Ok(settings);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = $"Failed to retrieve email settings: {ex.Message}" });
            }
        }

        [HttpPut("email-settings")]
        public async Task<IActionResult> UpdateEmailSettings([FromBody] UpdateEmailSettingsDto dto)
        {
            try
            {
                // Note: This endpoint currently returns a NotImplementedException
                // because we're using appsettings.json for configuration.
                // In a production system, you would store these in the database.
                
                var adminId = User.Identity?.IsAuthenticated == true ? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier) : null;
                await _auditLogService.LogAsync(
                    adminId != null ? Guid.Parse(adminId.Value) : (Guid?)null, 
                    "UpdateEmailSettings", 
                    "EmailSettings", 
                    "", 
                    $"Attempted to update email settings: EnableEmailVerification={dto.EnableEmailVerification}, RequireEmailVerification={dto.RequireEmailVerification}", 
                    HttpContext.Connection.RemoteIpAddress?.ToString() ?? ""
                );

                await _emailSettingsService.UpdateEmailVerificationSettings(dto.EnableEmailVerification, dto.RequireEmailVerification);
                
                return Ok(new { message = "Email settings updated successfully" });
            }
            catch (NotImplementedException)
            {
                return BadRequest(new { 
                    error = "Dynamic email settings updates are not yet supported. Please update appsettings.json manually and restart the application.",
                    currentSettings = new EmailSettingsDto
                    {
                        EnableEmailVerification = _emailSettingsService.IsEmailVerificationEnabled(),
                        RequireEmailVerification = _emailSettingsService.IsEmailVerificationRequired(),
                        EmailVerificationTokenExpiryHours = _emailSettingsService.GetEmailVerificationTokenExpiryHours()
                    }
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = $"Failed to update email settings: {ex.Message}" });
            }
        }

        // Add analytics/system settings endpoints as needed
    }
}
