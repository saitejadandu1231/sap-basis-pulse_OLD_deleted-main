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
        [AllowAnonymous]
        public async Task<IActionResult> GetAllSupportTypes()
        {
            var types = await _service.GetAllSupportTypesAsync();
            return Ok(types);
        }

        [HttpGet("types")]
        [AllowAnonymous]
        public async Task<IActionResult> GetSupportTypes()
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

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateSupportType(Guid id, [FromBody] UpdateSupportTypeDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            try
            {
                var type = await _service.UpdateSupportTypeAsync(id, dto);
                return Ok(type);
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteSupportType(Guid id)
        {
            var result = await _service.DeleteSupportTypeAsync(id);
            if (!result) return NotFound();
            return NoContent();
        }

        [HttpPost("category")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateSupportCategory([FromBody] CreateSupportCategoryDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var cat = await _service.CreateSupportCategoryAsync(dto);
            return Ok(cat);
        }

        [HttpPut("category/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateSupportCategory(Guid id, [FromBody] UpdateSupportCategoryDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            try
            {
                var category = await _service.UpdateSupportCategoryAsync(id, dto);
                return Ok(category);
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }

        [HttpDelete("category/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteSupportCategory(Guid id)
        {
            var result = await _service.DeleteSupportCategoryAsync(id);
            if (!result) return NotFound();
            return NoContent();
        }

        [HttpGet("categories")]
        [Authorize]
        public async Task<IActionResult> GetSupportCategories([FromQuery] Guid typeId)
        {
            var categories = await _service.GetSupportCategoriesByTypeAsync(typeId);
            return Ok(categories);
        }

        [HttpPost("suboption")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateSupportSubOption([FromBody] CreateSupportSubOptionDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var sub = await _service.CreateSupportSubOptionAsync(dto);
            return Ok(sub);
        }

        [HttpPut("suboption/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateSupportSubOption(Guid id, [FromBody] UpdateSupportSubOptionDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            try
            {
                var subOption = await _service.UpdateSupportSubOptionAsync(id, dto);
                return Ok(subOption);
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }

        [HttpDelete("suboption/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteSupportSubOption(Guid id)
        {
            var result = await _service.DeleteSupportSubOptionAsync(id);
            if (!result) return NotFound();
            return NoContent();
        }
        
        [HttpGet("suboptions")]
        [Authorize]
        public async Task<IActionResult> GetSupportSubOptions([FromQuery] Guid typeId)
        {
            var subOptions = await _service.GetSupportSubOptionsByTypeAsync(typeId);
            return Ok(subOptions);
        }

        // Admin-only endpoints for managing taxonomy
        [HttpGet("admin/types")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllSupportTypesForAdmin()
        {
            var types = await _service.GetAllSupportTypesAsync();
            return Ok(types);
        }

        [HttpPost("admin/types")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateSupportTypeAdmin([FromBody] CreateSupportTypeDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var type = await _service.CreateSupportTypeAsync(dto);
            return CreatedAtAction(nameof(GetSupportTypeById), new { id = type.Id }, type);
        }

        [HttpPut("admin/types/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateSupportTypeAdmin(Guid id, [FromBody] UpdateSupportTypeDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            try
            {
                var type = await _service.UpdateSupportTypeAsync(id, dto);
                return Ok(type);
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }

        [HttpDelete("admin/types/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteSupportTypeAdmin(Guid id)
        {
            var result = await _service.DeleteSupportTypeAsync(id);
            if (!result) return NotFound();
            return NoContent();
        }

        [HttpGet("admin/categories")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllSupportCategoriesForAdmin()
        {
            var categories = await _service.GetAllSupportCategoriesAsync();
            return Ok(categories);
        }

        [HttpPost("admin/categories")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateSupportCategoryAdmin([FromBody] CreateSupportCategoryDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var cat = await _service.CreateSupportCategoryAsync(dto);
            return Ok(cat);
        }

        [HttpPut("admin/categories/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateSupportCategoryAdmin(Guid id, [FromBody] UpdateSupportCategoryDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            try
            {
                var category = await _service.UpdateSupportCategoryAsync(id, dto);
                return Ok(category);
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }

        [HttpDelete("admin/categories/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteSupportCategoryAdmin(Guid id)
        {
            var result = await _service.DeleteSupportCategoryAsync(id);
            if (!result) return NotFound();
            return NoContent();
        }

        [HttpGet("admin/suboptions")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllSupportSubOptionsForAdmin()
        {
            var subOptions = await _service.GetAllSupportSubOptionsAsync();
            return Ok(subOptions);
        }

        [HttpPost("admin/suboptions")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateSupportSubOptionAdmin([FromBody] CreateSupportSubOptionDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var sub = await _service.CreateSupportSubOptionAsync(dto);
            return Ok(sub);
        }

        [HttpPut("admin/suboptions/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateSupportSubOptionAdmin(Guid id, [FromBody] UpdateSupportSubOptionDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            try
            {
                var subOption = await _service.UpdateSupportSubOptionAsync(id, dto);
                return Ok(subOption);
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }

        [HttpDelete("admin/suboptions/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteSupportSubOptionAdmin(Guid id)
        {
            var result = await _service.DeleteSupportSubOptionAsync(id);
            if (!result) return NotFound();
            return NoContent();
        }

        // Consultant Skills Endpoints
        [HttpGet("consultant/{consultantId}/skills")]
        [Authorize]
        public async Task<IActionResult> GetConsultantSkills(Guid consultantId)
        {
            var skills = await _service.GetConsultantSkillsAsync(consultantId);
            return Ok(skills);
        }

        [HttpPost("consultant/{consultantId}/skills")]
        [Authorize]
        public async Task<IActionResult> AddConsultantSkill(Guid consultantId, [FromBody] CreateConsultantSkillDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            try
            {
                var skill = await _service.AddConsultantSkillAsync(consultantId, dto);
                return CreatedAtAction(nameof(GetConsultantSkills), new { consultantId }, skill);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("consultant/{consultantId}/skills/{skillId}")]
        [Authorize]
        public async Task<IActionResult> RemoveConsultantSkill(Guid consultantId, Guid skillId)
        {
            var result = await _service.RemoveConsultantSkillAsync(consultantId, skillId);
            if (!result) return NotFound();
            return NoContent();
        }

        [HttpGet("consultants-by-skills")]
        [Authorize]
        public async Task<IActionResult> GetConsultantsBySkills([FromQuery] Guid supportTypeId, [FromQuery] Guid? supportCategoryId = null)
        {
            var consultants = await _service.GetConsultantsBySkillsAsync(supportTypeId, supportCategoryId);
            return Ok(consultants);
        }
    }
}
