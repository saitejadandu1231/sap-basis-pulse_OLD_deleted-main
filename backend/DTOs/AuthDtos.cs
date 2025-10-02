using System.ComponentModel.DataAnnotations;

namespace SapBasisPulse.Api.DTOs
{
    public class RegisterDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        public string Password { get; set; }

        [Required]
        public string FirstName { get; set; }

        [Required]
        public string LastName { get; set; }

        [Required]
        public string Role { get; set; } // "Customer" or "Consultant"

        // Skills for consultants (optional, only used when Role is Consultant)
        public List<CreateConsultantSkillDto>? Skills { get; set; }
    }

    public class LoginDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        public string Password { get; set; }
    }

    public class SupabaseCallbackDto
    {
        [Required]
        public string AccessToken { get; set; }
        
        [Required]
        public string Provider { get; set; }
    }

    public class CompleteSupabaseSignupDto
    {
        [Required]
        public string SupabaseUserId { get; set; }
        
        [Required]
        public string Role { get; set; }
        
        // Optional - will use Google-provided names if not specified
        public string? FirstName { get; set; }
        
        // Optional - will use Google-provided names if not specified  
        public string? LastName { get; set; }
        
        // Required - for secure account access
        [Required]
        public string Password { get; set; }
        
        // Required - confirm password
        [Required]
        public string ConfirmPassword { get; set; }
    }

    public class SSOConfigDto
    {
        public bool GoogleEnabled { get; set; }
        public bool AppleEnabled { get; set; }
        public bool SupabaseEnabled { get; set; }
    }
}