namespace SapBasisPulse.Api.DTOs
{
    public class EmailSettingsDto
    {
        public bool EnableEmailVerification { get; set; }
        public bool RequireEmailVerification { get; set; }
        public int EmailVerificationTokenExpiryHours { get; set; }
    }

    public class UpdateEmailSettingsDto
    {
        public bool EnableEmailVerification { get; set; }
        public bool RequireEmailVerification { get; set; }
    }
}