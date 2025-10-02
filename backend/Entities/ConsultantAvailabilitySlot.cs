using System;

namespace SapBasisPulse.Api.Entities
{
    public class ConsultantAvailabilitySlot
    {
        public Guid Id { get; set; }
        public Guid ConsultantId { get; set; }
        public User Consultant { get; set; }
        public DateTime SlotStartTime { get; set; }
        public DateTime SlotEndTime { get; set; }
        public Guid? BookedByCustomerChoiceId { get; set; }
        public CustomerChoice BookedByCustomerChoice { get; set; }

        // Audit fields
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string? CreatedBy { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? UpdatedBy { get; set; }
        public bool IsDeleted { get; set; } = false;
    }
}