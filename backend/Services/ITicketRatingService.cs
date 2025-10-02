using SapBasisPulse.Api.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SapBasisPulse.Api.Services
{
    public interface ITicketRatingService
    {
        Task<IEnumerable<TicketRatingDto>> GetRatingsForOrderAsync(Guid orderId);
        Task<IEnumerable<TicketRatingDto>> GetRatingsForConsultantAsync(Guid consultantId);
        Task<TicketRatingDto?> GetByIdAsync(Guid id);
        Task<TicketRatingDto> CreateAsync(CreateTicketRatingDto dto);
    }
}