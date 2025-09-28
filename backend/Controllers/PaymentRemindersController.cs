using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SapBasisPulse.Api.DTOs;
using SapBasisPulse.Api.Services.Payments;
using System.Security.Claims;

namespace SapBasisPulse.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentRemindersController : ControllerBase
    {
        private readonly IPaymentService _paymentService;

        public PaymentRemindersController(IPaymentService paymentService)
        {
            _paymentService = paymentService;
        }

        [HttpPost("send/{orderId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> SendPaymentReminder(Guid orderId)
        {
            try
            {
                var success = await _paymentService.SendPaymentReminderAsync(orderId);

                if (!success)
                {
                    return BadRequest(new { error = "Failed to send payment reminder" });
                }

                return Ok(new
                {
                    message = "Payment reminder sent successfully",
                    orderId = orderId,
                    reminderType = "email"
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to send reminder", detail = ex.Message });
            }
        }

        [HttpPost("schedule/{orderId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> SchedulePaymentReminder(Guid orderId, [FromBody] ScheduleReminderRequest request)
        {
            try
            {
                var success = await _paymentService.SchedulePaymentReminderAsync(
                    orderId,
                    request.ScheduledFor,
                    request.ReminderType,
                    request.Message);

                if (!success)
                {
                    return BadRequest(new { error = "Failed to schedule payment reminder" });
                }

                return Ok(new
                {
                    message = "Payment reminder scheduled successfully",
                    orderId = orderId,
                    scheduledFor = request.ScheduledFor,
                    reminderType = request.ReminderType
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to schedule reminder", detail = ex.Message });
            }
        }
    }
}