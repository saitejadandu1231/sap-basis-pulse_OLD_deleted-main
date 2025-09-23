using System;
using System.Collections.Generic;

namespace SapBasisPulse.Api.Entities
{
    public class Message
    {
        public Guid Id { get; set; }
        public Guid ConversationId { get; set; }
        public Conversation Conversation { get; set; }
        public Guid SenderId { get; set; }
        public User Sender { get; set; }
        public string Content { get; set; }
        public string MessageType { get; set; } // "text", "file", "system"
        public DateTime SentAt { get; set; }
        public DateTime? ReadAt { get; set; }
        public bool IsEdited { get; set; }
        public DateTime? EditedAt { get; set; }
        public ICollection<MessageAttachment> Attachments { get; set; }
    }
}