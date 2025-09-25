using System.ComponentModel.DataAnnotations;

namespace SapBasisPulse.Api.Entities
{
    public class SSOConfiguration
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();
        public bool GoogleEnabled { get; set; } = false;
        public bool AppleEnabled { get; set; } = false;
        public bool SupabaseEnabled { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}