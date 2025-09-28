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
        public List<Guid> TimeSlotIds { get; set; } = new List<Guid>();
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
        public Guid TimeSlotId { get; set; } // Keep for backward compatibility
        public DateTime SlotStartTime { get; set; } // Keep for backward compatibility
        public DateTime SlotEndTime { get; set; } // Keep for backward compatibility
        public List<OrderSlotDto> OrderSlots { get; set; } = new List<OrderSlotDto>();
        public Guid CreatedByUserId { get; set; }
        public string CreatedByName { get; set; }
        public DateTime CreatedAt { get; set; }
        public string Status { get; set; }
        public Guid? ConversationId { get; set; }
        public bool HasConversation { get; set; }
        public int UnreadMessageCount { get; set; }
        public string? PaymentStatus { get; set; }
    }

    public class UpdateStatusDto
    {
        public string Status { get; set; }
        public string? Comment { get; set; }
    }

    public class OrderSlotDto
    {
        public Guid Id { get; set; }
        public Guid SlotId { get; set; }
        public DateTime SlotStartTime { get; set; }
        public DateTime SlotEndTime { get; set; }
    }
}
