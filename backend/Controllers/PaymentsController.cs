using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SapBasisPulse.Api.DTOs;
using SapBasisPulse.Api.Services.Payments;
using System.Security.Claims;

namespace SapBasisPulse.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentsController : ControllerBase
    {
        private readonly IPaymentService _paymentService;

        public PaymentsController(IPaymentService paymentService)
        {
            _paymentService = paymentService;
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
    }
}
