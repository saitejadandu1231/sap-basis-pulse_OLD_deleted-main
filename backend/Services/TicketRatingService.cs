using Microsoft.EntityFrameworkCore;
using SapBasisPulse.Api.Data;
using SapBasisPulse.Api.DTOs;
using SapBasisPulse.Api.Entities;

namespace SapBasisPulse.Api.Services
{
    public class TicketRatingService : ITicketRatingService
    {
        private readonly AppDbContext _context;
        public TicketRatingService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<TicketRatingDto>> GetRatingsForOrderAsync(Guid orderId)
        {
            return await _context.TicketRatings
                .Where(r => r.OrderId == orderId)
                .Select(r => new TicketRatingDto
                {
                    Id = r.Id,
                    OrderId = r.OrderId,
                    RatedByUserId = r.RatedByUserId,
                    RatedUserId = r.RatedUserId,
                    RatingForRole = r.RatingForRole,
                    CommunicationProfessionalism = r.CommunicationProfessionalism,
                    ResolutionQuality = r.ResolutionQuality,
                    ResponseTime = r.ResponseTime,
                    Comments = r.Comments
                })
                .ToListAsync();
        }

        public async Task<TicketRatingDto?> GetByIdAsync(Guid id)
        {
            var r = await _context.TicketRatings.FindAsync(id);
            if (r == null) return null;
            return new TicketRatingDto
            {
                Id = r.Id,
                OrderId = r.OrderId,
                RatedByUserId = r.RatedByUserId,
                RatedUserId = r.RatedUserId,
                RatingForRole = r.RatingForRole,
                CommunicationProfessionalism = r.CommunicationProfessionalism,
                ResolutionQuality = r.ResolutionQuality,
                ResponseTime = r.ResponseTime,
                Comments = r.Comments
            };
        }

        public async Task<TicketRatingDto> CreateAsync(CreateTicketRatingDto dto)
        {
            var rating = new TicketRating
            {
                Id = Guid.NewGuid(),
                OrderId = dto.OrderId,
                RatedByUserId = dto.RatedByUserId,
                RatedUserId = dto.RatedUserId,
                RatingForRole = dto.RatingForRole,
                CommunicationProfessionalism = dto.CommunicationProfessionalism,
                ResolutionQuality = dto.ResolutionQuality,
                ResponseTime = dto.ResponseTime,
                Comments = dto.Comments
            };
            _context.TicketRatings.Add(rating);
            await _context.SaveChangesAsync();
            return new TicketRatingDto
            {
                Id = rating.Id,
                OrderId = rating.OrderId,
                RatedByUserId = rating.RatedByUserId,
                RatedUserId = rating.RatedUserId,
                RatingForRole = rating.RatingForRole,
                CommunicationProfessionalism = rating.CommunicationProfessionalism,
                ResolutionQuality = rating.ResolutionQuality,
                ResponseTime = rating.ResponseTime,
                Comments = rating.Comments
            };
        }
    }
}
