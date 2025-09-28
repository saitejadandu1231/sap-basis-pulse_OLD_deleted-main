using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SapBasisPulse.Api.DTOs;
using SapBasisPulse.Api.Services.Payments;
using System.Security.Claims;

namespace SapBasisPulse.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ConsultantController : ControllerBase
    {
        private readonly IPaymentService _paymentService;

        public ConsultantController(IPaymentService paymentService)
        {
            _paymentService = paymentService;
        }

        [HttpGet("payments")]
        [Authorize(Roles = "Consultant")]
        public async Task<ActionResult<ConsultantPaymentDto[]>> GetPayments()
        {
            var consultantId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

            try
            {
                var payments = await _paymentService.GetConsultantPaymentsAsync(consultantId);
                return Ok(payments);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to fetch payments", detail = ex.Message });
            }
        }

        [HttpGet("earnings-summary")]
        [Authorize(Roles = "Consultant")]
        public async Task<ActionResult<ConsultantEarningsSummaryDto>> GetEarningsSummary()
        {
            var consultantId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

            try
            {
                var summary = await _paymentService.GetConsultantEarningsSummaryAsync(consultantId);
                return Ok(summary);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to fetch earnings summary", detail = ex.Message });
            }
        }
    }
}