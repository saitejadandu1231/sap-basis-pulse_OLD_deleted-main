using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SapBasisPulse.Api.Data;
using SapBasisPulse.Api.Entities;
using System.Security.Claims;

namespace SapBasisPulse.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class SystemSettingsController : ControllerBase
{
    private readonly AppDbContext _context;

    public SystemSettingsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<SystemSetting>>> GetSystemSettings()
    {
        var settings = await _context.SystemSettings.ToListAsync();
        return Ok(settings);
    }

    [HttpGet("{key}")]
    public async Task<ActionResult<SystemSetting>> GetSystemSetting(string key)
    {
        var setting = await _context.SystemSettings.FindAsync(key);
        
        if (setting == null)
        {
            return NotFound($"System setting with key '{key}' not found");
        }

        return Ok(setting);
    }

    [HttpPut("{key}")]
    public async Task<IActionResult> UpdateSystemSetting(string key, [FromBody] UpdateSystemSettingRequest request)
    {
        var setting = await _context.SystemSettings.FindAsync(key);
        
        if (setting == null)
        {
            return NotFound($"System setting with key '{key}' not found");
        }

        // Validate data type
        if (!IsValidValue(request.Value, setting.DataType))
        {
            return BadRequest($"Invalid value for data type '{setting.DataType}'");
        }

        setting.Value = request.Value;
        setting.UpdatedAt = DateTime.UtcNow;
        setting.UpdatedBy = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        try
        {
            await _context.SaveChangesAsync();
            return Ok(setting);
        }
        catch (DbUpdateConcurrencyException)
        {
            return StatusCode(500, "Error updating system setting");
        }
    }

    [HttpPost]
    public async Task<ActionResult<SystemSetting>> CreateSystemSetting([FromBody] CreateSystemSettingRequest request)
    {
        if (await _context.SystemSettings.AnyAsync(s => s.Key == request.Key))
        {
            return BadRequest($"System setting with key '{request.Key}' already exists");
        }

        // Validate data type
        if (!IsValidValue(request.Value, request.DataType))
        {
            return BadRequest($"Invalid value for data type '{request.DataType}'");
        }

        var setting = new SystemSetting
        {
            Key = request.Key,
            Value = request.Value,
            Description = request.Description,
            DataType = request.DataType,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            UpdatedBy = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
        };

        _context.SystemSettings.Add(setting);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetSystemSetting), new { key = setting.Key }, setting);
    }

    [HttpDelete("{key}")]
    public async Task<IActionResult> DeleteSystemSetting(string key)
    {
        var setting = await _context.SystemSettings.FindAsync(key);
        
        if (setting == null)
        {
            return NotFound($"System setting with key '{key}' not found");
        }

        _context.SystemSettings.Remove(setting);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private static bool IsValidValue(string value, string dataType)
    {
        return dataType.ToLower() switch
        {
            "string" => true,
            "boolean" => bool.TryParse(value, out _),
            "number" => double.TryParse(value, out _),
            "integer" => int.TryParse(value, out _),
            _ => false
        };
    }
}

public class UpdateSystemSettingRequest
{
    public string Value { get; set; } = string.Empty;
}

public class CreateSystemSettingRequest
{
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string DataType { get; set; } = "string";
}