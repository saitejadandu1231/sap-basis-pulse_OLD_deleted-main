using System;

namespace SapBasisPulse.Api.Entities
{
    public class TicketRating
    {
        public Guid Id { get; set; }
        public Guid OrderId { get; set; }
        public Order Order { get; set; }
        public Guid RatedByUserId { get; set; }
        public User RatedByUser { get; set; }
        public Guid RatedUserId { get; set; }
        public User RatedUser { get; set; }
        public string RatingForRole { get; set; }
        public int? CommunicationProfessionalism { get; set; }
        public int? ResolutionQuality { get; set; }
        public int? ResponseTime { get; set; }
        public string? Comments { get; set; }
    }
}