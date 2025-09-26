using System;

namespace SapBasisPulse.Api.Entities
{
    public class AdminPaymentSettings
    {
        public Guid Id { get; set; }
        public bool PaymentsEnabled { get; set; } = true;
        public string Currency { get; set; } = "INR";
        public decimal PlatformCommissionPercent { get; set; } = 10m; // default 10%

        // Optional: for reference only; actual secrets come from config
        public string? RazorpayKeyIdHint { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}
