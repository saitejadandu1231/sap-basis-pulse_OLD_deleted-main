using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SapBasisPulse.Api.Services;
using Microsoft.EntityFrameworkCore;
using SapBasisPulse.Api.Data;
using SapBasisPulse.Api.Entities;

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
        private readonly AppDbContext _dbContext;
        public AdminController(IUserService userService, ISupportRequestService supportRequestService, IAuditLogService auditLogService, AppDbContext dbContext)
        {
            _userService = userService;
            _supportRequestService = supportRequestService;
            _auditLogService = auditLogService;
            _dbContext = dbContext;
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

        [HttpGet("payments/ready-for-payout")]
        public async Task<IActionResult> GetPaymentsReadyForPayout()
        {
            var payments = await _dbContext.Payments
                .Where(p => p.Status == PaymentStatus.PayoutInitiated || p.Status == PaymentStatus.PayoutCompleted || p.Status == PaymentStatus.PayoutFailed)
                .Include(p => p.Order)
                .ThenInclude(o => o.CreatedByUser)
                .Include(p => p.Order)
                .ThenInclude(o => o.Consultant)
                .Select(p => new
                {
                    id = p.Id,
                    orderId = p.OrderId,
                    orderNumber = p.Order.OrderNumber,
                    customerName = p.Order.CreatedByUser != null ? $"{p.Order.CreatedByUser.FirstName} {p.Order.CreatedByUser.LastName}" : "Unknown",
                    consultantName = p.Order.Consultant != null ? $"{p.Order.Consultant.FirstName} {p.Order.Consultant.LastName}" : "Unknown",
                    amount = p.AmountInPaise / 100.0, // Convert to rupees
                    currency = p.Currency,
                    status = p.Status.ToString(),
                    createdAt = p.CreatedAt,
                    consultantEarning = p.ConsultantEarningInPaise / 100.0 // Convert to rupees
                })
                .OrderByDescending(p => p.createdAt)
                .ToListAsync();

            var adminId = User.Identity?.IsAuthenticated == true ? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier) : null;
            await _auditLogService.LogAsync(adminId != null ? Guid.Parse(adminId.Value) : (Guid?)null, "GetPaymentsReadyForPayout", "Payment", "", $"Fetched {payments.Count} payments ready for payout", HttpContext.Connection.RemoteIpAddress?.ToString() ?? "");

            return Ok(payments);
        }

        [HttpPut("payments/{paymentId}/status")]
        public async Task<IActionResult> UpdatePaymentStatus(Guid paymentId, [FromBody] string status)
        {
            var payment = await _dbContext.Payments.FindAsync(paymentId);
            if (payment == null)
            {
                return NotFound(new { error = "Payment not found" });
            }

            if (!Enum.TryParse<PaymentStatus>(status, out var paymentStatus))
            {
                return BadRequest(new { error = "Invalid payment status" });
            }

            payment.Status = paymentStatus;
            payment.PayoutInitiatedAt = paymentStatus == PaymentStatus.PayoutCompleted ? DateTime.UtcNow : payment.PayoutInitiatedAt;

            await _dbContext.SaveChangesAsync();

            var adminId = User.Identity?.IsAuthenticated == true ? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier) : null;
            await _auditLogService.LogAsync(adminId != null ? Guid.Parse(adminId.Value) : (Guid?)null, "UpdatePaymentStatus", "Payment", paymentId.ToString(), $"Status changed to {status}", HttpContext.Connection.RemoteIpAddress?.ToString() ?? "");

            return Ok(new { message = "Payment status updated successfully" });
        }

        [HttpPut("payments/bulk-status-update")]
        public async Task<IActionResult> BulkUpdatePaymentStatus([FromBody] BulkPaymentStatusUpdateRequest request)
        {
            if (request.PaymentIds == null || !request.PaymentIds.Any())
            {
                return BadRequest(new { error = "No payment IDs provided" });
            }

            if (!Enum.TryParse<PaymentStatus>(request.Status, out var paymentStatus))
            {
                return BadRequest(new { error = "Invalid payment status" });
            }

            var payments = await _dbContext.Payments
                .Where(p => request.PaymentIds.Contains(p.Id))
                .ToListAsync();

            if (payments.Count != request.PaymentIds.Count)
            {
                return BadRequest(new { error = "Some payments not found" });
            }

            foreach (var payment in payments)
            {
                payment.Status = paymentStatus;
                payment.PayoutInitiatedAt = paymentStatus == PaymentStatus.PayoutCompleted ? DateTime.UtcNow : payment.PayoutInitiatedAt;
            }

            await _dbContext.SaveChangesAsync();

            var adminId = User.Identity?.IsAuthenticated == true ? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier) : null;
            await _auditLogService.LogAsync(adminId != null ? Guid.Parse(adminId.Value) : (Guid?)null, "BulkUpdatePaymentStatus", "Payment", string.Join(",", request.PaymentIds), $"Bulk status update to {request.Status} for {payments.Count} payments", HttpContext.Connection.RemoteIpAddress?.ToString() ?? "");

            return Ok(new { message = $"Successfully updated {payments.Count} payments" });
        }

        // Add analytics/system settings endpoints as needed
    }
}

public class BulkPaymentStatusUpdateRequest
{
    public List<Guid> PaymentIds { get; set; } = new();
    public string Status { get; set; } = string.Empty;
}
