namespace SapBasisPulse.Api.Services
{
    public interface IEmailSettingsService
    {
        bool IsEmailVerificationEnabled();
        bool IsEmailVerificationRequired();
        int GetEmailVerificationTokenExpiryHours();
        Task UpdateEmailVerificationSettings(bool enableEmailVerification, bool requireEmailVerification);
    }
}