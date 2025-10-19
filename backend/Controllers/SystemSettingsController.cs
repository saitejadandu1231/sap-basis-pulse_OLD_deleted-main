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
            // Return default setting if it doesn't exist
            var defaultSetting = GetDefaultSetting(key);
            if (defaultSetting == null)
            {
                return NotFound($"System setting with key '{key}' not found");
            }
            return Ok(defaultSetting);
        }

        return Ok(setting);
    }

    [HttpPost("initialize")]
    public async Task<IActionResult> InitializeDefaultSettings()
    {
        var defaultSettings = GetDefaultSettings();
        var createdSettings = new List<SystemSetting>();

        foreach (var defaultSetting in defaultSettings)
        {
            var existingSetting = await _context.SystemSettings.FindAsync(defaultSetting.Key);
            if (existingSetting == null)
            {
                defaultSetting.CreatedAt = DateTime.UtcNow;
                defaultSetting.UpdatedAt = DateTime.UtcNow;
                defaultSetting.UpdatedBy = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                
                _context.SystemSettings.Add(defaultSetting);
                createdSettings.Add(defaultSetting);
            }
        }

        if (createdSettings.Any())
        {
            await _context.SaveChangesAsync();
        }

        return Ok(new { message = $"Initialized {createdSettings.Count} default settings", settings = createdSettings });
    }

    [HttpPut("{key}")]
    public async Task<IActionResult> UpdateSystemSetting(string key, [FromBody] UpdateSystemSettingRequest request)
    {
        var setting = await _context.SystemSettings.FindAsync(key);
        
        if (setting == null)
        {
            // Create the setting if it doesn't exist
            var dataType = DetermineDataType(request.Value);
            
            setting = new SystemSetting
            {
                Key = key,
                Value = request.Value,
                Description = GetDefaultDescription(key),
                DataType = dataType,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                UpdatedBy = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            };
            
            _context.SystemSettings.Add(setting);
        }
        else
        {
            // Validate data type for existing setting
            if (!IsValidValue(request.Value, setting.DataType))
            {
                return BadRequest($"Invalid value for data type '{setting.DataType}'");
            }

            setting.Value = request.Value;
            setting.UpdatedAt = DateTime.UtcNow;
            setting.UpdatedBy = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        }

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

    private static string DetermineDataType(string value)
    {
        if (bool.TryParse(value, out _))
            return "boolean";
        if (int.TryParse(value, out _))
            return "integer";
        if (double.TryParse(value, out _))
            return "number";
        return "string";
    }

    private static string GetDefaultDescription(string key)
    {
        return key switch
        {
            "EnableFileUploads" => "Enable or disable file upload feature for tickets",
            "MaxFileUploadSizeBytes" => "Maximum file size allowed for uploads (in bytes)",
            "MaxFilesPerTicket" => "Maximum number of files allowed per ticket",
            _ => $"System setting: {key}"
        };
    }

    private static SystemSetting? GetDefaultSetting(string key)
    {
        return key switch
        {
            "EnableFileUploads" => new SystemSetting
            {
                Key = "EnableFileUploads",
                Value = "false",
                Description = "Enable or disable file upload feature for tickets",
                DataType = "boolean"
            },
            "MaxFileUploadSizeBytes" => new SystemSetting
            {
                Key = "MaxFileUploadSizeBytes",
                Value = "10485760", // 10MB in bytes
                Description = "Maximum file size allowed for uploads (in bytes)",
                DataType = "integer"
            },
            "MaxFilesPerTicket" => new SystemSetting
            {
                Key = "MaxFilesPerTicket",
                Value = "5",
                Description = "Maximum number of files allowed per ticket",
                DataType = "integer"
            },
            _ => null
        };
    }

    private static List<SystemSetting> GetDefaultSettings()
    {
        return new List<SystemSetting>
        {
            new SystemSetting
            {
                Key = "EnableFileUploads",
                Value = "false",
                Description = "Enable or disable file upload feature for tickets",
                DataType = "boolean"
            },
            new SystemSetting
            {
                Key = "MaxFileUploadSizeBytes",
                Value = "10485760", // 10MB in bytes
                Description = "Maximum file size allowed for uploads (in bytes)",
                DataType = "integer"
            },
            new SystemSetting
            {
                Key = "MaxFilesPerTicket",
                Value = "5",
                Description = "Maximum number of files allowed per ticket",
                DataType = "integer"
            }
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