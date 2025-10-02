using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SapBasisPulse.Api.DTOs;
using SapBasisPulse.Api.Services;
using IAuthorizationService = SapBasisPulse.Api.Services.IAuthorizationService;

namespace SapBasisPulse.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ConsultantAvailabilityController : ControllerBase
    {
        private readonly IConsultantAvailabilityService _service;
        private readonly IAuthorizationService _authService;

        public ConsultantAvailabilityController(
            IConsultantAvailabilityService service,
            IAuthorizationService authService)
        {
            _service = service;
            _authService = authService;
        }

        [HttpGet("consultant/{consultantId}")]
        [Authorize(Policy = "CustomerOrConsultantOrAdmin")]
        public async Task<IActionResult> GetSlotsForConsultant(Guid consultantId)
        {
            // Check if user can view slots for this consultant
            if (!_authService.CanViewConsultantSlots(consultantId))
                return Forbid();

            var slots = await _service.GetSlotsForConsultantAsync(consultantId);
            return Ok(slots);
        }
        
        [HttpGet]
        [Authorize(Policy = "CustomerOrConsultantOrAdmin")]
        public async Task<IActionResult> GetSlotsForDateRange([FromQuery] Guid consultantId, [FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
        {
            // Check if user can view slots for this consultant
            if (!_authService.CanViewConsultantSlots(consultantId))
                return Forbid();

            var slots = await _service.GetSlotsForDateRangeAsync(consultantId, startDate, endDate);
            return Ok(slots);
        }

        [HttpGet("{id}")]
        [Authorize(Policy = "CustomerOrConsultantOrAdmin")]
        public async Task<IActionResult> GetSlotById(Guid id)
        {
            // Check if user can view this specific slot
            if (!await _authService.CanViewSlot(id))
                return Forbid();

            var slot = await _service.GetSlotByIdAsync(id);
            if (slot == null) return NotFound();
            return Ok(slot);
        }

        [HttpPost]
        [Authorize(Policy = "ConsultantOrAdmin")]
        public async Task<IActionResult> CreateSlot([FromBody] CreateConsultantAvailabilitySlotDto dto)
        {
            if (!ModelState.IsValid) 
                return BadRequest(ModelState);

            // Check if user can manage slots for this consultant
            if (!_authService.CanManageConsultantSlots(dto.ConsultantId))
                return Forbid();
                
            try
            {
                var slotsResponse = await _service.CreateSlotAsync(dto);
                return Ok(slotsResponse);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                // Log the exception here if you have logging configured
                return StatusCode(500, new { error = "An error occurred while creating the availability slots." });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "ConsultantOrAdmin")]
        public async Task<IActionResult> DeleteSlot(Guid id)
        {
            // Check if user can manage this specific slot
            if (!await _authService.CanManageSlot(id))
                return Forbid();

            var success = await _service.DeleteSlotAsync(id);
            if (!success) return NotFound();
            return NoContent();
        }

        [HttpGet("consultant/{consultantId}/booked-slots")]
        [Authorize(Policy = "ConsultantOrAdmin")]
        public async Task<IActionResult> GetBookedSlotsForConsultant(Guid consultantId)
        {
            // Check if user can manage slots for this consultant (only consultants and admins can view booked slots)
            if (!_authService.CanManageConsultantSlots(consultantId))
                return Forbid();

            var bookedSlots = await _service.GetBookedSlotsForConsultantAsync(consultantId);
            return Ok(bookedSlots);
        }
    }
}
