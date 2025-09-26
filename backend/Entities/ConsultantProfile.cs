using System;

namespace SapBasisPulse.Api.Entities
{
    public class ConsultantProfile
    {
        // Use ConsultantId as both PK and FK for 1:1 with User
        public Guid ConsultantId { get; set; }
        public User Consultant { get; set; } = null!;

        // Pricing
        public decimal HourlyRate { get; set; }

        // Payout info (v1: UPI-based manual payouts)
        public string? UPIId { get; set; }
        public bool IsVerified { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}
