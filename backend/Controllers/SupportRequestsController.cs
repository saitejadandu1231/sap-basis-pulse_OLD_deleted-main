using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SapBasisPulse.Api.DTOs;
using SapBasisPulse.Api.Services;
using System.Security.Claims;

namespace SapBasisPulse.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SupportRequestsController : ControllerBase
    {
        private readonly ISupportRequestService _service;
        private readonly IAuditLogService _auditLogService;
        public SupportRequestsController(ISupportRequestService service, IAuditLogService auditLogService)
        {
            _service = service;
            _auditLogService = auditLogService;
        }

        [HttpPost]
        [Authorize(Roles = "Customer,Admin")]
        public async Task<IActionResult> Create([FromBody] CreateSupportRequestDto dto)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var result = await _service.CreateAsync(dto, userId);
            await _auditLogService.LogAsync(userId, "CreateSupportRequest", "Order", result.Id.ToString(), "Created support request", HttpContext.Connection.RemoteIpAddress?.ToString() ?? "");
            return Ok(result);
        }

        [HttpGet("recent/user")]
        [Authorize]
        public async Task<IActionResult> GetRecentForUser()
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var result = await _service.GetRecentForUserAsync(userId);
            await _auditLogService.LogAsync(userId, "GetRecentSupportRequests", "Order", "", "Fetched recent support requests", HttpContext.Connection.RemoteIpAddress?.ToString() ?? "");
            return Ok(result);
        }

        [HttpGet("recent/consultant")]
        [Authorize(Roles = "Consultant,Admin")]
        public async Task<IActionResult> GetRecentForConsultant()
        {
            var consultantId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var result = await _service.GetRecentForConsultantAsync(consultantId);
            return Ok(result);
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAll()
        {
            var result = await _service.GetAllAsync();
            return Ok(result);
        }

        [HttpPut("{orderId}/status")]
        [Authorize(Roles = "Consultant,Admin")]
        public async Task<IActionResult> UpdateStatus(Guid orderId, [FromBody] UpdateStatusDto dto)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var result = await _service.UpdateStatusAsync(orderId, dto.Status);
            
            if (!result)
            {
                return BadRequest(new { error = "Invalid ticket ID or status" });
            }

            await _auditLogService.LogAsync(userId, "UpdateTicketStatus", "Order", orderId.ToString(), $"Status changed to {dto.Status}", HttpContext.Connection.RemoteIpAddress?.ToString() ?? "");
            return Ok(new { message = "Status updated successfully" });
        }
    }
}
