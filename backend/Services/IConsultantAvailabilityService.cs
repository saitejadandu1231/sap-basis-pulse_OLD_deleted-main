using SapBasisPulse.Api.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SapBasisPulse.Api.Services
{
    public interface IConsultantAvailabilityService
    {
        Task<IEnumerable<ConsultantAvailabilitySlotDto>> GetSlotsForConsultantAsync(Guid consultantId);
        Task<IEnumerable<ConsultantAvailabilitySlotDto>> GetSlotsForDateRangeAsync(Guid consultantId, DateTime startDate, DateTime endDate);
        Task<ConsultantAvailabilitySlotDto?> GetSlotByIdAsync(Guid id);
        Task<ConsultantAvailabilitySlotsResponse> CreateSlotAsync(CreateConsultantAvailabilitySlotDto dto);
        Task<bool> DeleteSlotAsync(Guid id);
        Task<IEnumerable<BookedSlotDto>> GetBookedSlotsForConsultantAsync(Guid consultantId);
    }
}
