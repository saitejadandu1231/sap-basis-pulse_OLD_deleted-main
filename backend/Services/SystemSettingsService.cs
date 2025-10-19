using Microsoft.EntityFrameworkCore;
using SapBasisPulse.Api.Data;
using SapBasisPulse.Api.Entities;

namespace SapBasisPulse.Api.Services;

public interface ISystemSettingsService
{
    Task<string?> GetSettingValueAsync(string key);
    Task<bool> GetBooleanSettingAsync(string key, bool defaultValue = false);
    Task<int> GetIntegerSettingAsync(string key, int defaultValue = 0);
    Task<long> GetLongSettingAsync(string key, long defaultValue = 0);
    Task<int> GetIntSettingAsync(string key, int defaultValue = 0);
    Task<double> GetNumberSettingAsync(string key, double defaultValue = 0.0);
    Task SetSettingAsync(string key, string value, string? updatedBy = null);
    Task<SystemSetting?> GetSettingAsync(string key);
    Task<bool> SettingExistsAsync(string key);
}

public class SystemSettingsService : ISystemSettingsService
{
    private readonly AppDbContext _context;
    
    public SystemSettingsService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<string?> GetSettingValueAsync(string key)
    {
        var setting = await _context.SystemSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Key == key);
        
        return setting?.Value;
    }

    public async Task<bool> GetBooleanSettingAsync(string key, bool defaultValue = false)
    {
        var value = await GetSettingValueAsync(key);
        
        if (string.IsNullOrEmpty(value))
            return defaultValue;
        
        return bool.TryParse(value, out var result) ? result : defaultValue;
    }

    public async Task<int> GetIntegerSettingAsync(string key, int defaultValue = 0)
    {
        var value = await GetSettingValueAsync(key);
        
        if (string.IsNullOrEmpty(value))
            return defaultValue;
        
        return int.TryParse(value, out var result) ? result : defaultValue;
    }

    public async Task<long> GetLongSettingAsync(string key, long defaultValue = 0)
    {
        var value = await GetSettingValueAsync(key);
        
        if (string.IsNullOrEmpty(value))
            return defaultValue;
        
        return long.TryParse(value, out var result) ? result : defaultValue;
    }

    public async Task<int> GetIntSettingAsync(string key, int defaultValue = 0)
    {
        return await GetIntegerSettingAsync(key, defaultValue);
    }

    public async Task<double> GetNumberSettingAsync(string key, double defaultValue = 0.0)
    {
        var value = await GetSettingValueAsync(key);
        
        if (string.IsNullOrEmpty(value))
            return defaultValue;
        
        return double.TryParse(value, out var result) ? result : defaultValue;
    }

    public async Task SetSettingAsync(string key, string value, string? updatedBy = null)
    {
        var setting = await _context.SystemSettings.FindAsync(key);
        
        if (setting != null)
        {
            setting.Value = value;
            setting.UpdatedAt = DateTime.UtcNow;
            setting.UpdatedBy = updatedBy;
        }
        else
        {
            setting = new SystemSetting
            {
                Key = key,
                Value = value,
                DataType = "string",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                UpdatedBy = updatedBy
            };
            _context.SystemSettings.Add(setting);
        }
        
        await _context.SaveChangesAsync();
    }

    public async Task<SystemSetting?> GetSettingAsync(string key)
    {
        return await _context.SystemSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Key == key);
    }

    public async Task<bool> SettingExistsAsync(string key)
    {
        return await _context.SystemSettings
            .AsNoTracking()
            .AnyAsync(s => s.Key == key);
    }
}