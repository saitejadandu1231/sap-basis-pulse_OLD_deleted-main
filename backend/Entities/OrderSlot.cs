using System;

namespace SapBasisPulse.Api.Entities
{
    public class OrderSlot
    {
        public Guid Id { get; set; }
        public Guid OrderId { get; set; }
        public Order Order { get; set; }
        public Guid SlotId { get; set; }
        public ConsultantAvailabilitySlot Slot { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}