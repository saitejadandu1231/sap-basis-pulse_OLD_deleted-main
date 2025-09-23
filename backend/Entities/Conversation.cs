using System;
using System.Collections.Generic;

namespace SapBasisPulse.Api.Entities
{
    public class Conversation
    {
        public Guid Id { get; set; }
        public Guid OrderId { get; set; }
        public Order Order { get; set; }
        public Guid CustomerId { get; set; }
        public User Customer { get; set; }
        public Guid? ConsultantId { get; set; }
        public User Consultant { get; set; }
        public string Subject { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime LastMessageAt { get; set; }
        public bool IsActive { get; set; }
        public ICollection<Message> Messages { get; set; }
    }
}