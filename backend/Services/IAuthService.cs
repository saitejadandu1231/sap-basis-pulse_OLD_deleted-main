using SapBasisPulse.Api.DTOs;
using System.Threading.Tasks;

namespace SapBasisPulse.Api.Services
{
    public interface IAuthService
    {
        Task<(bool Success, string? Error, AuthResponseDto? Response)> RegisterAsync(RegisterDto dto);
        Task<(bool Success, string? Error, AuthResponseDto? Response)> LoginAsync(LoginDto dto);
    Task<(bool Success, string? Error, AuthResponseDto? Response)> GoogleSsoAsync(string idToken);
    Task<(bool Success, string? Error, AuthResponseDto? Response)> AppleSsoAsync(string idToken);
    Task<(bool Success, string? Error)> ConfirmEmailAsync(string token);
    Task<(bool Success, string? Error, AuthResponseDto? Response)> RefreshTokenAsync(string refreshToken);
    (string Token, DateTime ExpiresAt) GenerateJwtToken(SapBasisPulse.Api.Entities.User user);
    }
}
