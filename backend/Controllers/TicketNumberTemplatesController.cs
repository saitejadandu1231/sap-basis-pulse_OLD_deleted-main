using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SapBasisPulse.Api.Data;
using SapBasisPulse.Api.DTOs;
using SapBasisPulse.Api.Entities;
using SapBasisPulse.Api.Services;
using System.Security.Claims;

namespace SapBasisPulse.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class TicketNumberTemplatesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITicketNumberService _ticketNumberService;
        private readonly ILogger<TicketNumberTemplatesController> _logger;

        public TicketNumberTemplatesController(
            AppDbContext context,
            ITicketNumberService ticketNumberService,
            ILogger<TicketNumberTemplatesController> logger)
        {
            _context = context;
            _ticketNumberService = ticketNumberService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<TicketNumberTemplateDto>>> GetAll()
        {
            try
            {
                var templates = await _context.TicketNumberTemplates
                    .Include(t => t.SupportType)
                    .Include(t => t.SupportCategory)
                    .Include(t => t.SupportSubOption)
                    .Include(t => t.CreatedByUser)
                    .Include(t => t.UpdatedByUser)
                    .OrderByDescending(t => t.Priority)
                    .ThenBy(t => t.Name)
                    .ToListAsync();

                var templateDtos = templates.Select(t => new TicketNumberTemplateDto
                {
                    Id = t.Id,
                    Name = t.Name,
                    Description = t.Description,
                    Template = t.Template,
                    SupportTypeId = t.SupportTypeId,
                    SupportTypeName = t.SupportType?.Name,
                    SupportCategoryId = t.SupportCategoryId,
                    SupportCategoryName = t.SupportCategory?.Name,
                    SupportSubOptionId = t.SupportSubOptionId,
                    SupportSubOptionName = t.SupportSubOption?.Name,
                    Priority = t.Priority,
                    IsActive = t.IsActive,
                    IsDefault = t.IsDefault,
                    CurrentSequence = t.CurrentSequence,
                    DateFormat = t.DateFormat,
                    SequenceFormat = t.SequenceFormat,
                    CreatedAt = t.CreatedAt,
                    UpdatedAt = t.UpdatedAt,
                    CreatedByUserName = t.CreatedByUser.Email,
                    UpdatedByUserName = t.UpdatedByUser?.Email
                }).ToList();

                return Ok(templateDtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving ticket number templates");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<TicketNumberTemplateDto>> GetById(Guid id)
        {
            try
            {
                var template = await _context.TicketNumberTemplates
                    .Include(t => t.SupportType)
                    .Include(t => t.SupportCategory)
                    .Include(t => t.SupportSubOption)
                    .Include(t => t.CreatedByUser)
                    .Include(t => t.UpdatedByUser)
                    .FirstOrDefaultAsync(t => t.Id == id);

                if (template == null)
                    return NotFound();

                var templateDto = new TicketNumberTemplateDto
                {
                    Id = template.Id,
                    Name = template.Name,
                    Description = template.Description,
                    Template = template.Template,
                    SupportTypeId = template.SupportTypeId,
                    SupportTypeName = template.SupportType?.Name,
                    SupportCategoryId = template.SupportCategoryId,
                    SupportCategoryName = template.SupportCategory?.Name,
                    SupportSubOptionId = template.SupportSubOptionId,
                    SupportSubOptionName = template.SupportSubOption?.Name,
                    Priority = template.Priority,
                    IsActive = template.IsActive,
                    IsDefault = template.IsDefault,
                    CurrentSequence = template.CurrentSequence,
                    DateFormat = template.DateFormat,
                    SequenceFormat = template.SequenceFormat,
                    CreatedAt = template.CreatedAt,
                    UpdatedAt = template.UpdatedAt,
                    CreatedByUserName = template.CreatedByUser.Email,
                    UpdatedByUserName = template.UpdatedByUser?.Email
                };

                return Ok(templateDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving ticket number template {TemplateId}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPost]
        public async Task<ActionResult<TicketNumberTemplateDto>> Create(CreateTicketNumberTemplateDto dto)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized();

                // Validate template format
                var validationResult = await ValidateTemplate(dto.Template, dto.DateFormat, dto.SequenceFormat);
                if (!validationResult.IsValid)
                    return BadRequest(validationResult.ErrorMessage);

                // If setting as default, unset existing default
                if (dto.IsDefault)
                {
                    await UnsetExistingDefaultAsync();
                }

                var template = new TicketNumberTemplate
                {
                    Id = Guid.NewGuid(),
                    Name = dto.Name,
                    Description = dto.Description,
                    Template = dto.Template,
                    SupportTypeId = dto.SupportTypeId,
                    SupportCategoryId = dto.SupportCategoryId,
                    SupportSubOptionId = dto.SupportSubOptionId,
                    Priority = dto.Priority,
                    IsActive = dto.IsActive,
                    IsDefault = dto.IsDefault,
                    CurrentSequence = 0,
                    DateFormat = dto.DateFormat,
                    SequenceFormat = dto.SequenceFormat,
                    CreatedAt = DateTime.UtcNow,
                    CreatedByUserId = userId.Value
                };

                _context.TicketNumberTemplates.Add(template);
                await _context.SaveChangesAsync();

                return await GetById(template.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating ticket number template");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<TicketNumberTemplateDto>> Update(Guid id, UpdateTicketNumberTemplateDto dto)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized();

                var template = await _context.TicketNumberTemplates.FindAsync(id);
                if (template == null)
                    return NotFound();

                // Validate template format
                var validationResult = await ValidateTemplate(dto.Template, dto.DateFormat, dto.SequenceFormat);
                if (!validationResult.IsValid)
                    return BadRequest(validationResult.ErrorMessage);

                // If setting as default, unset existing default
                if (dto.IsDefault && !template.IsDefault)
                {
                    await UnsetExistingDefaultAsync();
                }

                template.Name = dto.Name;
                template.Description = dto.Description;
                template.Template = dto.Template;
                template.SupportTypeId = dto.SupportTypeId;
                template.SupportCategoryId = dto.SupportCategoryId;
                template.SupportSubOptionId = dto.SupportSubOptionId;
                template.Priority = dto.Priority;
                template.IsActive = dto.IsActive;
                template.IsDefault = dto.IsDefault;
                template.DateFormat = dto.DateFormat;
                template.SequenceFormat = dto.SequenceFormat;
                template.UpdatedAt = DateTime.UtcNow;
                template.UpdatedByUserId = userId.Value;

                await _context.SaveChangesAsync();

                return await GetById(id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating ticket number template {TemplateId}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            try
            {
                var template = await _context.TicketNumberTemplates.FindAsync(id);
                if (template == null)
                    return NotFound();

                // Prevent deletion of default template
                if (template.IsDefault)
                    return BadRequest("Cannot delete the default template");

                _context.TicketNumberTemplates.Remove(template);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting ticket number template {TemplateId}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPost("preview")]
        public async Task<ActionResult<TicketNumberPreviewResultDto>> PreviewTicketNumber(TicketNumberTemplatePreviewDto dto)
        {
            try
            {
                var validationResult = await ValidateTemplate(dto.Template, dto.DateFormat, dto.SequenceFormat);
                if (!validationResult.IsValid)
                {
                    return Ok(new TicketNumberPreviewResultDto
                    {
                        PreviewNumber = "",
                        IsValid = false,
                        ErrorMessage = validationResult.ErrorMessage
                    });
                }

                var previewNumber = await _ticketNumberService.PreviewTicketNumberAsync(
                    dto.Template,
                    dto.DateFormat,
                    dto.SequenceFormat,
                    dto.SupportTypeId,
                    dto.SupportCategoryId,
                    dto.SupportSubOptionId);

                return Ok(new TicketNumberPreviewResultDto
                {
                    PreviewNumber = previewNumber,
                    IsValid = true
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating ticket number preview");
                return Ok(new TicketNumberPreviewResultDto
                {
                    PreviewNumber = "",
                    IsValid = false,
                    ErrorMessage = "Error generating preview"
                });
            }
        }

        [HttpPost("{id}/reset-sequence")]
        public async Task<IActionResult> ResetSequence(Guid id)
        {
            try
            {
                var template = await _context.TicketNumberTemplates.FindAsync(id);
                if (template == null)
                    return NotFound();

                template.CurrentSequence = 0;
                template.UpdatedAt = DateTime.UtcNow;
                template.UpdatedByUserId = GetCurrentUserId();

                await _context.SaveChangesAsync();

                return Ok(new { message = "Sequence counter reset to 0" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error resetting sequence for template {TemplateId}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        private Guid? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
        }

        private async Task UnsetExistingDefaultAsync()
        {
            var existingDefault = await _context.TicketNumberTemplates
                .FirstOrDefaultAsync(t => t.IsDefault);

            if (existingDefault != null)
            {
                existingDefault.IsDefault = false;
                existingDefault.UpdatedAt = DateTime.UtcNow;
                existingDefault.UpdatedByUserId = GetCurrentUserId();
            }
        }

        private async Task<TicketNumberPreviewResultDto> ValidateTemplate(string template, string dateFormat, string sequenceFormat)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(template))
                    return new TicketNumberPreviewResultDto { IsValid = false, ErrorMessage = "Template cannot be empty" };

                // Check for supported placeholders
                var supportedPlaceholders = new[] { "{SupportType}", "{Category}", "{SubType}", "{Date}", "{Sequence}" };
                var invalidPlaceholders = new List<string>();

                // Find all placeholders in the template
                var placeholders = System.Text.RegularExpressions.Regex.Matches(template, @"\{[^}]+\}")
                    .Cast<System.Text.RegularExpressions.Match>()
                    .Select(m => m.Value)
                    .Distinct()
                    .ToList();

                foreach (var placeholder in placeholders)
                {
                    if (!supportedPlaceholders.Contains(placeholder))
                    {
                        invalidPlaceholders.Add(placeholder);
                    }
                }

                if (invalidPlaceholders.Any())
                {
                    return new TicketNumberPreviewResultDto
                    {
                        IsValid = false,
                        ErrorMessage = $"Invalid placeholders: {string.Join(", ", invalidPlaceholders)}. Supported: {string.Join(", ", supportedPlaceholders)}"
                    };
                }

                // Validate date format
                try
                {
                    DateTime.Now.ToString(dateFormat);
                }
                catch
                {
                    return new TicketNumberPreviewResultDto { IsValid = false, ErrorMessage = "Invalid date format" };
                }

                // Validate sequence format
                try
                {
                    1.ToString(sequenceFormat);
                }
                catch
                {
                    return new TicketNumberPreviewResultDto { IsValid = false, ErrorMessage = "Invalid sequence format" };
                }

                return new TicketNumberPreviewResultDto { IsValid = true };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating template");
                return new TicketNumberPreviewResultDto { IsValid = false, ErrorMessage = "Validation error" };
            }
        }
    }
}