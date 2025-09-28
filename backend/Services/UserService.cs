using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using SapBasisPulse.Api.Data;
using SapBasisPulse.Api.Entities;
using SapBasisPulse.Api.DTOs;
namespace SapBasisPulse.Api.Services
{
    public class UserService : IUserService
    {
        private readonly AppDbContext _context;

        public UserService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<bool> UpdateUserRoleAsync(Guid userId, string role)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return false;
            if (!Enum.TryParse<UserRole>(role, true, out var newRole)) return false;
            user.Role = newRole;
            await _context.SaveChangesAsync();
            return true;
        }
        private readonly IPasswordHasher<User> _passwordHasher;

        public UserService(AppDbContext context, IPasswordHasher<User> passwordHasher)
        {
            _context = context;
            _passwordHasher = passwordHasher;
        }

        public async Task<IEnumerable<UserDto>> GetAllAsync()
        {
            return await _context.Users
                .Select(u => new UserDto
                {
                    Id = u.Id,
                    Email = u.Email,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    Role = u.Role.ToString(),
                    Status = u.Status.ToString(),
                    HourlyRate = u.HourlyRate
                })
                .ToListAsync();
        }
        
        public async Task<IEnumerable<UserDto>> GetConsultantUsersAsync()
        {
            return await _context.Users
                .Where(u => u.Role == UserRole.Consultant && u.Status == UserStatus.Active)
                .Select(u => new UserDto
                {
                    Id = u.Id,
                    Email = u.Email,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    Role = u.Role.ToString(),
                    Status = u.Status.ToString()
                })
                .ToListAsync();
        }

        public async Task<IEnumerable<ConsultantWithRatingDto>> GetConsultantUsersWithRatingsAsync()
        {
            return await _context.Users
                .Where(u => u.Role == UserRole.Consultant && u.Status == UserStatus.Active)
                .Select(u => new ConsultantWithRatingDto
                {
                    Id = u.Id,
                    Email = u.Email,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    Role = u.Role.ToString(),
                    Status = u.Status.ToString(),
                    AverageRating = _context.TicketRatings
                        .Where(r => r.RatedUserId == u.Id && r.RatingForRole == "consultant")
                        .Average(r => (double?)((r.CommunicationProfessionalism + r.ResolutionQuality + r.ResponseTime) / 3.0)),
                    TotalRatings = _context.TicketRatings
                        .Where(r => r.RatedUserId == u.Id && r.RatingForRole == "consultant")
                        .Count(),
                    HourlyRate = u.HourlyRate
                })
                .OrderByDescending(u => u.AverageRating ?? 0)
                .ThenByDescending(u => u.TotalRatings)
                .ThenBy(u => u.FirstName)
                .ToListAsync();
        }

        public async Task<UserDto?> GetByIdAsync(Guid id)
        {
            var u = await _context.Users.FindAsync(id);
            if (u == null) return null;
            return new UserDto
            {
                Id = u.Id,
                Email = u.Email,
                FirstName = u.FirstName,
                LastName = u.LastName,
                Role = u.Role.ToString(),
                Status = u.Status.ToString(),
                HourlyRate = u.HourlyRate
            };
        }

        public async Task<(bool Success, string? Error, UserDto? User)> CreateAsync(CreateUserDto dto)
        {
            if (await _context.Users.AnyAsync(x => x.Email == dto.Email))
                return (false, "Email already exists", null);

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = dto.Email,
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Role = Enum.TryParse<UserRole>(dto.Role, true, out var role) ? role : UserRole.Customer,
                Status = UserStatus.Active
            };
            user.PasswordHash = _passwordHasher.HashPassword(user, dto.Password);
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return (true, null, new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Role = user.Role.ToString(),
                Status = user.Status.ToString()
            });
        }

        public async Task<(bool Success, string? Error, UserDto? User)> UpdateAsync(Guid id, UpdateUserDto dto)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return (false, "User not found", null);
            user.FirstName = dto.FirstName;
            user.LastName = dto.LastName;
            user.Role = Enum.TryParse<UserRole>(dto.Role, true, out var role) ? role : user.Role;
            await _context.SaveChangesAsync();
            return (true, null, new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Role = user.Role.ToString(),
                Status = user.Status.ToString()
            });
        }

        public async Task<(bool Success, string? Error)> DeleteAsync(Guid id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return (false, "User not found");
            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return (true, null);
        }

        public async Task<(bool Success, string? Error)> UpdateHourlyRateAsync(Guid userId, decimal hourlyRate)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return (false, "User not found");
            
            if (user.Role != UserRole.Consultant) 
                return (false, "Only consultants can set hourly rates");
            
            if (hourlyRate <= 0) 
                return (false, "Hourly rate must be greater than zero");
            
            user.HourlyRate = hourlyRate;
            await _context.SaveChangesAsync();
            return (true, null);
        }
    }
}