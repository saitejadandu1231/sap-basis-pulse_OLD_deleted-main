using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace SapBasisPulse.Api.Data
{
    public static class IdentityConfig
    {
        public static IServiceCollection AddIdentityAndJwt(this IServiceCollection services, IConfiguration configuration)
        {
            // Add Identity Core (customize as needed)
            services.AddIdentityCore<Entities.User>(options =>
            {
                // Password, lockout, etc. options
            })
            .AddRoles<IdentityRole<Guid>>()
            .AddEntityFrameworkStores<AppDbContext>();

            // JWT Authentication
            var jwtSettings = configuration.GetSection("JwtSettings");
            var key = Encoding.UTF8.GetBytes(jwtSettings["Secret"]);

            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = "JwtBearer";
                options.DefaultChallengeScheme = "JwtBearer";
            })
            .AddJwtBearer("JwtBearer", options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtSettings["Issuer"],
                    ValidAudience = jwtSettings["Audience"],
                    IssuerSigningKey = new SymmetricSecurityKey(key)
                };
            });

            // Google/Apple SSO can be added here (see Microsoft.AspNetCore.Authentication.Google/Apple)

            return services;
        }
    }
}