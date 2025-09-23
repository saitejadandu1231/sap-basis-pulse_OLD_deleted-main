using System;

namespace SapBasisPulse.Api.DTOs
{
    public class TicketRatingDto
    {
        public Guid Id { get; set; }
        public Guid OrderId { get; set; }
        public Guid RatedByUserId { get; set; }
        public Guid RatedUserId { get; set; }
        public string RatingForRole { get; set; }
        public int? CommunicationProfessionalism { get; set; }
        public int? ResolutionQuality { get; set; }
        public int? ResponseTime { get; set; }
        public string Comments { get; set; }
    }

    public class CreateTicketRatingDto
    {
        public Guid OrderId { get; set; }
        public Guid RatedByUserId { get; set; }
        public Guid RatedUserId { get; set; }
        public string RatingForRole { get; set; }
        public int? CommunicationProfessionalism { get; set; }
        public int? ResolutionQuality { get; set; }
        public int? ResponseTime { get; set; }
        public string Comments { get; set; }
    }
}
