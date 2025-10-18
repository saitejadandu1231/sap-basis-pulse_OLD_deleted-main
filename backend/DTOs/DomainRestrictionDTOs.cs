using System.ComponentModel.DataAnnotations;

namespace SapBasisPulse.Api.DTOs
{
    /// <summary>
    /// DTO for returning domain restriction information
    /// </summary>
    public class DomainRestrictionDto
    {
        public Guid Id { get; set; }
        public string Domain { get; set; } = string.Empty;
        public string? Reason { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public string CreatedByUserName { get; set; } = string.Empty;
        public DateTime? UpdatedAt { get; set; }
        public string? UpdatedByUserName { get; set; }
    }

    /// <summary>
    /// DTO for creating a new domain restriction
    /// </summary>
    public class CreateDomainRestrictionDto
    {
        [Required]
        [StringLength(255, MinimumLength = 3)]
        [RegularExpression(@"^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", ErrorMessage = "Invalid domain format")]
        public string Domain { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Reason { get; set; }
    }

    /// <summary>
    /// DTO for updating an existing domain restriction
    /// </summary>
    public class UpdateDomainRestrictionDto
    {
        [Required]
        [StringLength(255, MinimumLength = 3)]
        [RegularExpression(@"^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", ErrorMessage = "Invalid domain format")]
        public string Domain { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Reason { get; set; }

        public bool IsActive { get; set; } = true;
    }

    /// <summary>
    /// DTO for domain check response
    /// </summary>
    public class DomainCheckDto
    {
        public string Domain { get; set; } = string.Empty;
        public bool IsRestricted { get; set; }
    }
}