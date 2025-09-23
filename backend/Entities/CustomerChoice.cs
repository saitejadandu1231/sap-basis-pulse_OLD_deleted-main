using System;
using System.Collections.Generic;

namespace SapBasisPulse.Api.Entities
{
    public class CustomerChoice
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public User User { get; set; }
        public Guid? ConsultantId { get; set; }
        public User Consultant { get; set; }
        public string Description { get; set; }
        public string Priority { get; set; }
        public string Status { get; set; }
        public DateTime? ScheduledTime { get; set; }
        public Guid? SupportTypeId { get; set; }
        public SupportType SupportType { get; set; }
        public Guid? SupportCategoryId { get; set; }
        public SupportCategory SupportCategory { get; set; }
        public Guid? SupportSubOptionId { get; set; }
        public SupportSubOption SupportSubOption { get; set; }
    public Guid? SlotId { get; set; }
    public ConsultantAvailabilitySlot Slot { get; set; }
    public DateTime CreatedAt { get; set; }
    public ICollection<Order> Orders { get; set; }
    }
}