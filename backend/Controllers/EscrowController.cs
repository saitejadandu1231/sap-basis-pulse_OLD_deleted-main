using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SapBasisPulse.Api.Services;
using SapBasisPulse.Api.Entities;

namespace SapBasisPulse.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class EscrowController : ControllerBase
    {
        private readonly IEscrowService _escrowService;

        public EscrowController(IEscrowService escrowService)
        {
            _escrowService = escrowService;
        }

        /// <summary>
        /// Places a payment in escrow with specified release conditions
        /// </summary>
        [HttpPost("place-in-escrow/{paymentId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> PlaceInEscrow(Guid paymentId, [FromBody] EscrowRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var success = await _escrowService.PlacePaymentInEscrowAsync(
                paymentId,
                request.ReleaseCondition,
                request.Notes);

            if (!success)
                return BadRequest("Failed to place payment in escrow. Payment may not exist or may not be in the correct state.");

            return Ok(new { message = "Payment placed in escrow successfully" });
        }

        /// <summary>
        /// Releases a payment from escrow
        /// </summary>
        [HttpPost("release-from-escrow/{paymentId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ReleaseFromEscrow(Guid paymentId, [FromBody] EscrowActionRequest? request = null)
        {
            var success = await _escrowService.ReleasePaymentFromEscrowAsync(
                paymentId,
                request?.Notes);

            if (!success)
                return BadRequest("Failed to release payment from escrow. Payment may not be in escrow.");

            return Ok(new { message = "Payment released from escrow successfully" });
        }

        /// <summary>
        /// Cancels escrow for a payment
        /// </summary>
        [HttpPost("cancel-escrow/{paymentId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CancelEscrow(Guid paymentId, [FromBody] EscrowActionRequest? request = null)
        {
            var success = await _escrowService.CancelEscrowAsync(
                paymentId,
                request?.Notes);

            if (!success)
                return BadRequest("Failed to cancel escrow. Payment may not be in escrow.");

            return Ok(new { message = "Escrow cancelled successfully" });
        }

        /// <summary>
        /// Checks and automatically releases escrow if conditions are met
        /// </summary>
        [HttpPost("check-auto-release/{paymentId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CheckAutoRelease(Guid paymentId)
        {
            var released = await _escrowService.CheckAndAutoReleaseEscrowAsync(paymentId);

            if (released)
                return Ok(new { message = "Payment automatically released from escrow", released = true });
            else
                return Ok(new { message = "Payment not eligible for auto-release", released = false });
        }

        /// <summary>
        /// Admin manually releases escrow for payments ready for payout
        /// </summary>
        [HttpPost("admin-release-escrow/{paymentId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AdminReleaseEscrow(Guid paymentId, [FromBody] EscrowActionRequest? request = null)
        {
            // First check if payment is ready for release
            var payment = await _escrowService.GetPaymentAsync(paymentId);
            if (payment == null)
                return NotFound("Payment not found");

            if (payment.Status != PaymentStatus.EscrowReadyForRelease)
                return BadRequest("Payment is not ready for admin release");

            // Release the escrow
            var success = await _escrowService.ReleasePaymentFromEscrowAsync(
                paymentId,
                request?.Notes ?? "Manually released by admin for consultant payout");

            if (!success)
                return BadRequest("Failed to release payment from escrow");

            return Ok(new { message = "Payment released from escrow and ready for consultant payout" });
        }
    }

    public class EscrowRequest
    {
        public string ReleaseCondition { get; set; } = string.Empty; // "ServiceCompleted", "TimeBased", "Manual"
        public string? Notes { get; set; }
    }

    public class EscrowActionRequest
    {
        public string? Notes { get; set; }
    }
}