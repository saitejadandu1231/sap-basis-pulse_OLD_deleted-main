using Microsoft.EntityFrameworkCore;
using SapBasisPulse.Api.Data;
using SapBasisPulse.Api.DTOs;
using SapBasisPulse.Api.Entities;
using SapBasisPulse.Api.Services;
using System.Collections.Concurrent;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Text;

namespace SapBasisPulse.Api.Services
{
    public interface ISupabaseAuthService
    {
        Task<(bool Success, string? Error, AuthResponseDto? Response, bool RequiresAdditionalInfo, string? SupabaseUserId, string? FirstName, string? LastName)> HandleSupabaseAuthAsync(string supabaseAccessToken, string provider);
        Task<(bool Success, string? Error, AuthResponseDto? Response)> CompleteSupabaseSignupAsync(string supabaseUserId, string role, string? firstName = null, string? lastName = null, string password = "");
    }

    public class SupabaseAuthService : ISupabaseAuthService
    {
        private readonly AppDbContext _context;
        private readonly IAuthService _authService;
        private readonly IConfiguration _config;
        private readonly HttpClient _httpClient;
        private readonly IEmailSettingsService _emailSettingsService;
        private readonly IEmailSender _emailSender;
        private readonly IConfiguration _configuration;
        private static readonly ConcurrentDictionary<string, PendingUser> _pendingUsers = new();

        public SupabaseAuthService(AppDbContext context, IAuthService authService, IConfiguration config, HttpClient httpClient, IEmailSettingsService emailSettingsService, IEmailSender emailSender)
        {
            _context = context;
            _authService = authService;
            _config = config;
            _httpClient = httpClient;
            _emailSettingsService = emailSettingsService;
            _emailSender = emailSender;
            _configuration = config; // Using same config for both _config and _configuration
        }

        public async Task<(bool Success, string? Error, AuthResponseDto? Response, bool RequiresAdditionalInfo, string? SupabaseUserId, string? FirstName, string? LastName)> HandleSupabaseAuthAsync(string supabaseAccessToken, string provider)
        {
            try
            {
                Console.WriteLine($"[SSO] Handling Supabase auth - Provider: {provider}, Token length: {supabaseAccessToken?.Length ?? 0}");
                
                // Validate Supabase token and get user info
                var supabaseUser = await ValidateSupabaseToken(supabaseAccessToken);
                if (supabaseUser == null)
                {
                    Console.WriteLine("[SSO] Token validation failed - supabaseUser is null");
                    return (false, "Invalid Supabase token", null, false, null, null, null);
                }

                // Check if user exists in our database
                var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == supabaseUser.Email);

                if (existingUser != null)
                {
                    // User exists, check their status
                    if (existingUser.Status == UserStatus.PendingVerification)
                    {
                        // Check if email verification is still required
                        bool emailVerificationRequired = _emailSettingsService.IsEmailVerificationRequired();
                        if (emailVerificationRequired)
                        {
                            return (false, "Please verify your email before logging in. Check your email for the verification link.", null, false, null, null, null);
                        }
                        else
                        {
                            // Email verification no longer required, activate the user
                            existingUser.Status = UserStatus.Active;
                            existingUser.EmailConfirmed = true;
                            await _context.SaveChangesAsync();
                        }
                    }
                    else if (existingUser.Status != UserStatus.Active)
                    {
                        return (false, "User account is not active. Please contact support.", null, false, null, null, null);
                    }

                    // User exists and is active, sign them in

                    var token = _authService.GenerateJwtToken(existingUser);
                    return (true, null, new AuthResponseDto
                    {
                        Token = token.Token,
                        ExpiresAt = token.ExpiresAt,
                        RefreshToken = "",
                        Role = existingUser.Role.ToString(),
                        FirstName = existingUser.FirstName,
                        LastName = existingUser.LastName,
                        Email = existingUser.Email
                    }, false, null, null, null);
                }
                else
                {
                    // New user - requires additional info
                    // Store pending user info
                    StorePendingUserInfo(supabaseUser.Id, supabaseUser.Email, provider, supabaseUser.FirstName, supabaseUser.LastName);
                    return (true, null, null, true, supabaseUser.Id, supabaseUser.FirstName, supabaseUser.LastName);
                }
            }
            catch (Exception ex)
            {
                return (false, $"SSO authentication failed: {ex.Message}", null, false, null, null, null);
            }
        }

        public async Task<(bool Success, string? Error, AuthResponseDto? Response)> CompleteSupabaseSignupAsync(string supabaseUserId, string role, string? firstName = null, string? lastName = null, string password = "")
        {
            try
            {
                // Get pending user info
                var pendingUser = GetPendingUserInfo(supabaseUserId);
                if (pendingUser == null)
                    return (false, "Pending user info not found", null);

                // Validate role
                if (!Enum.TryParse<UserRole>(role, out var userRole))
                    return (false, "Invalid role specified", null);

                // Use Google-provided names if not overridden
                var finalFirstName = !string.IsNullOrWhiteSpace(firstName) ? firstName : pendingUser.FirstName;
                var finalLastName = !string.IsNullOrWhiteSpace(lastName) ? lastName : pendingUser.LastName;
                
                // Validate and hash required password
                if (string.IsNullOrWhiteSpace(password))
                    return (false, "Password is required", null);
                
                var passwordHasher = new Microsoft.AspNetCore.Identity.PasswordHasher<User>();
                var tempUser = new User(); // Temporary user for hashing
                var passwordHash = passwordHasher.HashPassword(tempUser, password);

                // Create user in our database
                // Check admin email verification settings for SSO users
                bool emailVerificationEnabled = _emailSettingsService.IsEmailVerificationEnabled();
                bool emailVerificationRequired = _emailSettingsService.IsEmailVerificationRequired();
                
                // For SSO users, since their email is already verified by the SSO provider (Google/Apple),
                // we only require additional verification if admin has explicitly enabled it
                UserStatus userStatus = (emailVerificationEnabled && emailVerificationRequired) ? UserStatus.PendingVerification : UserStatus.Active;
                bool emailConfirmed = !emailVerificationRequired; // SSO users have verified emails from provider unless admin requires additional verification
                
                Console.WriteLine($"[DEBUG] SSO User Creation - EmailVerificationEnabled: {emailVerificationEnabled}, Required: {emailVerificationRequired}, UserStatus: {userStatus}, EmailConfirmed: {emailConfirmed}");

                var user = new User
                {
                    Id = Guid.NewGuid(),
                    Email = pendingUser.Email,
                    UserName = pendingUser.Email,
                    FirstName = finalFirstName,
                    LastName = finalLastName,
                    Role = userRole,
                    Status = userStatus,
                    SsoProvider = pendingUser.Provider,
                    EmailConfirmed = emailConfirmed,
                    NormalizedEmail = pendingUser.Email.ToUpper(),
                    NormalizedUserName = pendingUser.Email.ToUpper(),
                    PasswordHash = passwordHash, // Required hashed password
                    SecurityStamp = Guid.NewGuid().ToString(),
                    ConcurrencyStamp = Guid.NewGuid().ToString()
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                // Send verification email if required
                if (emailVerificationEnabled && userStatus == UserStatus.PendingVerification)
                {
                    Console.WriteLine($"[DEBUG] Sending verification email to SSO user: {user.Email}");
                    
                    // Generate email confirmation token (simple base64 for demo, use secure token in prod)
                    var confirmationToken = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{user.Id}:{user.Email}:{Guid.NewGuid()}"));
                    var frontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:3000";
                    var confirmLink = $"{frontendUrl}/confirm-email?token={Uri.EscapeDataString(confirmationToken)}";
                    var subject = "Confirm your email - Yuktor SAP BASIS Support";
                    var body = $"<p>Hi {finalFirstName},</p><p>Welcome to Yuktor SAP BASIS Support! Please confirm your email by clicking <a href='{confirmLink}'>here</a>.</p><p>If you did not create this account, please ignore this email.</p><p>Best regards,<br>Yuktor Team</p>";
                    
                    try
                    {
                        await _emailSender.SendEmailAsync(user.Email, subject, body);
                        Console.WriteLine($"[DEBUG] Verification email sent successfully to SSO user: {user.Email}");
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[DEBUG] Verification email send failed for SSO user: {ex.Message}");
                        // Log the error but continue with registration
                    }
                }

                // Clear pending user info
                ClearPendingUserInfo(supabaseUserId);

                // If user requires email verification, don't generate token yet
                if (userStatus == UserStatus.PendingVerification)
                {
                    return (true, "Account created successfully! Please check your email to verify your account before logging in.", null);
                }

                var token = _authService.GenerateJwtToken(user);
                return (true, null, new AuthResponseDto
                {
                    Token = token.Token,
                    ExpiresAt = token.ExpiresAt,
                    RefreshToken = "",
                    Role = user.Role.ToString(),
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    Email = user.Email
                });
            }
            catch (Exception ex)
            {
                return (false, $"Failed to complete signup: {ex.Message}", null);
            }
        }

        private async Task<SupabaseUser?> ValidateSupabaseToken(string accessToken)
        {
            try
            {
                var supabaseUrl = _config["Supabase:Url"];
                var supabaseServiceKey = _config["Supabase:ServiceKey"]; // We'll use anon key as fallback
                
                if (string.IsNullOrEmpty(supabaseUrl))
                    return null;

                // Clear any existing authorization headers
                _httpClient.DefaultRequestHeaders.Authorization = null;
                _httpClient.DefaultRequestHeaders.Clear();
                
                // Use proper Supabase headers
                _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {accessToken}");
                _httpClient.DefaultRequestHeaders.Add("apikey", supabaseServiceKey ?? _config["Supabase:AnonKey"]);
                
                var response = await _httpClient.GetAsync($"{supabaseUrl}/auth/v1/user");
                
                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"Supabase API Error: {response.StatusCode} - {errorContent}");
                    return null;
                }

                var content = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"Supabase User Response: {content}");
                
                var userInfo = JsonSerializer.Deserialize<JsonElement>(content);

                if (userInfo.TryGetProperty("id", out var id) && 
                    userInfo.TryGetProperty("email", out var email))
                {
                    // Extract name from user_metadata if available
                    string firstName = "";
                    string lastName = "";
                    
                    if (userInfo.TryGetProperty("user_metadata", out var userMetadata))
                    {
                        if (userMetadata.TryGetProperty("full_name", out var fullName))
                        {
                            var nameParts = fullName.GetString()?.Split(' ', StringSplitOptions.RemoveEmptyEntries) ?? Array.Empty<string>();
                            if (nameParts.Length > 0)
                            {
                                firstName = nameParts[0];
                                if (nameParts.Length > 1)
                                {
                                    lastName = string.Join(" ", nameParts.Skip(1));
                                }
                            }
                        }
                    }
                    
                    return new SupabaseUser
                    {
                        Id = id.GetString() ?? "",
                        Email = email.GetString() ?? "",
                        FirstName = firstName,
                        LastName = lastName
                    };
                }

                return null;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Token validation error: {ex.Message}");
                return null;
            }
        }

        private void StorePendingUserInfo(string supabaseUserId, string email, string provider, string firstName, string lastName)
        {
            Console.WriteLine($"[DEBUG] Storing pending user info - ID: {supabaseUserId}, Email: {email}, Name: {firstName} {lastName}, Provider: {provider}");
            _pendingUsers.TryAdd(supabaseUserId, new PendingUser
            {
                Email = email,
                Provider = provider,
                FirstName = firstName,
                LastName = lastName,
                CreatedAt = DateTime.UtcNow
            });
            Console.WriteLine($"[DEBUG] Pending users count after storing: {_pendingUsers.Count}");
        }

        private PendingUser? GetPendingUserInfo(string supabaseUserId)
        {
            Console.WriteLine($"[DEBUG] Looking for pending user info - ID: {supabaseUserId}");
            Console.WriteLine($"[DEBUG] Current pending users count: {_pendingUsers.Count}");
            if (_pendingUsers.Count > 0)
            {
                Console.WriteLine($"[DEBUG] Available pending user IDs: {string.Join(", ", _pendingUsers.Keys)}");
            }
            
            if (_pendingUsers.TryGetValue(supabaseUserId, out var pendingUser))
            {
                // Check if the pending user info is still valid (not older than 10 minutes)
                if (DateTime.UtcNow - pendingUser.CreatedAt < TimeSpan.FromMinutes(10))
                {
                    return pendingUser;
                }
                else
                {
                    // Remove expired entry
                    _pendingUsers.TryRemove(supabaseUserId, out _);
                }
            }
            return null;
        }

        private void ClearPendingUserInfo(string supabaseUserId)
        {
            _pendingUsers.TryRemove(supabaseUserId, out _);
        }
    }

    public class PendingUser
    {
        public string Email { get; set; } = string.Empty;
        public string Provider { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class SupabaseUser
    {
        public string Id { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
    }
}