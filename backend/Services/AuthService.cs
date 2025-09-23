using Microsoft.AspNetCore.Identity;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using SapBasisPulse.Api.Data;
using SapBasisPulse.Api.DTOs;
using SapBasisPulse.Api.Entities;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace SapBasisPulse.Api.Services
{
    public partial class AuthService : IAuthService
    {
        private readonly AppDbContext _context;
        private readonly IPasswordHasher<User> _passwordHasher;
        private readonly IConfiguration _config;
        private readonly IEmailSender _emailSender;
        private readonly Microsoft.AspNetCore.Identity.UserManager<User> _userManager;

        public AuthService(AppDbContext context, IPasswordHasher<User> passwordHasher, IConfiguration config, IEmailSender emailSender, Microsoft.AspNetCore.Identity.UserManager<User> userManager)
        {
            _context = context;
            _passwordHasher = passwordHasher;
            _config = config;
            _emailSender = emailSender;
            _userManager = userManager;
        }

        public async Task<(bool Success, string? Error, AuthResponseDto? Response)> RegisterAsync(RegisterDto dto)
        {
            try
            {
                var existing = await _userManager.FindByEmailAsync(dto.Email);
                if (existing != null) return (false, "Email already exists", null);

                // Check if consultant registration is enabled when role is Consultant
                if (dto.Role?.Equals("Consultant", StringComparison.OrdinalIgnoreCase) == true)
                {
                    bool consultantRegistrationEnabled = _config.GetSection("Auth")["ConsultantRegistrationEnabled"]?.ToLower() == "true";
                    if (!consultantRegistrationEnabled)
                    {
                        return (false, "Consultant registration is currently disabled. Please contact AppAdmin at appadmin@yuktor.com for assistance.", null);
                    }
                }

                // In development, we can optionally skip the email verification
                bool autoPendingVerification = true;
                if (_config["ASPNETCORE_ENVIRONMENT"]?.ToLower() == "development" && 
                    _config.GetSection("Auth")["AutoActivateInDevelopment"]?.ToLower() == "true")
                {
                    autoPendingVerification = false;
                }

                var user = new User
                {
                    Id = Guid.NewGuid(),
                    UserName = dto.Email,
                    Email = dto.Email,
                    FirstName = dto.FirstName,
                    LastName = dto.LastName,
                    Role = Enum.TryParse<UserRole>(dto.Role, true, out var role) ? role : UserRole.Customer,
                    Status = autoPendingVerification ? UserStatus.PendingVerification : UserStatus.Active,
                    EmailConfirmed = !autoPendingVerification
                };

                var result = await _userManager.CreateAsync(user, dto.Password);
                if (!result.Succeeded)
                {
                    var msg = string.Join("; ", result.Errors.Select(e => e.Description));
                    return (false, msg, null);
                }

                // Generate email confirmation token (simple base64 for demo, use secure token in prod)
                var confirmationToken = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{user.Id}:{user.Email}:{Guid.NewGuid()}"));
                var frontendUrl = _config["FrontendUrl"] ?? "http://localhost:3000";
                var confirmLink = $"{frontendUrl}/confirm-email?token={Uri.EscapeDataString(confirmationToken)}";
                var subject = "Confirm your email";
                var body = $"<p>Hi {user.FirstName},</p><p>Please confirm your email by clicking <a href='{confirmLink}'>here</a>.</p>";
                
                try
                {
                    await _emailSender.SendEmailAsync(user.Email, subject, body);
                }
                catch (Exception ex)
                {
                    // Log the error but continue with registration
                    // We've already captured this in SmtpEmailSender
                }

                var token = GenerateJwtToken(user);
                return (true, null, new AuthResponseDto
                {
                    Token = token.Token,
                    ExpiresAt = token.ExpiresAt,
                    RefreshToken = "", // TODO: Implement refresh tokens
                    Role = user.Role.ToString(),
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    Email = user.Email
                });
            }
            catch (DbUpdateException dbEx)
            {
                // Provide detailed database error information for debugging
                var errorDetails = $"Database Error: {dbEx.Message}";
                if (dbEx.InnerException != null)
                {
                    errorDetails += $" | Inner Exception: {dbEx.InnerException.Message}";
                }
                return (false, errorDetails, null);
            }
            catch (Exception ex)
            {
                // Provide detailed exception information for debugging
                var errorDetails = $"Registration Error: {ex.Message}";
                if (ex.InnerException != null)
                {
                    errorDetails += $" | Inner Exception: {ex.InnerException.Message}";
                }
                errorDetails += $" | Stack Trace: {ex.StackTrace}";
                return (false, errorDetails, null);
            }
        }

        public async Task<(bool Success, string? Error, AuthResponseDto? Response)> LoginAsync(LoginDto dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(x => x.Email == dto.Email);
            if (user == null)
                return (false, "Invalid credentials", null);

            var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, dto.Password);
            if (result == PasswordVerificationResult.Failed)
                return (false, "Invalid credentials", null);

            // In development, we can allow logins regardless of user status if configured
            bool bypassStatusCheck = false;
            if (_config["ASPNETCORE_ENVIRONMENT"]?.ToLower() == "development" && 
                _config.GetSection("Auth")["BypassStatusCheckInDevelopment"]?.ToLower() == "true")
            {
                bypassStatusCheck = true;
            }

            if (!bypassStatusCheck && user.Status != UserStatus.Active)
            {
                // If the user exists but is not active, provide a more helpful message
                if (user.Status == UserStatus.PendingVerification)
                    return (false, "Please verify your email before logging in", null);
                else
                    return (false, "User is not active", null);
            }

            var token = GenerateJwtToken(user);
            return (true, null, new AuthResponseDto
            {
                Token = token.Token,
                ExpiresAt = token.ExpiresAt,
                RefreshToken = "", // TODO: Implement refresh tokens
                Role = user.Role.ToString(),
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email
            });
        }

        public async Task<(bool Success, string? Error)> ConfirmEmailAsync(string token)
        {
            // Decode token (simple base64, not secure for prod)
            try
            {
                var decoded = Encoding.UTF8.GetString(Convert.FromBase64String(token));
                var parts = decoded.Split(':');
                if (parts.Length < 2) return (false, "Invalid token");
                var userId = Guid.Parse(parts[0]);
                var email = parts[1];
                var user = await _context.Users.FirstOrDefaultAsync(x => x.Id == userId && x.Email == email);
                if (user == null) return (false, "User not found");
                if (user.Status == UserStatus.Active) return (true, null); // Already confirmed
                user.Status = UserStatus.Active;
                await _context.SaveChangesAsync();
                return (true, null);
            }
            catch
            {
                return (false, "Invalid or expired token");
            }
        }

        private (string Token, DateTime ExpiresAt) GenerateJwtToken(User user)
        {
            var jwtSettings = _config.GetSection("JwtSettings");
            var secret = jwtSettings["Secret"];
            var issuer = jwtSettings["Issuer"];
            var audience = jwtSettings["Audience"];
            var expires = DateTime.UtcNow.AddMinutes(int.Parse(jwtSettings["ExpiresInMinutes"] ?? "60"));

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role.ToString()),
                new Claim("firstName", user.FirstName),
                new Claim("lastName", user.LastName)
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer,
                audience,
                claims,
                expires: expires,
                signingCredentials: creds
            );

            return (new JwtSecurityTokenHandler().WriteToken(token), expires);
        }
    }
}
