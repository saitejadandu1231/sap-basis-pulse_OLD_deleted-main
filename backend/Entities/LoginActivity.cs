using System;

namespace SapBasisPulse.Api.Entities
{
    public class LoginActivity
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public User User { get; set; }
        public string LoginStatus { get; set; }
        public DateTime LoginTime { get; set; }
        public DateTime? LogoutTime { get; set; }
        public string SsoProviderUsed { get; set; }
        public string DeviceInfo { get; set; }
        public string IpAddress { get; set; }
    }
}