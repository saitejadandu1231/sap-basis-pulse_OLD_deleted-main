using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using SapBasisPulse.Api.Data;
using SapBasisPulse.Api.Entities;

namespace SapBasisPulse.Api.Services
{
    /// <summary>
    /// Service to help with development-specific tasks
    /// </summary>
    public class DevHelperService
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;

        public DevHelperService(AppDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        /// <summary>
        /// In development mode, ensure all users are activated if the setting is enabled
        /// This is useful for existing users created before the AutoActivateInDevelopment setting was added
        /// </summary>
        public async Task EnsureAllUsersActiveInDevelopmentAsync()
        {
            // Only run in development and if the setting is enabled
            if (_config["ASPNETCORE_ENVIRONMENT"]?.ToLower() != "development" || 
                _config.GetSection("Auth")["AutoActivateInDevelopment"]?.ToLower() != "true")
            {
                return;
            }

            var inactiveUsers = await _context.Users
                .Where(u => u.Status != UserStatus.Active)
                .ToListAsync();

            if (inactiveUsers.Any())
            {
                foreach (var user in inactiveUsers)
                {
                    user.Status = UserStatus.Active;
                    user.EmailConfirmed = true;
                }
                
                await _context.SaveChangesAsync();
            }
        }
    }
}