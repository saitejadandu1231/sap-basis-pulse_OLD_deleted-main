using Google.Apis.Auth;
using Microsoft.AspNetCore.Identity;
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
        // ...existing code...

        public async Task<(bool Success, string? Error, AuthResponseDto? Response)> GoogleSsoAsync(string idToken)
        {
            GoogleJsonWebSignature.Payload payload;
            try
            {
                payload = await GoogleJsonWebSignature.ValidateAsync(idToken);
            }
            catch
            {
                return (false, "Invalid Google token", null);
            }

            var user = await _context.Users.FirstOrDefaultAsync(x => x.Email == payload.Email);
            if (user == null)
            {
                // Check admin email verification settings for SSO users
                bool emailVerificationEnabled = _emailSettingsService.IsEmailVerificationEnabled();
                bool emailVerificationRequired = _emailSettingsService.IsEmailVerificationRequired();
                
                // For SSO users, since their email is already verified by the SSO provider (Google/Apple),
                // we only require additional verification if admin has explicitly enabled it
                UserStatus userStatus = (emailVerificationEnabled && emailVerificationRequired) ? UserStatus.PendingVerification : UserStatus.Active;
                bool emailConfirmed = !emailVerificationRequired; // SSO users have verified emails from provider unless admin requires additional verification
                
                Console.WriteLine($"[DEBUG] Google SSO User Creation - EmailVerificationEnabled: {emailVerificationEnabled}, Required: {emailVerificationRequired}, UserStatus: {userStatus}, EmailConfirmed: {emailConfirmed}");

                user = new User
                {
                    Id = Guid.NewGuid(),
                    Email = payload.Email,
                    FirstName = payload.GivenName ?? "",
                    LastName = payload.FamilyName ?? "",
                    Role = UserRole.Customer, // Default or infer from payload
                    Status = userStatus,
                    EmailConfirmed = emailConfirmed,
                    SsoProvider = "Google"
                };
                _context.Users.Add(user);
                await _context.SaveChangesAsync();
            }
            else if (user.Status != UserStatus.Active)
            {
                return (false, "User is not active", null);
            }

            var token = GenerateJwtToken(user);
            var refreshToken = TokenHelper.GenerateRefreshToken();
            var refreshEntity = new RefreshToken
            {
                Id = Guid.NewGuid(),
                Token = refreshToken,
                UserId = user.Id,
                ExpiresAt = DateTime.UtcNow.AddDays(30),
                CreatedAt = DateTime.UtcNow,
                IsRevoked = false
            };
            _context.RefreshTokens.Add(refreshEntity);
            await _context.SaveChangesAsync();
            return (true, null, new AuthResponseDto
            {
                Token = token.Token,
                ExpiresAt = token.ExpiresAt,
                RefreshToken = refreshToken,
                Role = user.Role.ToString(),
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email
            });
        }


        public async Task<(bool Success, string? Error, AuthResponseDto? Response)> AppleSsoAsync(string idToken)
        {
            // Download Apple public keys
            using var http = new HttpClient();
            var keysJson = await http.GetStringAsync("https://appleid.apple.com/auth/keys");
            var keys = System.Text.Json.JsonSerializer.Deserialize<AppleJwtKeys>(keysJson);
            var handler = new JwtSecurityTokenHandler();
            var jwt = handler.ReadJwtToken(idToken);
            var kid = jwt.Header.Kid;
            var key = keys.Keys.Find(k => k.Kid == kid);
            if (key == null)
                return (false, "Apple public key not found", null);

            var rsa = new System.Security.Cryptography.RSAParameters
            {
                Modulus = Base64UrlDecode(key.N),
                Exponent = Base64UrlDecode(key.E)
            };
            using var rsaProvider = System.Security.Cryptography.RSA.Create();
            rsaProvider.ImportParameters(rsa);
            var validationParameters = new TokenValidationParameters
            {
                RequireExpirationTime = true,
                RequireSignedTokens = true,
                ValidateIssuer = true,
                ValidIssuer = "https://appleid.apple.com",
                ValidateAudience = false, // Optionally validate client_id
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new RsaSecurityKey(rsaProvider)
            };
            try
            {
                var principal = handler.ValidateToken(idToken, validationParameters, out var _);
                var email = principal.FindFirst(ClaimTypes.Email)?.Value;
                var sub = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(email))
                    return (false, "Apple token missing email", null);

                var user = await _context.Users.FirstOrDefaultAsync(x => x.Email == email);
                if (user == null)
                {
                    // Check admin email verification settings for SSO users
                    bool emailVerificationEnabled = _emailSettingsService.IsEmailVerificationEnabled();
                    bool emailVerificationRequired = _emailSettingsService.IsEmailVerificationRequired();
                    
                    // For SSO users, since their email is already verified by the SSO provider (Google/Apple),
                    // we only require additional verification if admin has explicitly enabled it
                    UserStatus userStatus = (emailVerificationEnabled && emailVerificationRequired) ? UserStatus.PendingVerification : UserStatus.Active;
                    bool emailConfirmed = !emailVerificationRequired; // SSO users have verified emails from provider unless admin requires additional verification
                    
                    Console.WriteLine($"[DEBUG] Apple SSO User Creation - EmailVerificationEnabled: {emailVerificationEnabled}, Required: {emailVerificationRequired}, UserStatus: {userStatus}, EmailConfirmed: {emailConfirmed}");

                    user = new User
                    {
                        Id = Guid.NewGuid(),
                        Email = email,
                        FirstName = "AppleUser",
                        LastName = "",
                        Role = UserRole.Customer,
                        Status = userStatus,
                        EmailConfirmed = emailConfirmed,
                        SsoProvider = "Apple"
                    };
                    _context.Users.Add(user);
                    await _context.SaveChangesAsync();
                }
                else if (user.Status != UserStatus.Active)
                {
                    return (false, "User is not active", null);
                }

                var token = GenerateJwtToken(user);
                var refreshToken = TokenHelper.GenerateRefreshToken();
                var refreshEntity = new RefreshToken
                {
                    Id = Guid.NewGuid(),
                    Token = refreshToken,
                    UserId = user.Id,
                    ExpiresAt = DateTime.UtcNow.AddDays(30),
                    CreatedAt = DateTime.UtcNow,
                    IsRevoked = false
                };
                _context.RefreshTokens.Add(refreshEntity);
                await _context.SaveChangesAsync();
                return (true, null, new AuthResponseDto
                {
                    Token = token.Token,
                    ExpiresAt = token.ExpiresAt,
                    RefreshToken = refreshToken,
                    Role = user.Role.ToString(),
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    Email = user.Email
                });
            }
            catch (Exception ex)
            {
                return (false, $"Apple SSO validation failed: {ex.Message}", null);
            }
        }

        private static byte[] Base64UrlDecode(string input)
        {
            string s = input.Replace('-', '+').Replace('_', '/');
            switch (s.Length % 4)
            {
                case 2: s += "=="; break;
                case 3: s += "="; break;
            }
            return Convert.FromBase64String(s);
        }

        public async Task<(bool Success, string? Error, AuthResponseDto? Response)> RefreshTokenAsync(string refreshToken)
        {
            var tokenEntity = await _context.RefreshTokens.Include(x => x.User)
                .FirstOrDefaultAsync(x => x.Token == refreshToken && !x.IsRevoked && x.ExpiresAt > DateTime.UtcNow);
            if (tokenEntity == null || tokenEntity.User == null)
                return (false, "Invalid or expired refresh token", null);

            var jwt = GenerateJwtToken(tokenEntity.User);
            // Optionally rotate refresh token
            return (true, null, new AuthResponseDto
            {
                Token = jwt.Token,
                ExpiresAt = jwt.ExpiresAt,
                RefreshToken = tokenEntity.Token,
                Role = tokenEntity.User.Role.ToString(),
                FirstName = tokenEntity.User.FirstName,
                LastName = tokenEntity.User.LastName,
                Email = tokenEntity.User.Email
            });
        }
    }
}
