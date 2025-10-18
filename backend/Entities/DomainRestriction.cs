using System.ComponentModel.DataAnnotations;

namespace SapBasisPulse.Api.Entities
{
    public class DomainRestriction
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        
        [Required]
        [StringLength(255)]
        public string Domain { get; set; } = string.Empty;
        
        [StringLength(500)]
        public string? Reason { get; set; }
        
        public bool IsActive { get; set; } = true;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public Guid CreatedByUserId { get; set; }
        
        public User CreatedByUser { get; set; } = null!;
        
        public DateTime? UpdatedAt { get; set; }
        
        public Guid? UpdatedByUserId { get; set; }
        
        public User? UpdatedByUser { get; set; }
    }
}