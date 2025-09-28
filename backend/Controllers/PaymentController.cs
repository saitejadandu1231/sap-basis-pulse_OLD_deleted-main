using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SapBasisPulse.Api.Services;
using System.Security.Claims;

namespace SapBasisPulse.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentController : ControllerBase
    {
        private readonly IPaymentService _paymentService;

        public PaymentController(IPaymentService paymentService)
        {
            _paymentService = paymentService;
        }

        [HttpPost("create-order")]
        [Authorize]
        public async Task<IActionResult> CreatePaymentOrder([FromBody] CreatePaymentOrderDto dto)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

            var (success, error, response) = await _paymentService.CreatePaymentOrderAsync(
                dto.Amount, dto.Currency ?? "INR", dto.OrderId);

            if (!success)
            {
                return BadRequest(new { error });
            }

            return Ok(response);
        }

        [HttpPost("verify")]
        [Authorize]
        public async Task<IActionResult> VerifyPayment([FromBody] VerifyPaymentDto dto)
        {
            var (success, error, response) = await _paymentService.VerifyPaymentAsync(
                dto.RazorpayOrderId, dto.RazorpayPaymentId, dto.RazorpaySignature);

            if (!success)
            {
                return BadRequest(new { error });
            }

            return Ok(response);
        }

        [HttpPost("update-status")]
        [Authorize]
        public async Task<IActionResult> UpdatePaymentStatus([FromBody] UpdatePaymentStatusDto dto)
        {
            var (success, error) = await _paymentService.UpdateOrderPaymentStatusAsync(
                dto.OrderId, dto.PaymentStatus, dto.RazorpayPaymentId);

            if (!success)
            {
                return BadRequest(new { error });
            }

            return Ok(new { message = "Payment status updated successfully" });
        }
    }

    public class CreatePaymentOrderDto
    {
        public Guid OrderId { get; set; }
        public decimal Amount { get; set; }
        public string? Currency { get; set; }
    }

    public class VerifyPaymentDto
    {
        public string RazorpayOrderId { get; set; } = string.Empty;
        public string RazorpayPaymentId { get; set; } = string.Empty;
        public string RazorpaySignature { get; set; } = string.Empty;
    }

    public class UpdatePaymentStatusDto
    {
        public Guid OrderId { get; set; }
        public string PaymentStatus { get; set; }
        public string? RazorpayPaymentId { get; set; }
    }
}