using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Identity;
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
        private readonly UserManager<User> _userManager;

        public DevHelperService(AppDbContext context, IConfiguration config, UserManager<User> userManager)
        {
            _context = context;
            _config = config;
            _userManager = userManager;
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

        /// <summary>
        /// Ensure the default admin user exists in development mode
        /// </summary>
        public async Task EnsureAdminUserExistsAsync()
        {
            // Only run in development
            if (_config["ASPNETCORE_ENVIRONMENT"]?.ToLower() != "development")
            {
                return;
            }

            const string adminEmail = "Admin@gmail.com";
            const string adminPassword = "Admin@1234";

            // Check if admin user already exists
            var existingAdmin = await _userManager.FindByEmailAsync(adminEmail);
            if (existingAdmin != null)
            {
                // Admin user already exists
                return;
            }

            // Create the admin user
            var adminUser = new User
            {
                UserName = adminEmail,
                Email = adminEmail,
                FirstName = "System",
                LastName = "Administrator",
                Role = UserRole.Admin,
                Status = UserStatus.Active,
                EmailConfirmed = true, // Auto-confirm in development
                LockoutEnabled = false
            };

            var result = await _userManager.CreateAsync(adminUser, adminPassword);
            
            if (result.Succeeded)
            {
                Console.WriteLine($"✓ Default admin user created successfully: {adminEmail}");
            }
            else
            {
                Console.WriteLine($"✗ Failed to create admin user: {string.Join(", ", result.Errors.Select(e => e.Description))}");
            }
        }
    }
}