using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SapBasisPulse.Api.DTOs;
using SapBasisPulse.Api.Services;

namespace SapBasisPulse.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TicketRatingsController : ControllerBase
    {
        private readonly ITicketRatingService _service;
        public TicketRatingsController(ITicketRatingService service)
        {
            _service = service;
        }

        [HttpGet("order/{orderId}")]
        [Authorize]
        public async Task<IActionResult> GetRatingsForOrder(Guid orderId)
        {
            var ratings = await _service.GetRatingsForOrderAsync(orderId);
            return Ok(ratings);
        }

        [HttpGet("consultant/{consultantId}")]
        [Authorize]
        public async Task<IActionResult> GetRatingsForConsultant(Guid consultantId)
        {
            var ratings = await _service.GetRatingsForConsultantAsync(consultantId);
            return Ok(ratings);
        }

        [HttpGet("{id}")]
        [Authorize]
        public async Task<IActionResult> GetById(Guid id)
        {
            var rating = await _service.GetByIdAsync(id);
            if (rating == null) return NotFound();
            return Ok(rating);
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] CreateTicketRatingDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var rating = await _service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = rating.Id }, rating);
        }
    }
}
