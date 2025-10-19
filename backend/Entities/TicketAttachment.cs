using System;
using System.ComponentModel.DataAnnotations;

namespace SapBasisPulse.Api.Entities
{
    public class TicketAttachment
    {
        public Guid Id { get; set; }
        
        [Required]
        public Guid OrderId { get; set; }
        
        [Required]
        public Guid UploadedById { get; set; }
        
        [Required]
        [MaxLength(255)]
        public string FileName { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(255)]
        public string OriginalFileName { get; set; } = string.Empty;
        
        [Required]
        public string FileUrl { get; set; } = string.Empty;
        
        public long FileSize { get; set; }
        
        [MaxLength(100)]
        public string ContentType { get; set; } = string.Empty;
        
        [MaxLength(50)]
        public string UploadProvider { get; set; } = "cloudinary";
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public Order Order { get; set; } = null!;
        public User UploadedBy { get; set; } = null!;
    }
}