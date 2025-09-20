using SapBasisPulse.Api.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SapBasisPulse.Api.Services
{
    public interface IConsultantAvailabilityService
    {
        Task<IEnumerable<ConsultantAvailabilitySlotDto>> GetSlotsForConsultantAsync(Guid consultantId);
        Task<ConsultantAvailabilitySlotDto?> GetSlotByIdAsync(Guid id);
        Task<ConsultantAvailabilitySlotDto> CreateSlotAsync(CreateConsultantAvailabilitySlotDto dto);
        Task<bool> DeleteSlotAsync(Guid id);
    }
}
