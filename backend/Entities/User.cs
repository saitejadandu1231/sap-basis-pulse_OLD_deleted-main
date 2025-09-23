using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Identity;

namespace SapBasisPulse.Api.Entities
{
    public enum UserRole { Admin, Customer, Consultant }
    public enum UserStatus { PendingVerification, Active, Inactive, Suspended }

    public class User : IdentityUser<Guid>
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public UserRole Role { get; set; }
        public UserStatus Status { get; set; }
        public string? SsoProvider { get; set; }
        public ICollection<ConsultantAvailabilitySlot> ConsultantSlots { get; set; } = new List<ConsultantAvailabilitySlot>();
        public ICollection<CustomerChoice> CustomerChoices { get; set; } = new List<CustomerChoice>();
        public ICollection<Order> Orders { get; set; } = new List<Order>();
    }
}