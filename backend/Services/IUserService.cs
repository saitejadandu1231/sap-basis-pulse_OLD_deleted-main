using SapBasisPulse.Api.DTOs;

namespace SapBasisPulse.Api.Services
{
    public interface IUserService
    {
        Task<IEnumerable<UserDto>> GetAllAsync();
        Task<IEnumerable<UserDto>> GetConsultantUsersAsync();
        Task<IEnumerable<ConsultantWithRatingDto>> GetConsultantUsersWithRatingsAsync();
        Task<UserDto?> GetByIdAsync(Guid id);
        Task<(bool Success, string? Error, UserDto? User)> CreateAsync(CreateUserDto dto);
        Task<(bool Success, string? Error, UserDto? User)> UpdateAsync(Guid id, UpdateUserDto dto);
        Task<(bool Success, string? Error)> DeleteAsync(Guid id);
        Task<bool> UpdateUserRoleAsync(Guid userId, string role);
        Task<(bool Success, string? Error)> UpdateHourlyRateAsync(Guid userId, decimal hourlyRate);
    }
}