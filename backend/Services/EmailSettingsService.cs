using Microsoft.Extensions.Configuration;

namespace SapBasisPulse.Api.Services
{
    public class EmailSettingsService : IEmailSettingsService
    {
        private readonly IConfiguration _configuration;
        
        public EmailSettingsService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public bool IsEmailVerificationEnabled()
        {
            var enabledValue = _configuration.GetSection("EmailSettings")["EnableEmailVerification"];
            Console.WriteLine($"[DEBUG] EmailSettings EnableEmailVerification raw value: '{enabledValue}' (Type: {enabledValue?.GetType().Name})");
            
            // Handle both boolean and string values from configuration
            if (bool.TryParse(enabledValue, out bool enabled))
            {
                Console.WriteLine($"[DEBUG] EmailSettings EnableEmailVerification parsed to: {enabled}");
                return enabled;
            }
            Console.WriteLine($"[DEBUG] EmailSettings EnableEmailVerification parsing failed, returning false");
            return false;
        }

        public bool IsEmailVerificationRequired()
        {
            var requiredValue = _configuration.GetSection("EmailSettings")["RequireEmailVerification"];
            Console.WriteLine($"[DEBUG] EmailSettings RequireEmailVerification raw value: '{requiredValue}' (Type: {requiredValue?.GetType().Name})");
            
            // Handle both boolean and string values from configuration
            if (bool.TryParse(requiredValue, out bool required))
            {
                Console.WriteLine($"[DEBUG] EmailSettings RequireEmailVerification parsed to: {required}");
                return required;
            }
            Console.WriteLine($"[DEBUG] EmailSettings RequireEmailVerification parsing failed, returning false");
            return false;
        }

        public int GetEmailVerificationTokenExpiryHours()
        {
            var expiryValue = _configuration.GetSection("EmailSettings")["EmailVerificationTokenExpiryHours"];
            return int.TryParse(expiryValue, out int hours) ? hours : 24; // Default to 24 hours
        }

        public async Task UpdateEmailVerificationSettings(bool enableEmailVerification, bool requireEmailVerification)
        {
            // For now, this method is a placeholder since we're using appsettings.json
            // In a production system, you might want to store these settings in the database
            // and update them there instead of appsettings.json
            throw new NotImplementedException("Dynamic email settings updates are not yet supported. Please update appsettings.json manually.");
        }
    }
}