using System;

namespace SapBasisPulse.Api.Entities
{
    public enum PaymentStatus
    {
        Created = 0,
        Paid = 1,
        Failed = 2,
        Refunded = 3,
        PayoutInitiated = 4,
        PayoutCompleted = 5,
        PayoutFailed = 6,
        InEscrow = 7,
        EscrowReadyForRelease = 8,
        EscrowReleased = 9,
        EscrowCancelled = 10
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

        // Payout information
        public string? PayoutId { get; set; } // Razorpay payout ID
        public string? PayoutReference { get; set; } // Internal reference
        public DateTime? PayoutInitiatedAt { get; set; }
        public DateTime? PayoutCompletedAt { get; set; }
        public DateTime? PayoutFailedAt { get; set; }
        public string? PayoutFailureReason { get; set; }

        // Refund information
        public long? RefundAmountInPaise { get; set; }
        public string? RefundId { get; set; } // Razorpay refund ID
        public DateTime? RefundedAt { get; set; }
        public string? RefundReason { get; set; }

        // Escrow information
        public bool IsInEscrow { get; set; } = false;
        public DateTime? EscrowInitiatedAt { get; set; }
        public DateTime? EscrowReleasedAt { get; set; }
        public DateTime? EscrowCancelledAt { get; set; }
        public string? EscrowReleaseCondition { get; set; } // e.g., "ServiceCompleted", "TimeBased", "Manual"
        public string? EscrowNotes { get; set; }
    }
}
