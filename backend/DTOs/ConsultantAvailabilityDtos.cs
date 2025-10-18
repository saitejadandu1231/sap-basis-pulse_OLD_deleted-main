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
        [Required(ErrorMessage = "Consultant ID is required")]
        public Guid ConsultantId { get; set; }
        
        [Required(ErrorMessage = "Start time is required")]
        public DateTime SlotStartTime { get; set; }
        
        [Required(ErrorMessage = "End time is required")]
        public DateTime SlotEndTime { get; set; }

        // Custom validation method that can be called by the service
        public void Validate()
        {
            if (SlotEndTime <= SlotStartTime)
            {
                throw new ArgumentException("End time must be after start time");
            }

            // Ensure at least 30 minutes duration
            if ((SlotEndTime - SlotStartTime).TotalMinutes < 30)
            {
                throw new ArgumentException("Availability slots must be at least 30 minutes long");
            }

            // Ensure not longer than 8 hours
            if ((SlotEndTime - SlotStartTime).TotalHours > 8)
            {
                throw new ArgumentException("Availability slots cannot be longer than 8 hours. Please create multiple shorter slots instead.");
            }
        }
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
