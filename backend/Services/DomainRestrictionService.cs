using Microsoft.EntityFrameworkCore;
using SapBasisPulse.Api.Data;
using SapBasisPulse.Api.Entities;

namespace SapBasisPulse.Api.Services
{
    public interface IDomainRestrictionService
    {
        Task<IEnumerable<DomainRestriction>> GetAllDomainRestrictionsAsync();
        Task<DomainRestriction?> GetDomainRestrictionByIdAsync(Guid id);
        Task<DomainRestriction> CreateDomainRestrictionAsync(string domain, string? reason, Guid createdByUserId);
        Task<DomainRestriction> UpdateDomainRestrictionAsync(Guid id, string domain, string? reason, bool isActive, Guid updatedByUserId);
        Task<bool> DeleteDomainRestrictionAsync(Guid id);
        Task<bool> IsDomainRestrictedAsync(string email);
        Task<bool> IsDomainAllowedAsync(string email);
    }

    public class DomainRestrictionService : IDomainRestrictionService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<DomainRestrictionService> _logger;

        public DomainRestrictionService(AppDbContext context, ILogger<DomainRestrictionService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<IEnumerable<DomainRestriction>> GetAllDomainRestrictionsAsync()
        {
            return await _context.DomainRestrictions
                .Include(dr => dr.CreatedByUser)
                .Include(dr => dr.UpdatedByUser)
                .OrderBy(dr => dr.Domain)
                .ToListAsync();
        }

        public async Task<DomainRestriction?> GetDomainRestrictionByIdAsync(Guid id)
        {
            return await _context.DomainRestrictions
                .Include(dr => dr.CreatedByUser)
                .Include(dr => dr.UpdatedByUser)
                .FirstOrDefaultAsync(dr => dr.Id == id);
        }

        public async Task<DomainRestriction> CreateDomainRestrictionAsync(string domain, string? reason, Guid createdByUserId)
        {
            // Normalize domain to lowercase
            var normalizedDomain = domain.ToLowerInvariant().Trim();

            // Check if domain already exists
            var existingRestriction = await _context.DomainRestrictions
                .FirstOrDefaultAsync(dr => dr.Domain == normalizedDomain);

            if (existingRestriction != null)
            {
                throw new InvalidOperationException($"Domain restriction for '{normalizedDomain}' already exists.");
            }

            var domainRestriction = new DomainRestriction
            {
                Id = Guid.NewGuid(),
                Domain = normalizedDomain,
                Reason = reason,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                CreatedByUserId = createdByUserId
            };

            _context.DomainRestrictions.Add(domainRestriction);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Domain restriction created for domain: {Domain} by user: {UserId}", normalizedDomain, createdByUserId);

            return domainRestriction;
        }

        public async Task<DomainRestriction> UpdateDomainRestrictionAsync(Guid id, string domain, string? reason, bool isActive, Guid updatedByUserId)
        {
            var domainRestriction = await _context.DomainRestrictions.FindAsync(id);
            if (domainRestriction == null)
            {
                throw new ArgumentException($"Domain restriction with ID {id} not found.");
            }

            // Normalize domain to lowercase
            var normalizedDomain = domain.ToLowerInvariant().Trim();

            // Check if domain already exists (excluding current record)
            var existingRestriction = await _context.DomainRestrictions
                .FirstOrDefaultAsync(dr => dr.Domain == normalizedDomain && dr.Id != id);

            if (existingRestriction != null)
            {
                throw new InvalidOperationException($"Domain restriction for '{normalizedDomain}' already exists.");
            }

            domainRestriction.Domain = normalizedDomain;
            domainRestriction.Reason = reason;
            domainRestriction.IsActive = isActive;
            domainRestriction.UpdatedAt = DateTime.UtcNow;
            domainRestriction.UpdatedByUserId = updatedByUserId;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Domain restriction updated for domain: {Domain} by user: {UserId}", normalizedDomain, updatedByUserId);

            return domainRestriction;
        }

        public async Task<bool> DeleteDomainRestrictionAsync(Guid id)
        {
            var domainRestriction = await _context.DomainRestrictions.FindAsync(id);
            if (domainRestriction == null)
            {
                return false;
            }

            _context.DomainRestrictions.Remove(domainRestriction);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Domain restriction deleted for domain: {Domain}", domainRestriction.Domain);

            return true;
        }

        public async Task<bool> IsDomainRestrictedAsync(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
            {
                return false;
            }

            var domain = ExtractDomainFromEmail(email);
            if (string.IsNullOrEmpty(domain))
            {
                return false;
            }

            return await _context.DomainRestrictions
                .AnyAsync(dr => dr.Domain == domain && dr.IsActive);
        }

        public async Task<bool> IsDomainAllowedAsync(string email)
        {
            return !await IsDomainRestrictedAsync(email);
        }

        private static string ExtractDomainFromEmail(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
            {
                return string.Empty;
            }

            var atIndex = email.LastIndexOf('@');
            if (atIndex < 0 || atIndex == email.Length - 1)
            {
                return string.Empty;
            }

            return email.Substring(atIndex + 1).ToLowerInvariant().Trim();
        }
    }
}