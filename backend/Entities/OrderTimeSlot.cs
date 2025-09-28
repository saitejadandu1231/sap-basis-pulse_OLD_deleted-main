using System;

namespace SapBasisPulse.Api.Entities
{
    public class OrderTimeSlot
    {
        public Guid Id { get; set; }
        public Guid OrderId { get; set; }
        public Order Order { get; set; }
        public Guid TimeSlotId { get; set; }
        public ConsultantAvailabilitySlot TimeSlot { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}