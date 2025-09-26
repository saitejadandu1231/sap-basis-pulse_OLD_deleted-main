using System;

namespace SapBasisPulse.Api.Entities
{
    public enum PaymentStatus
    {
        Created = 0,
        Paid = 1,
        Failed = 2,
        Refunded = 3
    }

    public class Payment
    {
        public Guid Id { get; set; }

        // Link to support request (Order)
        public Guid OrderId { get; set; }
        public Order Order { get; set; } = null!;

        // Razorpay identifiers
        public string RazorpayOrderId { get; set; } = string.Empty;
        public string? RazorpayPaymentId { get; set; }
        public string? RazorpaySignature { get; set; }

        // Amounts
        public long AmountInPaise { get; set; } // store smallest unit, INR paise
        public string Currency { get; set; } = "INR";

        // Fee breakdown
        public decimal PlatformCommissionPercent { get; set; }
        public long PlatformFeeInPaise { get; set; }
        public long ConsultantEarningInPaise { get; set; }

        public PaymentStatus Status { get; set; } = PaymentStatus.Created;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? CapturedAt { get; set; }
        public DateTime? FailedAt { get; set; }
    }
}
