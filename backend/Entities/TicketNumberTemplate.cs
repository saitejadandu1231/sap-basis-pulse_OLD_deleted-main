using System;
using System.ComponentModel.DataAnnotations;

namespace SapBasisPulse.Api.Entities
{
    public class TicketNumberTemplate
    {
        public Guid Id { get; set; }
        
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;
        
        [MaxLength(500)]
        public string? Description { get; set; }
        
        // Template pattern using placeholders like {SupportType}, {Category}, {SubType}, {Date}, {Sequence}
        [Required]
        [MaxLength(200)]
        public string Template { get; set; } = string.Empty;
        
        // Optional: Specific support type this template applies to
        public Guid? SupportTypeId { get; set; }
        public SupportType? SupportType { get; set; }
        
        // Optional: Specific category this template applies to  
        public Guid? SupportCategoryId { get; set; }
        public SupportCategory? SupportCategory { get; set; }
        
        // Optional: Specific sub-option this template applies to
        public Guid? SupportSubOptionId { get; set; }
        public SupportSubOption? SupportSubOption { get; set; }
        
        // Priority for template selection (higher number = higher priority)
        public int Priority { get; set; } = 0;
        
        // Whether this template is active
        public bool IsActive { get; set; } = true;
        
        // Whether this is the default template (fallback)
        public bool IsDefault { get; set; } = false;
        
        // Sequence counter for generating unique numbers
        public int CurrentSequence { get; set; } = 0;
        
        // Date format for {Date} placeholder (e.g., "yyyy-MM-dd", "yyyyMMdd")
        [MaxLength(50)]
        public string DateFormat { get; set; } = "yyyy-MM-dd";
        
        // Sequence format for {Sequence} placeholder (e.g., "0000" for 4-digit padding)
        [MaxLength(20)]
        public string SequenceFormat { get; set; } = "0000";
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        
        // Audit fields
        public Guid CreatedByUserId { get; set; }
        public User CreatedByUser { get; set; } = null!;
        
        public Guid? UpdatedByUserId { get; set; }
        public User? UpdatedByUser { get; set; }
    }
}