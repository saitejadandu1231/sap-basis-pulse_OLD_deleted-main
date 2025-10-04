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
        private readonly ISupportTaxonomyService _supportTaxonomyService;
        private readonly IEmailSettingsService _emailSettingsService;

        public AuthService(AppDbContext context, IPasswordHasher<User> passwordHasher, IConfiguration config, IEmailSender emailSender, Microsoft.AspNetCore.Identity.UserManager<User> userManager, ISupportTaxonomyService supportTaxonomyService, IEmailSettingsService emailSettingsService)
        {
            _context = context;
            _passwordHasher = passwordHasher;
            _config = config;
            _emailSender = emailSender;
            _userManager = userManager;
            _supportTaxonomyService = supportTaxonomyService;
            _emailSettingsService = emailSettingsService;
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

                // Check admin email verification settings
                bool emailVerificationEnabled = _emailSettingsService.IsEmailVerificationEnabled();
                bool emailVerificationRequired = _emailSettingsService.IsEmailVerificationRequired();
                
                // DEBUG: Log the email verification settings
                Console.WriteLine($"[DEBUG] Email Verification - Enabled: {emailVerificationEnabled}, Required: {emailVerificationRequired}");
                
                // Determine user status based on admin settings
                UserStatus userStatus;
                bool emailConfirmed;
                
                if (emailVerificationEnabled && emailVerificationRequired)
                {
                    // Email verification is enabled and required - user starts as PendingVerification
                    userStatus = UserStatus.PendingVerification;
                    emailConfirmed = false;
                }
                else
                {
                    // Email verification is disabled or not required - user starts as Active
                    userStatus = UserStatus.Active;
                    emailConfirmed = true;
                }

                var user = new User
                {
                    Id = Guid.NewGuid(),
                    UserName = dto.Email,
                    Email = dto.Email,
                    FirstName = dto.FirstName,
                    LastName = dto.LastName,
                    Role = Enum.TryParse<UserRole>(dto.Role, true, out var role) ? role : UserRole.Customer,
                    Status = userStatus,
                    EmailConfirmed = emailConfirmed
                };

                var result = await _userManager.CreateAsync(user, dto.Password);
                if (!result.Succeeded)
                {
                    var msg = string.Join("; ", result.Errors.Select(e => e.Description));
                    return (false, msg, null);
                }

                // Add consultant skills if provided and user is a consultant
                if (dto.Skills != null && dto.Skills.Any() && user.Role == UserRole.Consultant)
                {
                    try
                    {
                        foreach (var skillDto in dto.Skills)
                        {
                            await _supportTaxonomyService.AddConsultantSkillAsync(user.Id, skillDto);
                        }
                    }
                    catch (Exception ex)
                    {
                        // Log the error but don't fail registration - skills can be added later
                        // In a production system, you might want to log this or handle it differently
                        Console.WriteLine($"Failed to add consultant skills during registration: {ex.Message}");
                    }
                }

                // Send email confirmation only if email verification is enabled
                Console.WriteLine($"[DEBUG] About to check if email should be sent. EmailVerificationEnabled: {emailVerificationEnabled}");
                
                if (emailVerificationEnabled)
                {
                    Console.WriteLine($"[DEBUG] Sending verification email to: {user.Email}");
                    
                    // Generate email confirmation token (simple base64 for demo, use secure token in prod)
                    var confirmationToken = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{user.Id}:{user.Email}:{Guid.NewGuid()}"));
                    var frontendUrl = _config["FrontendUrl"] ?? "http://localhost:3000";
                    var confirmLink = $"{frontendUrl}/confirm-email?token={Uri.EscapeDataString(confirmationToken)}";
                    var subject = "Confirm your email - Yuktor SAP BASIS Support";
                    var body = $"<p>Hi {user.FirstName},</p><p>Welcome to Yuktor SAP BASIS Support! Please confirm your email by clicking <a href='{confirmLink}'>here</a>.</p><p>If you did not create this account, please ignore this email.</p><p>Best regards,<br>Yuktor Team</p>";
                    
                    try
                    {
                        Console.WriteLine($"[DEBUG] Starting email send with 15 second timeout...");
                        
                        // Add timeout to prevent hanging
                        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(15));
                        await _emailSender.SendEmailAsync(user.Email, subject, body).WaitAsync(cts.Token);
                        
                        Console.WriteLine($"[DEBUG] Email sent successfully to: {user.Email}");
                    }
                    catch (OperationCanceledException)
                    {
                        Console.WriteLine($"[DEBUG] Email send timed out after 15 seconds for: {user.Email}");
                        // Continue with registration even if email times out
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[DEBUG] Email send failed: {ex.Message}");
                        // Log the error but continue with registration
                        // We've already captured this in SmtpEmailSender
                    }
                }
                else
                {
                    Console.WriteLine($"[DEBUG] Email verification is disabled, skipping email send");
                }

                // If email verification is required and user status is PendingVerification, don't generate token yet
                if (emailVerificationEnabled && user.Status == UserStatus.PendingVerification)
                {
                    return (true, "Account created successfully! Please check your email to verify your account before logging in.", null);
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
            try
            {
                var user = await _context.Users.FirstOrDefaultAsync(x => x.Email == dto.Email);
                if (user == null)
                    return (false, "Invalid credentials", null);

                var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, dto.Password);
                if (result == PasswordVerificationResult.Failed)
                    return (false, "Invalid credentials", null);

                // Check if email verification is required before allowing login
                bool emailVerificationRequired = _emailSettingsService.IsEmailVerificationRequired();
                
                // Only enforce email verification if it's required by admin settings
                if (emailVerificationRequired && user.Status != UserStatus.Active)
                {
                    // If email verification is required and user hasn't verified email, block login
                    if (user.Status == UserStatus.PendingVerification)
                        return (false, "Please verify your email before logging in. Check your email for the verification link.", null);
                    else
                        return (false, "User account is not active. Please contact support.", null);
                }
                else if (!emailVerificationRequired && user.Status == UserStatus.PendingVerification)
                {
                    // If email verification is not required but user is still PendingVerification, 
                    // activate them automatically (admin changed settings after user registered)
                    user.Status = UserStatus.Active;
                    user.EmailConfirmed = true;
                    await _context.SaveChangesAsync();
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
            catch (Exception ex)
            {
                // Provide detailed exception information for debugging (similar to RegisterAsync)
                var errorDetails = $"Login Error: {ex.Message}";
                if (ex.InnerException != null)
                {
                    errorDetails += $" | Inner Exception: {ex.InnerException.Message}";
                }
                errorDetails += $" | Stack Trace: {ex.StackTrace}";
                return (false, errorDetails, null);
            }
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

        public (string Token, DateTime ExpiresAt) GenerateJwtToken(User user)
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
