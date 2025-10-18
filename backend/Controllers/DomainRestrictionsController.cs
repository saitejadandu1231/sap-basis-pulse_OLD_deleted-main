using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SapBasisPulse.Api.Services;
using SapBasisPulse.Api.DTOs;
using SapBasisPulse.Api.Entities;
using System.Security.Claims;

namespace SapBasisPulse.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class DomainRestrictionsController : ControllerBase
    {
        private readonly IDomainRestrictionService _domainRestrictionService;
        private readonly ILogger<DomainRestrictionsController> _logger;

        public DomainRestrictionsController(
            IDomainRestrictionService domainRestrictionService, 
            ILogger<DomainRestrictionsController> logger)
        {
            _domainRestrictionService = domainRestrictionService;
            _logger = logger;
        }

        /// <summary>
        /// Get all domain restrictions
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<DomainRestrictionDto>>> GetDomainRestrictions()
        {
            try
            {
                var restrictions = await _domainRestrictionService.GetAllDomainRestrictionsAsync();
                var restrictionDtos = restrictions.Select(dr => new DomainRestrictionDto
                {
                    Id = dr.Id,
                    Domain = dr.Domain,
                    Reason = dr.Reason,
                    IsActive = dr.IsActive,
                    CreatedAt = dr.CreatedAt,
                    CreatedByUserName = dr.CreatedByUser?.UserName ?? "Unknown",
                    UpdatedAt = dr.UpdatedAt,
                    UpdatedByUserName = dr.UpdatedByUser?.UserName
                });

                return Ok(restrictionDtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting domain restrictions");
                return StatusCode(500, "An error occurred while retrieving domain restrictions");
            }
        }

        /// <summary>
        /// Get domain restriction by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<DomainRestrictionDto>> GetDomainRestriction(Guid id)
        {
            try
            {
                var restriction = await _domainRestrictionService.GetDomainRestrictionByIdAsync(id);
                if (restriction == null)
                {
                    return NotFound($"Domain restriction with ID {id} not found");
                }

                var restrictionDto = new DomainRestrictionDto
                {
                    Id = restriction.Id,
                    Domain = restriction.Domain,
                    Reason = restriction.Reason,
                    IsActive = restriction.IsActive,
                    CreatedAt = restriction.CreatedAt,
                    CreatedByUserName = restriction.CreatedByUser?.UserName ?? "Unknown",
                    UpdatedAt = restriction.UpdatedAt,
                    UpdatedByUserName = restriction.UpdatedByUser?.UserName
                };

                return Ok(restrictionDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting domain restriction with ID {Id}", id);
                return StatusCode(500, "An error occurred while retrieving the domain restriction");
            }
        }

        /// <summary>
        /// Create a new domain restriction
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<DomainRestrictionDto>> CreateDomainRestriction([FromBody] CreateDomainRestrictionDto createDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var currentUserId = GetCurrentUserId();
                if (currentUserId == Guid.Empty)
                {
                    return Unauthorized("User ID not found in token");
                }

                var restriction = await _domainRestrictionService.CreateDomainRestrictionAsync(
                    createDto.Domain, 
                    createDto.Reason, 
                    currentUserId);

                var restrictionDto = new DomainRestrictionDto
                {
                    Id = restriction.Id,
                    Domain = restriction.Domain,
                    Reason = restriction.Reason,
                    IsActive = restriction.IsActive,
                    CreatedAt = restriction.CreatedAt,
                    CreatedByUserName = User.Identity?.Name ?? "Unknown",
                    UpdatedAt = restriction.UpdatedAt,
                    UpdatedByUserName = restriction.UpdatedByUser?.UserName
                };

                return CreatedAtAction(nameof(GetDomainRestriction), new { id = restriction.Id }, restrictionDto);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating domain restriction for domain {Domain}", createDto.Domain);
                return StatusCode(500, "An error occurred while creating the domain restriction");
            }
        }

        /// <summary>
        /// Update an existing domain restriction
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<DomainRestrictionDto>> UpdateDomainRestriction(Guid id, [FromBody] UpdateDomainRestrictionDto updateDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var currentUserId = GetCurrentUserId();
                if (currentUserId == Guid.Empty)
                {
                    return Unauthorized("User ID not found in token");
                }

                var restriction = await _domainRestrictionService.UpdateDomainRestrictionAsync(
                    id, 
                    updateDto.Domain, 
                    updateDto.Reason, 
                    updateDto.IsActive, 
                    currentUserId);

                var restrictionDto = new DomainRestrictionDto
                {
                    Id = restriction.Id,
                    Domain = restriction.Domain,
                    Reason = restriction.Reason,
                    IsActive = restriction.IsActive,
                    CreatedAt = restriction.CreatedAt,
                    CreatedByUserName = restriction.CreatedByUser?.UserName ?? "Unknown",
                    UpdatedAt = restriction.UpdatedAt,
                    UpdatedByUserName = User.Identity?.Name ?? "Unknown"
                };

                return Ok(restrictionDto);
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating domain restriction with ID {Id}", id);
                return StatusCode(500, "An error occurred while updating the domain restriction");
            }
        }

        /// <summary>
        /// Delete a domain restriction
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteDomainRestriction(Guid id)
        {
            try
            {
                var result = await _domainRestrictionService.DeleteDomainRestrictionAsync(id);
                if (!result)
                {
                    return NotFound($"Domain restriction with ID {id} not found");
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting domain restriction with ID {Id}", id);
                return StatusCode(500, "An error occurred while deleting the domain restriction");
            }
        }

        /// <summary>
        /// Check if a domain is restricted
        /// </summary>
        [HttpGet("check/{domain}")]
        [AllowAnonymous] // This endpoint can be used during registration
        public async Task<ActionResult<DomainCheckDto>> CheckDomain(string domain)
        {
            try
            {
                var email = $"test@{domain}"; // Create a test email to check the domain
                var isRestricted = await _domainRestrictionService.IsDomainRestrictedAsync(email);
                
                return Ok(new DomainCheckDto 
                { 
                    Domain = domain, 
                    IsRestricted = isRestricted 
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking domain {Domain}", domain);
                return StatusCode(500, "An error occurred while checking the domain");
            }
        }

        private Guid GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(userIdClaim, out var userId) ? userId : Guid.Empty;
        }
    }
}