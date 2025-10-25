using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using SapBasisPulse.Api.Data;
using SapBasisPulse.Api.DTOs;
using SapBasisPulse.Api.Entities;
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
        private readonly AppDbContext _context;

        public SupportRequestsController(ISupportRequestService service, IAuditLogService auditLogService, AppDbContext context)
        {
            _service = service;
            _auditLogService = auditLogService;
            _context = context;
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
        public async Task<IActionResult> GetRecentForUser([FromQuery] string? search = null)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var result = await _service.GetRecentForUserAsync(userId, search);
            await _auditLogService.LogAsync(userId, "GetRecentSupportRequests", "Order", "", $"Fetched recent support requests{(search != null ? $" with search: {search}" : "")}", HttpContext.Connection.RemoteIpAddress?.ToString() ?? "");
            return Ok(result);
        }

        [HttpGet("recent/consultant")]
        [Authorize(Roles = "Consultant,Admin")]
        public async Task<IActionResult> GetRecentForConsultant([FromQuery] string? search = null)
        {
            var consultantId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var result = await _service.GetRecentForConsultantAsync(consultantId, search);
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
        [Authorize]
        public async Task<IActionResult> UpdateStatus(Guid orderId, [FromBody] UpdateStatusDto dto)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var userRole = User.FindFirstValue(ClaimTypes.Role);

            // Basic permission check
            if (userRole != "Consultant" && userRole != "Admin" && userRole != "Customer")
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { error = "Only consultants, customers, and admins can update ticket status." });
            }

            // Get current ticket status to enforce business rules
            var currentOrder = await _context.Orders
                .Include(o => o.Status)
                .Include(o => o.Consultant)
                .Include(o => o.CreatedByUser)
                .Include(o => o.SupportType)
                .FirstOrDefaultAsync(o => o.Id == orderId);
            
            if (currentOrder == null)
            {
                return BadRequest(new { error = "Ticket not found" });
            }

            var currentStatus = currentOrder.Status.StatusCode;
            bool isCurrentlyClosed = currentStatus == "Closed" || currentStatus == "TopicClosed";
            bool isPendingCustomer = currentStatus == "PendingCustomerAction";

            // Business rule: Only customers can reopen closed tickets
            if (dto.Status == "ReOpened" && userRole != "Customer" && userRole != "Admin")
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { error = "Only customers can reopen closed tickets." });
            }

            // Business rule: Customers can only reopen closed tickets OR change status from PendingCustomerAction to InProgress
            if (userRole == "Customer" && dto.Status != "ReOpened" && !(isPendingCustomer && dto.Status == "InProgress"))
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { error = "Customers can only reopen closed tickets or respond to pending requests." });
            }

            // Business rule: Consultants cannot modify closed tickets (they must wait for customer to reopen)
            if (userRole == "Consultant" && isCurrentlyClosed)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { error = "Cannot modify closed tickets. Only customers can reopen closed tickets." });
            }

            var result = await _service.UpdateStatusAsync(orderId, dto.Status, userId, dto.Comment, dto.HoursWorked);

            if (!result)
            {
                return BadRequest(new { error = "Invalid ticket ID or status" });
            }

            // Create audit log message with comment if provided
            var auditMessage = $"Status changed to {dto.Status}";
            if (!string.IsNullOrWhiteSpace(dto.Comment))
            {
                auditMessage += $". Comment: {dto.Comment}";
            }

            await _auditLogService.LogAsync(userId, "UpdateTicketStatus", "Order", orderId.ToString(), auditMessage, HttpContext.Connection.RemoteIpAddress?.ToString() ?? "");
            
            // Send email when customer responds to pending request (changes from PendingCustomerAction to InProgress)
            if (userRole == "Customer" && isPendingCustomer && dto.Status == "InProgress" && !string.IsNullOrWhiteSpace(dto.Comment))
            {
                await SendCustomerResponseEmailToConsultant(currentOrder, dto.Comment);
            }
            
            return Ok(new { message = "Status updated successfully" });
        }

        private async Task SendCustomerResponseEmailToConsultant(Order order, string customerComment)
        {
            try
            {
                var emailSender = HttpContext.RequestServices.GetRequiredService<IEmailSender>();
                
                var consultant = order.Consultant;
                var customer = order.CreatedByUser;
                var supportType = order.SupportType;

                if (consultant == null || customer == null || supportType == null)
                    return;

                var consultantSubject = $"✅ Customer Responded: Support Request #{order.OrderNumber} - Work Resumed";
                var consultantEmailBody = EmailTemplates.StatusChangedBackToInProgressFromCustomerResponseForConsultant(
                    $"{consultant.FirstName} {consultant.LastName}".Trim(),
                    $"{customer.FirstName} {customer.LastName}".Trim(),
                    order.OrderNumber,
                    supportType.Name,
                    customerComment.Length > 200 ? customerComment.Substring(0, 200) + "..." : customerComment
                );

                await emailSender.SendEmailAsync(consultant.Email, consultantSubject, consultantEmailBody);
            }
            catch (Exception ex)
            {
                // Log error but don't fail the status update
                // In production, add proper logging here
            }
        }
    }
}
