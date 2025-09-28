using System;

namespace SapBasisPulse.Api.DTOs
{
    public class CreatePaymentOrderRequest
    {
        public Guid OrderId { get; set; }
    }

    public class CreatePaymentOrderResponse
    {
        public string RazorpayOrderId { get; set; } = string.Empty;
        public long AmountInPaise { get; set; }
        public string Currency { get; set; } = "INR";
        public string RazorpayKeyId { get; set; } = string.Empty; // public key for checkout
        public string Description { get; set; } = string.Empty;
        public string Receipt { get; set; } = string.Empty;
    }

    public class VerifyPaymentRequest
    {
        public Guid OrderId { get; set; }
        public string RazorpayOrderId { get; set; } = string.Empty;
        public string RazorpayPaymentId { get; set; } = string.Empty;
        public string RazorpaySignature { get; set; } = string.Empty;
    }

    public class PaymentSummaryDto
    {
        public Guid OrderId { get; set; }
        public string Status { get; set; } = string.Empty;
        public long AmountInPaise { get; set; }
        public long PlatformFeeInPaise { get; set; }
        public long ConsultantEarningInPaise { get; set; }
        public string Currency { get; set; } = "INR";
        public DateTime? CapturedAt { get; set; }
        // Expose Razorpay identifiers so client can open checkout for an existing order
        public string RazorpayOrderId { get; set; } = string.Empty;
        public string RazorpayKeyId { get; set; } = string.Empty;
        // Payout information
        public string? PayoutStatus { get; set; }
        public DateTime? PayoutCompletedAt { get; set; }
        // Refund information
        public long? RefundAmountInPaise { get; set; }
        public DateTime? RefundedAt { get; set; }
    }

    public class RefundRequest
    {
        public Guid OrderId { get; set; }
        public string Reason { get; set; } = string.Empty;
        public long? AmountInPaise { get; set; } // Optional: partial refund
    }

    public class RefundResponse
    {
        public bool Success { get; set; }
        public string? RefundId { get; set; }
        public long? RefundAmountInPaise { get; set; }
        public string? Error { get; set; }
    }

    public class ProcessPayoutRequest
    {
        public Guid OrderId { get; set; }
    }

    public class PaymentAnalyticsDto
    {
        public decimal TotalRevenue { get; set; }
        public int TotalTransactions { get; set; }
        public decimal AverageTransactionValue { get; set; }
        public decimal TotalPlatformFees { get; set; }
        public decimal TotalConsultantPayouts { get; set; }
        public int PendingPayouts { get; set; }
        public int FailedPayouts { get; set; }
        public decimal RefundRate { get; set; }
        public MonthlyPaymentData[] MonthlyData { get; set; } = Array.Empty<MonthlyPaymentData>();
    }

    public class MonthlyPaymentData
    {
        public string Month { get; set; } = string.Empty;
        public decimal Revenue { get; set; }
        public int TransactionCount { get; set; }
        public decimal PlatformFees { get; set; }
    }

    public class ConsultantEarningsDto
    {
        public Guid ConsultantId { get; set; }
        public decimal TotalEarned { get; set; }
        public decimal PlatformFeesDeducted { get; set; }
        public decimal NetReceived { get; set; }
        public int CompletedSessions { get; set; }
        public decimal AverageRating { get; set; }
        public ConsultantEarningBreakdown[] MonthlyBreakdown { get; set; } = Array.Empty<ConsultantEarningBreakdown>();
        public PendingPayout[] PendingPayouts { get; set; } = Array.Empty<PendingPayout>();
    }

    public class ConsultantEarningBreakdown
    {
        public string Month { get; set; } = string.Empty;
        public decimal GrossEarnings { get; set; }
        public decimal PlatformFees { get; set; }
        public decimal NetEarnings { get; set; }
        public int SessionsCount { get; set; }
    }

    public class PendingPayout
    {
        public Guid OrderId { get; set; }
        public decimal Amount { get; set; }
        public DateTime CompletedAt { get; set; }
        public string Status { get; set; } = string.Empty;
    }

    public class ConsultantProfileDto
    {
        public decimal HourlyRate { get; set; }
        public string? UPIId { get; set; }
        public bool IsVerified { get; set; }
    }

    public class ConsultantPaymentDto
    {
        public string Id { get; set; } = string.Empty;
        public string OrderId { get; set; } = string.Empty;
        public string OrderNumber { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public decimal ConsultantEarning { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public DateTime? PaymentDate { get; set; }
    }

    public class ConsultantEarningsSummaryDto
    {
        public decimal TotalEarned { get; set; }
        public decimal MonthlyEarnings { get; set; }
        public int PendingPayments { get; set; }
        public int CompletedPayments { get; set; }
        public decimal AverageRating { get; set; }
        public int TotalSessions { get; set; }
    }

    public class ScheduleReminderRequest
    {
        public DateTime ScheduledFor { get; set; }
        public string ReminderType { get; set; } = "email"; // email, sms, both
        public string? Message { get; set; }
    }
}
