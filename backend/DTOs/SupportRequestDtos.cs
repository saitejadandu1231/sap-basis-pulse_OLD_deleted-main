using System;

namespace SapBasisPulse.Api.DTOs
{
    public class CreateSupportRequestDto
    {
        public Guid SupportTypeId { get; set; }
        public Guid SupportCategoryId { get; set; }
        public Guid? SupportSubOptionId { get; set; }
        public string Description { get; set; }
        public string? SrIdentifier { get; set; }
        public string Priority { get; set; }
        public Guid ConsultantId { get; set; }
        public List<Guid> TimeSlotIds { get; set; } = new List<Guid>(); // Multiple time slots
    }

    public class SupportRequestDto
    {
        public Guid Id { get; set; }
        public Guid SupportTypeId { get; set; }
        public string SupportTypeName { get; set; }
        public Guid SupportCategoryId { get; set; }
        public string SupportCategoryName { get; set; }
        public Guid? SupportSubOptionId { get; set; }
        public string? SupportSubOptionName { get; set; }
        public string Description { get; set; }
        public string? SrIdentifier { get; set; }
        public string Priority { get; set; }
        public Guid ConsultantId { get; set; }
        public string ConsultantName { get; set; }
        public List<TimeSlotInfo> TimeSlots { get; set; } = new List<TimeSlotInfo>(); // Multiple time slots
        public Guid CreatedByUserId { get; set; }
        public string CreatedByName { get; set; }
        public DateTime CreatedAt { get; set; }
        public string Status { get; set; }
        public Guid? ConversationId { get; set; }
        public bool HasConversation { get; set; }
        public int UnreadMessageCount { get; set; }
        
        // Payment information
        public decimal TotalAmount { get; set; }
        public string PaymentStatus { get; set; }
        public decimal? ConsultantHourlyRate { get; set; }
        public int TotalHours { get; set; }
    }

    public class TimeSlotInfo
    {
        public Guid Id { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public int DurationHours { get; set; }
    }

    public class UpdateStatusDto
    {
        public string Status { get; set; }
        public string? Comment { get; set; }
    }
}
