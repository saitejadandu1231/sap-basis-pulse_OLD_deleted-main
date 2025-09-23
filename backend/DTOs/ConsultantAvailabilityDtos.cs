using System;
using System.ComponentModel.DataAnnotations;

namespace SapBasisPulse.Api.DTOs
{
    public class ConsultantAvailabilitySlotDto
    {
        public Guid Id { get; set; }
        public Guid ConsultantId { get; set; }
        public DateTime SlotStartTime { get; set; }
        public DateTime SlotEndTime { get; set; }
        public bool IsBooked { get; set; }
    }

    public class CreateConsultantAvailabilitySlotDto
    {
        [Required]
        public Guid ConsultantId { get; set; }
        
        [Required]
        public DateTime SlotStartTime { get; set; }
        
        [Required]
        public DateTime SlotEndTime { get; set; }
    }
    
    public class ConsultantAvailabilitySlotsResponse
    {
        public IEnumerable<ConsultantAvailabilitySlotDto> Slots { get; set; }
    }

    public class BookedSlotDto
    {
        public Guid Id { get; set; }
        public Guid ConsultantId { get; set; }
        public DateTime SlotStartTime { get; set; }
        public DateTime SlotEndTime { get; set; }
        public string OrderNumber { get; set; }
        public string CustomerName { get; set; }
        public string CustomerEmail { get; set; }
        public string SupportTypeName { get; set; }
        public string SupportCategoryName { get; set; }
        public string Priority { get; set; }
        public string Description { get; set; }
        public string Status { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
