using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SapBasisPulse.Api.Data;
using SapBasisPulse.Api.Entities;
using System.Security.Claims;

namespace SapBasisPulse.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class StatusController : ControllerBase
    {
        private readonly AppDbContext _context;

        public StatusController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("health")]
        [AllowAnonymous]
        public IActionResult Health()
        {
            return Ok(new { 
                status = "healthy", 
                timestamp = DateTime.UtcNow,
                version = "1.0.0",
                environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development"
            });
        }

        [HttpGet("jwt-secret-check")]
        [AllowAnonymous]
        public IActionResult JwtSecretCheck([FromServices] IConfiguration config)
        {
            var jwtSecret = config.GetSection("JwtSettings")["Secret"];
            var secretLength = jwtSecret?.Length ?? 0;
            var secretBits = secretLength * 8;
            
            return Ok(new { 
                secretLength = secretLength,
                secretBits = secretBits,
                minimumRequired = 128,
                isValid = secretBits >= 128,
                environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development",
                timestamp = DateTime.UtcNow
            });
        }

        [HttpGet("auth-config-check")]
        [AllowAnonymous]
        public IActionResult AuthConfigCheck([FromServices] IConfiguration config)
        {
            var authSection = config.GetSection("Auth");
            
            return Ok(new { 
                autoActivateInDevelopment = authSection["AutoActivateInDevelopment"],
                bypassStatusCheckInDevelopment = authSection["BypassStatusCheckInDevelopment"],
                consultantRegistrationEnabled = authSection["ConsultantRegistrationEnabled"],
                messagingEnabled = authSection["MessagingEnabled"],
                environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development",
                timestamp = DateTime.UtcNow
            });
        }

        [HttpGet("options")]
        public async Task<IActionResult> GetStatusOptions()
        {
            var statusOptions = await _context.StatusMaster
                .Where(sm => sm.IsActive)
                .OrderBy(sm => sm.SortOrder)
                .Select(sm => new
                {
                    sm.Id,
                    sm.StatusCode,
                    sm.StatusName,
                    sm.Description,
                    sm.ColorCode,
                    sm.IconCode
                })
                .ToListAsync();

            return Ok(statusOptions);
        }

        [HttpGet("history/{orderId}")]
        public async Task<IActionResult> GetStatusHistory(Guid orderId)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var userRole = User.FindFirstValue(ClaimTypes.Role);

            // For customers, ensure they can only view their own ticket history
            if (userRole == "Customer")
            {
                var order = await _context.Orders
                    .Where(o => o.Id == orderId && o.CreatedByUserId == userId)
                    .FirstOrDefaultAsync();

                if (order == null)
                {
                    return NotFound(new { error = "Ticket not found or access denied" });
                }
            }

            var statusHistory = await _context.StatusChangeLogs
                .Where(scl => scl.OrderId == orderId)
                .Include(scl => scl.FromStatus)
                .Include(scl => scl.ToStatus)
                .Include(scl => scl.ChangedByUser)
                .OrderBy(scl => scl.ChangedAt)
                .Select(scl => new
                {
                    scl.Id,
                    scl.ChangedAt,
                    FromStatus = scl.FromStatus.StatusName,
                    ToStatus = scl.ToStatus.StatusName,
                    ChangedBy = scl.ChangedByUser.FirstName + " " + scl.ChangedByUser.LastName,
                    scl.Comment,
                    scl.IpAddress
                })
                .ToListAsync();

            return Ok(statusHistory);
        }

        [HttpGet("db-check")]
        [AllowAnonymous]
        public async Task<IActionResult> DatabaseConnectionCheck()
        {
            try
            {
                var connectionString = _context.Database.GetConnectionString();
                var result = new
                {
                    timestamp = DateTime.UtcNow,
                    connectionString = MaskPassword(connectionString ?? "Not found"),
                    canConnect = false,
                    details = new Dictionary<string, object>()
                };

                // Test basic connection
                using var connection = _context.Database.GetDbConnection();
                await connection.OpenAsync();
                
                // Get server info
                using var command = connection.CreateCommand();
                command.CommandText = "SELECT version(), current_database(), inet_server_addr(), inet_server_port()";
                using var reader = await command.ExecuteReaderAsync();
                
                if (await reader.ReadAsync())
                {
                    ((Dictionary<string, object>)result.details)["serverVersion"] = reader.GetString(0);
                    ((Dictionary<string, object>)result.details)["database"] = reader.GetString(1);
                    ((Dictionary<string, object>)result.details)["serverAddress"] = reader.IsDBNull(2) ? "N/A" : reader.GetString(2);
                    ((Dictionary<string, object>)result.details)["serverPort"] = reader.IsDBNull(3) ? "N/A" : reader.GetInt32(3).ToString();
                }

                return Ok(new
                {
                    result.timestamp,
                    result.connectionString,
                    canConnect = true,
                    result.details
                });
            }
            catch (Exception ex)
            {
                return Ok(new
                {
                    timestamp = DateTime.UtcNow,
                    connectionString = MaskPassword(_context.Database.GetConnectionString() ?? "Not found"),
                    canConnect = false,
                    error = ex.Message,
                    innerException = ex.InnerException?.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }

        private static string MaskPassword(string connectionString)
        {
            try
            {
                var parts = connectionString.Split(';', StringSplitOptions.RemoveEmptyEntries);
                for (int i = 0; i < parts.Length; i++)
                {
                    if (parts[i].Trim().StartsWith("Password=", StringComparison.OrdinalIgnoreCase))
                    {
                        parts[i] = "Password=****";
                    }
                }
                return string.Join(';', parts);
            }
            catch
            {
                return "[Masking failed]";
            }
        }
    }
}