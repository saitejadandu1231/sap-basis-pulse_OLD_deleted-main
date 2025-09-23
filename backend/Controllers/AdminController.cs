using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SapBasisPulse.Api.Services;

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
        public AdminController(IUserService userService, ISupportRequestService supportRequestService, IAuditLogService auditLogService)
        {
            _userService = userService;
            _supportRequestService = supportRequestService;
            _auditLogService = auditLogService;
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

        // Add analytics/system settings endpoints as needed
    }
}
