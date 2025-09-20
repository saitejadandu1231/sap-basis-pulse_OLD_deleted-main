using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SapBasisPulse.Api.DTOs;
using SapBasisPulse.Api.Services;

namespace SapBasisPulse.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ConsultantAvailabilityController : ControllerBase
    {
        private readonly IConsultantAvailabilityService _service;
        public ConsultantAvailabilityController(IConsultantAvailabilityService service)
        {
            _service = service;
        }

        [HttpGet("consultant/{consultantId}")]
        [Authorize(Roles = "Consultant,Admin")]
        public async Task<IActionResult> GetSlotsForConsultant(Guid consultantId)
        {
            var slots = await _service.GetSlotsForConsultantAsync(consultantId);
            return Ok(slots);
        }

        [HttpGet("{id}")]
        [Authorize]
        public async Task<IActionResult> GetSlotById(Guid id)
        {
            var slot = await _service.GetSlotByIdAsync(id);
            if (slot == null) return NotFound();
            return Ok(slot);
        }

        [HttpPost]
        [Authorize(Roles = "Consultant,Admin")]
        public async Task<IActionResult> CreateSlot([FromBody] CreateConsultantAvailabilitySlotDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var slot = await _service.CreateSlotAsync(dto);
            return CreatedAtAction(nameof(GetSlotById), new { id = slot.Id }, slot);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Consultant,Admin")]
        public async Task<IActionResult> DeleteSlot(Guid id)
        {
            var success = await _service.DeleteSlotAsync(id);
            if (!success) return NotFound();
            return NoContent();
        }
    }
}
