using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SapBasisPulse.Api.DTOs;
using SapBasisPulse.Api.Services;

namespace SapBasisPulse.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SupportTaxonomyController : ControllerBase
    {
        private readonly ISupportTaxonomyService _service;
        public SupportTaxonomyController(ISupportTaxonomyService service)
        {
            _service = service;
        }

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetAllSupportTypes()
        {
            var types = await _service.GetAllSupportTypesAsync();
            return Ok(types);
        }

        [HttpGet("{id}")]
        [Authorize]
        public async Task<IActionResult> GetSupportTypeById(Guid id)
        {
            var type = await _service.GetSupportTypeByIdAsync(id);
            if (type == null) return NotFound();
            return Ok(type);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateSupportType([FromBody] CreateSupportTypeDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var type = await _service.CreateSupportTypeAsync(dto);
            return CreatedAtAction(nameof(GetSupportTypeById), new { id = type.Id }, type);
        }

        [HttpPost("category")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateSupportCategory([FromBody] CreateSupportCategoryDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var cat = await _service.CreateSupportCategoryAsync(dto);
            return Ok(cat);
        }

        [HttpPost("suboption")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateSupportSubOption([FromBody] CreateSupportSubOptionDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var sub = await _service.CreateSupportSubOptionAsync(dto);
            return Ok(sub);
        }
    }
}
