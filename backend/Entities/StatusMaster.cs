using System.ComponentModel.DataAnnotations;

namespace SapBasisPulse.Api.Entities
{
    public class StatusMaster
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        [MaxLength(50)]
        public string StatusCode { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(100)]
        public string StatusName { get; set; } = string.Empty;
        
        [MaxLength(500)]
        public string? Description { get; set; }
        
        [MaxLength(20)]
        public string? ColorCode { get; set; } // For UI styling (e.g., "bg-blue-500")
        
        [MaxLength(50)]
        public string? IconCode { get; set; } // For UI icons
        
        public int SortOrder { get; set; } = 0;
        
        public bool IsActive { get; set; } = true;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? UpdatedAt { get; set; }
        
        // Navigation properties
        public ICollection<Order> Orders { get; set; } = new List<Order>();
        public ICollection<StatusChangeLog> StatusChangeLogs { get; set; } = new List<StatusChangeLog>();
    }
}