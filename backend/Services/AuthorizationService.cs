using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using SapBasisPulse.Api.Entities;
using SapBasisPulse.Api.Data;

namespace SapBasisPulse.Api.Services
{
    public interface IAuthorizationService
    {
        Guid GetCurrentUserId();
        UserRole GetCurrentUserRole();
        bool IsAdmin();
        bool IsConsultant();
        bool IsCustomer();
        bool CanManageConsultantSlots(Guid consultantId);
        bool CanViewConsultantSlots(Guid consultantId);
        Task<bool> CanViewSlot(Guid slotId);
        Task<bool> CanManageSlot(Guid slotId);
    }

    public class AuthorizationService : IAuthorizationService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly AppDbContext _context;

        public AuthorizationService(IHttpContextAccessor httpContextAccessor, AppDbContext context)
        {
            _httpContextAccessor = httpContextAccessor;
            _context = context;
        }

        public Guid GetCurrentUserId()
        {
            var userIdClaim = _httpContextAccessor.HttpContext?.User.FindFirst(ClaimTypes.NameIdentifier);
            return userIdClaim != null ? Guid.Parse(userIdClaim.Value) : Guid.Empty;
        }

        public UserRole GetCurrentUserRole()
        {
            var roleClaim = _httpContextAccessor.HttpContext?.User.FindFirst(ClaimTypes.Role);
            return roleClaim != null && Enum.TryParse<UserRole>(roleClaim.Value, out var role) ? role : UserRole.Customer;
        }

        public bool IsAdmin() => GetCurrentUserRole() == UserRole.Admin;
        public bool IsConsultant() => GetCurrentUserRole() == UserRole.Consultant;
        public bool IsCustomer() => GetCurrentUserRole() == UserRole.Customer;

        public bool CanManageConsultantSlots(Guid consultantId)
        {
            if (IsAdmin()) return true;
            if (IsConsultant()) return GetCurrentUserId() == consultantId;
            return false;
        }

        public bool CanViewConsultantSlots(Guid consultantId)
        {
            // Admins and consultants can view any consultant's slots
            // Customers can view any consultant's available slots (for booking)
            return IsAdmin() || IsConsultant() || IsCustomer();
        }

        public async Task<bool> CanViewSlot(Guid slotId)
        {
            if (IsAdmin()) return true;

            var slot = await _context.ConsultantAvailabilitySlots
                .FirstOrDefaultAsync(s => s.Id == slotId);

            if (slot == null) return false;

            // Consultants can view their own slots
            if (IsConsultant() && slot.ConsultantId == GetCurrentUserId()) return true;

            // Customers can view available slots (not booked)
            if (IsCustomer() && slot.BookedByCustomerChoiceId == null) return true;

            return false;
        }

        public async Task<bool> CanManageSlot(Guid slotId)
        {
            if (IsAdmin()) return true;

            var slot = await _context.ConsultantAvailabilitySlots
                .FirstOrDefaultAsync(s => s.Id == slotId);

            if (slot == null) return false;

            // Consultants can manage their own slots
            if (IsConsultant() && slot.ConsultantId == GetCurrentUserId()) return true;

            return false;
        }
    }
}