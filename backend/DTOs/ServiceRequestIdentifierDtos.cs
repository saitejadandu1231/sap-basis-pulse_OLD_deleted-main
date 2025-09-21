using System;

namespace SapBasisPulse.Api.DTOs
{
    public class ServiceRequestIdentifierDto
    {
        public Guid Id { get; set; }
        public string Identifier { get; set; }
        public string Task { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class CreateServiceRequestIdentifierDto
    {
        public string Identifier { get; set; }
        public string Task { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class UpdateServiceRequestIdentifierDto
    {
        public string Identifier { get; set; }
        public string Task { get; set; }
        public bool IsActive { get; set; }
    }
}