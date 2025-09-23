using System.Security.Cryptography;
using System.Text;

namespace SapBasisPulse.Api.Services
{
    public static class TokenHelper
    {
        public static string GenerateRefreshToken()
        {
            var randomNumber = new byte[64];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomNumber);
            return Convert.ToBase64String(randomNumber);
        }
    }
}
