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
        
        public async Task<IEnumerable<ConsultantAvailabilitySlotDto>> GetSlotsForDateRangeAsync(Guid consultantId, DateTime startDate, DateTime endDate)
        {
            // Ensure dates are in UTC
            var startDateUtc = startDate.Kind != DateTimeKind.Utc 
                ? DateTime.SpecifyKind(startDate, DateTimeKind.Utc) 
                : startDate;
                
            var endDateUtc = endDate.Kind != DateTimeKind.Utc 
                ? DateTime.SpecifyKind(endDate, DateTimeKind.Utc) 
                : endDate;
                
            // Set the end date to the end of the day
            endDateUtc = endDateUtc.Date.AddDays(1).AddSeconds(-1);
            
            return await _context.ConsultantAvailabilitySlots
                .Where(s => s.ConsultantId == consultantId && 
                           s.SlotStartTime >= startDateUtc && 
                           s.SlotStartTime <= endDateUtc)
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

        public async Task<ConsultantAvailabilitySlotsResponse> CreateSlotAsync(CreateConsultantAvailabilitySlotDto dto)
        {
            // Ensure the dates are in UTC format for PostgreSQL
            var startTimeUtc = dto.SlotStartTime.Kind != DateTimeKind.Utc 
                ? DateTime.SpecifyKind(dto.SlotStartTime, DateTimeKind.Utc)
                : dto.SlotStartTime;
                
            var endTimeUtc = dto.SlotEndTime.Kind != DateTimeKind.Utc
                ? DateTime.SpecifyKind(dto.SlotEndTime, DateTimeKind.Utc)
                : dto.SlotEndTime;

            // Break down into hourly slots
            var currentTime = startTimeUtc;
            var createdSlots = new List<ConsultantAvailabilitySlot>();
            
            // Generate hourly slots within the time block
            while (currentTime.AddHours(1) <= endTimeUtc)
            {
                var slot = new ConsultantAvailabilitySlot
                {
                    Id = Guid.NewGuid(),
                    ConsultantId = dto.ConsultantId,
                    SlotStartTime = currentTime,
                    SlotEndTime = currentTime.AddHours(1)
                };
                _context.ConsultantAvailabilitySlots.Add(slot);
                createdSlots.Add(slot);
                
                // Move to the next hour
                currentTime = currentTime.AddHours(1);
            }
            
            // If there's a remaining partial slot (less than an hour), create it too
            if (currentTime < endTimeUtc)
            {
                var slot = new ConsultantAvailabilitySlot
                {
                    Id = Guid.NewGuid(),
                    ConsultantId = dto.ConsultantId,
                    SlotStartTime = currentTime,
                    SlotEndTime = endTimeUtc
                };
                _context.ConsultantAvailabilitySlots.Add(slot);
                createdSlots.Add(slot);
            }
            
            // If no slots were created (e.g., if end time is before start time)
            if (!createdSlots.Any())
            {
                throw new ArgumentException("Invalid time range. End time must be after start time.");
            }
            
            await _context.SaveChangesAsync();
            
            // Return all created slots as the response
            return new ConsultantAvailabilitySlotsResponse
            {
                Slots = createdSlots.Select(s => new ConsultantAvailabilitySlotDto
                {
                    Id = s.Id,
                    ConsultantId = s.ConsultantId,
                    SlotStartTime = s.SlotStartTime,
                    SlotEndTime = s.SlotEndTime,
                    IsBooked = false
                }).ToList()
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
