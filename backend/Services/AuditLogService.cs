using SapBasisPulse.Api.Data;
using SapBasisPulse.Api.Entities;
using System;
using System.Threading.Tasks;

namespace SapBasisPulse.Api.Services
{
    public class AuditLogService : IAuditLogService
    {
        private readonly AppDbContext _context;
        public AuditLogService(AppDbContext context)
        {
            _context = context;
        }

        public async Task LogAsync(Guid? userId, string action, string entity, string entityId, string details, string ipAddress)
        {
            var log = new AuditLog
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Action = action,
                Entity = entity,
                EntityId = entityId,
                Details = details,
                Timestamp = DateTime.UtcNow,
                IpAddress = ipAddress
            };
            _context.AuditLogs.Add(log);
            await _context.SaveChangesAsync();
        }
    }
}
