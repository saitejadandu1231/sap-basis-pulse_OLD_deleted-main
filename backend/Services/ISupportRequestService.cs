using SapBasisPulse.Api.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SapBasisPulse.Api.Services
{
    public interface ISupportRequestService
    {
        Task<SupportRequestDto> CreateAsync(CreateSupportRequestDto dto, Guid createdByUserId);
        Task<IEnumerable<SupportRequestDto>> GetRecentForUserAsync(Guid userId);
        Task<IEnumerable<SupportRequestDto>> GetRecentForConsultantAsync(Guid consultantId);
        Task<IEnumerable<SupportRequestDto>> GetAllAsync();
        Task<bool> UpdateStatusAsync(Guid orderId, string status);
        // Add admin/analytics methods as needed
    }
}
