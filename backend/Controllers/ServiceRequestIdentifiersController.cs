using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SapBasisPulse.Api.Data;
using SapBasisPulse.Api.DTOs;
using SapBasisPulse.Api.Entities;

namespace SapBasisPulse.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ServiceRequestIdentifiersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ServiceRequestIdentifiersController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/ServiceRequestIdentifiers
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ServiceRequestIdentifierDto>>> GetServiceRequestIdentifiers()
        {
            var identifiers = await _context.ServiceRequestIdentifiers
                .Select(sri => new ServiceRequestIdentifierDto
                {
                    Id = sri.Id,
                    Identifier = sri.Identifier,
                    Task = sri.Task,
                    IsActive = sri.IsActive,
                    CreatedAt = sri.CreatedAt,
                    UpdatedAt = sri.UpdatedAt
                })
                .ToListAsync();

            return Ok(identifiers);
        }

        // GET: api/ServiceRequestIdentifiers/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ServiceRequestIdentifierDto>> GetServiceRequestIdentifier(Guid id)
        {
            var serviceRequestIdentifier = await _context.ServiceRequestIdentifiers.FindAsync(id);

            if (serviceRequestIdentifier == null)
            {
                return NotFound();
            }

            var dto = new ServiceRequestIdentifierDto
            {
                Id = serviceRequestIdentifier.Id,
                Identifier = serviceRequestIdentifier.Identifier,
                Task = serviceRequestIdentifier.Task,
                IsActive = serviceRequestIdentifier.IsActive,
                CreatedAt = serviceRequestIdentifier.CreatedAt,
                UpdatedAt = serviceRequestIdentifier.UpdatedAt
            };

            return Ok(dto);
        }

        // POST: api/ServiceRequestIdentifiers
        [HttpPost]
        public async Task<ActionResult<ServiceRequestIdentifierDto>> CreateServiceRequestIdentifier(CreateServiceRequestIdentifierDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Identifier))
            {
                return BadRequest("Identifier is required");
            }

            var serviceRequestIdentifier = new ServiceRequestIdentifier
            {
                Identifier = dto.Identifier,
                Task = dto.Task,
                IsActive = dto.IsActive,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.ServiceRequestIdentifiers.Add(serviceRequestIdentifier);
            await _context.SaveChangesAsync();

            var responseDto = new ServiceRequestIdentifierDto
            {
                Id = serviceRequestIdentifier.Id,
                Identifier = serviceRequestIdentifier.Identifier,
                Task = serviceRequestIdentifier.Task,
                IsActive = serviceRequestIdentifier.IsActive,
                CreatedAt = serviceRequestIdentifier.CreatedAt,
                UpdatedAt = serviceRequestIdentifier.UpdatedAt
            };

            return CreatedAtAction(nameof(GetServiceRequestIdentifier), new { id = serviceRequestIdentifier.Id }, responseDto);
        }

        // PUT: api/ServiceRequestIdentifiers/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateServiceRequestIdentifier(Guid id, UpdateServiceRequestIdentifierDto dto)
        {
            var serviceRequestIdentifier = await _context.ServiceRequestIdentifiers.FindAsync(id);
            if (serviceRequestIdentifier == null)
            {
                return NotFound();
            }

            serviceRequestIdentifier.Identifier = dto.Identifier;
            serviceRequestIdentifier.Task = dto.Task;
            serviceRequestIdentifier.IsActive = dto.IsActive;
            serviceRequestIdentifier.UpdatedAt = DateTime.UtcNow;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ServiceRequestIdentifierExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/ServiceRequestIdentifiers/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteServiceRequestIdentifier(Guid id)
        {
            var serviceRequestIdentifier = await _context.ServiceRequestIdentifiers.FindAsync(id);
            if (serviceRequestIdentifier == null)
            {
                return NotFound();
            }

            _context.ServiceRequestIdentifiers.Remove(serviceRequestIdentifier);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool ServiceRequestIdentifierExists(Guid id)
        {
            return _context.ServiceRequestIdentifiers.Any(e => e.Id == id);
        }
    }
}