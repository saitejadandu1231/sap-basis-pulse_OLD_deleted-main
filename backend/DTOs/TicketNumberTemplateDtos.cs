using System.ComponentModel.DataAnnotations;

namespace SapBasisPulse.Api.DTOs
{
    public class TicketNumberTemplateDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Template { get; set; } = string.Empty;
        public Guid? SupportTypeId { get; set; }
        public string? SupportTypeName { get; set; }
        public Guid? SupportCategoryId { get; set; }
        public string? SupportCategoryName { get; set; }
        public Guid? SupportSubOptionId { get; set; }
        public string? SupportSubOptionName { get; set; }
        public int Priority { get; set; }
        public bool IsActive { get; set; }
        public bool IsDefault { get; set; }
        public int CurrentSequence { get; set; }
        public string DateFormat { get; set; } = "yyyy-MM-dd";
        public string SequenceFormat { get; set; } = "0000";
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string CreatedByUserName { get; set; } = string.Empty;
        public string? UpdatedByUserName { get; set; }
    }

    public class CreateTicketNumberTemplateDto
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }

        [Required]
        [MaxLength(200)]
        public string Template { get; set; } = string.Empty;

        public Guid? SupportTypeId { get; set; }
        public Guid? SupportCategoryId { get; set; }
        public Guid? SupportSubOptionId { get; set; }

        [Range(0, 1000)]
        public int Priority { get; set; } = 0;

        public bool IsActive { get; set; } = true;
        public bool IsDefault { get; set; } = false;

        [MaxLength(50)]
        public string DateFormat { get; set; } = "yyyy-MM-dd";

        [MaxLength(20)]
        public string SequenceFormat { get; set; } = "0000";
    }

    public class UpdateTicketNumberTemplateDto
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }

        [Required]
        [MaxLength(200)]
        public string Template { get; set; } = string.Empty;

        public Guid? SupportTypeId { get; set; }
        public Guid? SupportCategoryId { get; set; }
        public Guid? SupportSubOptionId { get; set; }

        [Range(0, 1000)]
        public int Priority { get; set; }

        public bool IsActive { get; set; }
        public bool IsDefault { get; set; }

        [MaxLength(50)]
        public string DateFormat { get; set; } = "yyyy-MM-dd";

        [MaxLength(20)]
        public string SequenceFormat { get; set; } = "0000";
    }

    public class TicketNumberTemplatePreviewDto
    {
        [Required]
        public string Template { get; set; } = string.Empty;

        [Required]
        public string DateFormat { get; set; } = "yyyy-MM-dd";

        [Required]
        public string SequenceFormat { get; set; } = "0000";

        public Guid? SupportTypeId { get; set; }
        public Guid? SupportCategoryId { get; set; }
        public Guid? SupportSubOptionId { get; set; }
    }

    public class TicketNumberPreviewResultDto
    {
        public string PreviewNumber { get; set; } = string.Empty;
        public bool IsValid { get; set; }
        public string? ErrorMessage { get; set; }
    }
}