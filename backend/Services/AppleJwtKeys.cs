using System.Collections.Generic;

namespace SapBasisPulse.Api.Services
{
    public class AppleJwtKeys
    {
        public List<AppleJwtKey> Keys { get; set; }
    }
    public class AppleJwtKey
    {
        public string Kty { get; set; }
        public string Kid { get; set; }
        public string Use { get; set; }
        public string Alg { get; set; }
        public string N { get; set; }
        public string E { get; set; }
    }
}
