using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SapBasisPulse.Api.Entities
{
    public class StatusChangeLog
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();
        
        [Required]
        public Guid OrderId { get; set; }
        
        [Required]
        public int FromStatusId { get; set; }
        
        [Required]
        public int ToStatusId { get; set; }
        
        [Required]
        public Guid ChangedByUserId { get; set; }
        
        [MaxLength(1000)]
        public string? Comment { get; set; }
        
        [MaxLength(45)]
        public string? IpAddress { get; set; }
        
        public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        [ForeignKey("OrderId")]
        public Order Order { get; set; } = null!;
        
        [ForeignKey("FromStatusId")]
        public StatusMaster FromStatus { get; set; } = null!;
        
        [ForeignKey("ToStatusId")]
        public StatusMaster ToStatus { get; set; } = null!;
        
        [ForeignKey("ChangedByUserId")]
        public User ChangedByUser { get; set; } = null!;
    }
}