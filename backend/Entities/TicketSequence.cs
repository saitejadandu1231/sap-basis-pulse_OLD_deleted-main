using System.ComponentModel.DataAnnotations;

namespace SapBasisPulse.Api.Entities
{
    public class TicketSequence
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public int Year { get; set; }
        
        [Required]
        public int LastSequenceNumber { get; set; }
        
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}