using Microsoft.EntityFrameworkCore;
using SapBasisPulse.Api.Data;
using SapBasisPulse.Api.DTOs;
using SapBasisPulse.Api.Entities;

namespace SapBasisPulse.Api.Services
{
    public class ConsultantAvailabilityService : IConsultantAvailabilityService
    {
        private readonly AppDbContext _context;
        public ConsultantAvailabilityService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<ConsultantAvailabilitySlotDto>> GetSlotsForConsultantAsync(Guid consultantId)
        {
            return await _context.ConsultantAvailabilitySlots
                .Where(s => s.ConsultantId == consultantId)
                .Select(s => new ConsultantAvailabilitySlotDto
                {
                    Id = s.Id,
                    ConsultantId = s.ConsultantId,
                    SlotStartTime = s.SlotStartTime,
                    SlotEndTime = s.SlotEndTime,
                    IsBooked = s.BookedByCustomerChoiceId != null
                })
                .ToListAsync();
        }

        public async Task<ConsultantAvailabilitySlotDto?> GetSlotByIdAsync(Guid id)
        {
            var s = await _context.ConsultantAvailabilitySlots.FindAsync(id);
            if (s == null) return null;
            return new ConsultantAvailabilitySlotDto
            {
                Id = s.Id,
                ConsultantId = s.ConsultantId,
                SlotStartTime = s.SlotStartTime,
                SlotEndTime = s.SlotEndTime,
                IsBooked = s.BookedByCustomerChoiceId != null
            };
        }

        public async Task<ConsultantAvailabilitySlotDto> CreateSlotAsync(CreateConsultantAvailabilitySlotDto dto)
        {
            var slot = new ConsultantAvailabilitySlot
            {
                Id = Guid.NewGuid(),
                ConsultantId = dto.ConsultantId,
                SlotStartTime = dto.SlotStartTime,
                SlotEndTime = dto.SlotEndTime
            };
            _context.ConsultantAvailabilitySlots.Add(slot);
            await _context.SaveChangesAsync();
            return new ConsultantAvailabilitySlotDto
            {
                Id = slot.Id,
                ConsultantId = slot.ConsultantId,
                SlotStartTime = slot.SlotStartTime,
                SlotEndTime = slot.SlotEndTime,
                IsBooked = false
            };
        }

        public async Task<bool> DeleteSlotAsync(Guid id)
        {
            var slot = await _context.ConsultantAvailabilitySlots.FindAsync(id);
            if (slot == null) return false;
            _context.ConsultantAvailabilitySlots.Remove(slot);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
