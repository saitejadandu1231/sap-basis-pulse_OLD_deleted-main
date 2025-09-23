using System;

namespace SapBasisPulse.Api.Entities
{
    public class ServiceRequestIdentifier
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Identifier { get; set; }
        public string Task { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}