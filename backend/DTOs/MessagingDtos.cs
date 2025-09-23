using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace SapBasisPulse.Api.DTOs
{
    public class ConversationDto
    {
        public Guid Id { get; set; }
        public Guid OrderId { get; set; }
        public string OrderNumber { get; set; }
        public Guid CustomerId { get; set; }
        public string CustomerName { get; set; }
        public Guid? ConsultantId { get; set; }
        public string ConsultantName { get; set; }
        public string Subject { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime LastMessageAt { get; set; }
        public bool IsActive { get; set; }
        public int UnreadCount { get; set; }
        public MessageDto LastMessage { get; set; }
    }

    public class MessageDto
    {
        public Guid Id { get; set; }
        public Guid ConversationId { get; set; }
        public Guid SenderId { get; set; }
        public string SenderName { get; set; }
        public string SenderRole { get; set; }
        public string Content { get; set; }
        public string MessageType { get; set; }
        public DateTime SentAt { get; set; }
        public DateTime? ReadAt { get; set; }
        public bool IsEdited { get; set; }
        public DateTime? EditedAt { get; set; }
        public List<MessageAttachmentDto> Attachments { get; set; } = new List<MessageAttachmentDto>();
    }

    public class MessageAttachmentDto
    {
        public Guid Id { get; set; }
        public string FileName { get; set; }
        public string OriginalFileName { get; set; }
        public string ContentType { get; set; }
        public long FileSize { get; set; }
        public DateTime UploadedAt { get; set; }
        public string UploadedByName { get; set; }
        public string DownloadUrl { get; set; }
    }

    public class CreateConversationDto
    {
        [Required]
        public Guid OrderId { get; set; }
        
        [Required]
        [MaxLength(200)]
        public string Subject { get; set; }
        
        [Required]
        [MaxLength(1000)]
        public string InitialMessage { get; set; }
    }

    public class CreateMessageDto
    {
        [Required]
        public Guid ConversationId { get; set; }
        
        [Required]
        [MaxLength(2000)]
        public string Content { get; set; }
        
        public string MessageType { get; set; } = "text";
    }

    public class UpdateMessageDto
    {
        [Required]
        [MaxLength(2000)]
        public string Content { get; set; }
    }

    public class MarkMessageReadDto
    {
        [Required]
        public List<Guid> MessageIds { get; set; } = new List<Guid>();
    }
}