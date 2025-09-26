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
    }

    public class ConsultantProfileDto
    {
        public decimal HourlyRate { get; set; }
        public string? UPIId { get; set; }
        public bool IsVerified { get; set; }
    }
}
