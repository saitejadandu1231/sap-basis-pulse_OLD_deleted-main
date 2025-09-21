using System;

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
        public Guid ConsultantId { get; set; }
        public DateTime SlotStartTime { get; set; }
        public DateTime SlotEndTime { get; set; }
    }
    
    public class ConsultantAvailabilitySlotsResponse
    {
        public IEnumerable<ConsultantAvailabilitySlotDto> Slots { get; set; }
    }
}
