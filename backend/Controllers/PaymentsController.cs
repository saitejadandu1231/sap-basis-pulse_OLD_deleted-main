using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SapBasisPulse.Api.DTOs;
using SapBasisPulse.Api.Services.Payments;
using SapBasisPulse.Api.Services;
using System.Security.Claims;
using Microsoft.Extensions.Logging;

namespace SapBasisPulse.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentsController : ControllerBase
    {
        private readonly IPaymentService _paymentService;
        private readonly IEscrowService _escrowService;
        private readonly ILogger<PaymentsController> _logger;

        public PaymentsController(IPaymentService paymentService, IEscrowService escrowService, ILogger<PaymentsController> logger)
        {
            _paymentService = paymentService;
            _escrowService = escrowService;
            _logger = logger;
        }

        [HttpPost("create-order")]
        [Authorize(Roles = "Customer,Admin")]
        public async Task<ActionResult<CreatePaymentOrderResponse>> CreateOrder([FromBody] CreatePaymentOrderRequest request)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            try
            {
                var result = await _paymentService.CreateOrderAsync(request.OrderId, userId);
                return Ok(result);
            }
            catch (InvalidOperationException ioe)
            {
                return BadRequest(new { error = ioe.Message });
            }
            catch (UnauthorizedAccessException ua)
            {
                return StatusCode(403, new { error = ua.Message });
            }
            catch (Exception ex)
            {
                // In development we want the exception to surface; still return a generic message
                return StatusCode(500, new { error = "Failed to create payment order", detail = ex.Message });
            }
        }

        [HttpPost("create-order-on-close")]
        [Authorize(Roles = "Consultant,Admin")]
        public async Task<ActionResult<CreatePaymentOrderResponse>> CreateOrderOnClose([FromBody] CreatePaymentOrderRequest request)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            try
            {
                var result = await _paymentService.CreateOrderOnCloseAsync(request.OrderId, userId);
                return Ok(result);
            }
            catch (InvalidOperationException ioe)
            {
                return BadRequest(new { error = ioe.Message });
            }
            catch (UnauthorizedAccessException ua)
            {
                return StatusCode(403, new { error = ua.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to create payment order on close", detail = ex.Message });
            }
        }

        [HttpPost("verify")]
        [Authorize(Roles = "Customer,Admin")]
        public async Task<ActionResult<PaymentSummaryDto>> Verify([FromBody] VerifyPaymentRequest request)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            try
            {
                var result = await _paymentService.VerifyPaymentAsync(request, userId);

                return Ok(result);
            }
            catch (InvalidOperationException ioe)
            {
                return BadRequest(new { error = ioe.Message });
            }
            catch (UnauthorizedAccessException ua)
            {
                return StatusCode(403, new { error = ua.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to verify payment", detail = ex.Message });
            }
        }

        [HttpGet("summary/{orderId}")]
        [Authorize]
        public async Task<ActionResult<PaymentSummaryDto>> GetSummary(Guid orderId)
        {
            // Allow customer, consultant or admin to fetch payment summary for visibility
            // For now authorization checks are handled in service layer if needed
            var result = await _paymentService.GetPaymentSummaryAsync(orderId);
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpPost("process-payout")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ProcessPayout([FromBody] ProcessPayoutRequest request)
        {
            try
            {
                await _paymentService.ProcessPayoutAsync(request.OrderId);
                return Ok(new { message = "Payout processed successfully" });
            }
            catch (InvalidOperationException ioe)
            {
                return BadRequest(new { error = ioe.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to process payout", detail = ex.Message });
            }
        }

        [HttpPost("refund")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<RefundResponse>> ProcessRefund([FromBody] RefundRequest request)
        {
            try
            {
                var result = await _paymentService.ProcessRefundAsync(request.OrderId, request.Reason, request.AmountInPaise);
                return Ok(result);
            }
            catch (InvalidOperationException ioe)
            {
                return BadRequest(new { error = ioe.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to process refund", detail = ex.Message });
            }
        }

        [HttpGet("analytics")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<PaymentAnalyticsDto>> GetAnalytics([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            try
            {
                var result = await _paymentService.GetPaymentAnalyticsAsync(startDate, endDate);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to fetch analytics", detail = ex.Message });
            }
        }

        [HttpGet("consultant-earnings/{consultantId}")]
        [Authorize]
        public async Task<ActionResult<ConsultantEarningsDto>> GetConsultantEarnings(Guid consultantId, [FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var userRole = User.FindFirstValue(ClaimTypes.Role);

            // Allow consultant to view their own earnings, or admin to view any
            if (userRole != "Admin" && userId != consultantId)
            {
                return StatusCode(403, new { error = "You can only view your own earnings" });
            }

            try
            {
                var result = await _paymentService.GetConsultantEarningsAsync(consultantId, startDate, endDate);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to fetch earnings", detail = ex.Message });
            }
        }

        [HttpPost("admin/process-payout/{orderId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ProcessAdminPayout(Guid orderId)
        {
            try
            {
                await _paymentService.ProcessPayoutAsync(orderId);
                return Ok(new { message = "Payout processed successfully" });
            }
            catch (InvalidOperationException ioe)
            {
                return BadRequest(new { error = ioe.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to process payout", detail = ex.Message });
            }
        }
    }
}
