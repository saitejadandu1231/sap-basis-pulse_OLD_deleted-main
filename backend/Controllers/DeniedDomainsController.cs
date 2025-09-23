using Microsoft.AspNetCore.Mvc;

namespace SapBasisPulse.Api.Controllers
{
    [ApiController]
    [Route("api/denied_domains")]
    public class DeniedDomainsController : ControllerBase
    {
        // Simple endpoint to satisfy frontend checks for denied domains.
        // Currently returns an empty list (no denied domains). This can be
        // extended to read from DB or configuration later.
        [HttpGet]
        public IActionResult Get([FromQuery] string? select, [FromQuery] string? domain_name, [FromQuery] string? status)
        {
            // If there is a domain_name and status filter, we could check a DB.
            // For now, return an empty array to indicate the domain is not denied.
            var result = new object[] { };
            return Ok(result);
        }
    }
}
