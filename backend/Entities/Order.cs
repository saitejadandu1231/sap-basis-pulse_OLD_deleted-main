using System;
using System.Collections.Generic;

namespace SapBasisPulse.Api.Entities
{

    // Consider using enum for status, but keep as string for compatibility with service usage
    // public enum OrderStatus { Pending, InProgress, Completed, Cancelled }

    public class Order
    {
        public Guid Id { get; set; }
        public Guid CustomerChoiceId { get; set; }
        public CustomerChoice CustomerChoice { get; set; }
        public Guid? ConsultantId { get; set; }
        public User Consultant { get; set; }
        public string OrderNumber { get; set; }
        public string SupportTypeName { get; set; }
        public ICollection<TicketRating> TicketRatings { get; set; }

        // Support request fields
        public Guid SupportTypeId { get; set; }
        public SupportType SupportType { get; set; }
        public Guid SupportCategoryId { get; set; }
        public SupportCategory SupportCategory { get; set; }
        public Guid? SupportSubOptionId { get; set; }
        public SupportSubOption SupportSubOption { get; set; }
        public string Description { get; set; }
        public string SrIdentifier { get; set; }
        public string Priority { get; set; }
        
        // Time slots - now supporting multiple slots
        public ICollection<OrderTimeSlot> OrderTimeSlots { get; set; } = new List<OrderTimeSlot>();
        
        // Legacy single time slot for backward compatibility (can be removed later)
        public Guid? TimeSlotId { get; set; }
        public ConsultantAvailabilitySlot TimeSlot { get; set; }
        
        public Guid CreatedByUserId { get; set; }
        public User CreatedByUser { get; set; }
        public DateTime CreatedAt { get; set; }
        
        // Status properties - keeping both for gradual migration
        public string StatusString { get; set; } = "New"; // Keep existing string status for compatibility
        public int StatusId { get; set; } // New foreign key
        public StatusMaster Status { get; set; } = null!; // Navigation property
        
        public DateTime? LastUpdated { get; set; }
        
        // Payment fields
        public decimal TotalAmount { get; set; } = 0; // Total amount to be paid
        public string PaymentStatus { get; set; } = "Pending"; // Pending, Paid, Failed
        public string? RazorpayOrderId { get; set; } // Razorpay order ID
        public string? RazorpayPaymentId { get; set; } // Razorpay payment ID
        public DateTime? PaymentCompletedAt { get; set; } // When payment was completed
        
        // Navigation properties
        public ICollection<StatusChangeLog> StatusChangeLogs { get; set; } = new List<StatusChangeLog>();
    }
}