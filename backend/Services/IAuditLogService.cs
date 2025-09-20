using SapBasisPulse.Api.Entities;
using System;
using System.Threading.Tasks;

namespace SapBasisPulse.Api.Services
{
    public interface IAuditLogService
    {
        Task LogAsync(Guid? userId, string action, string entity, string entityId, string details, string ipAddress);
    }
}
