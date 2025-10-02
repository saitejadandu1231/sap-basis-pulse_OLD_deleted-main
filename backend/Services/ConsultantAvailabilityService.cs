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
                           s.SlotStartTime <= endDateUtc &&
                           s.SlotStartTime > DateTime.UtcNow && // Only future slots
                           s.BookedByCustomerChoiceId == null) // Only available slots
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
            // Validate that the consultant exists and has an hourly rate set
            var consultant = await _context.Users.FindAsync(dto.ConsultantId);
            if (consultant == null || consultant.Role != UserRole.Consultant)
                throw new ArgumentException("Invalid consultant selected");

            if (!consultant.HourlyRate.HasValue)
                throw new ArgumentException("Consultant must set an hourly rate before creating availability slots");

            // Validate that the consultant has at least one skill
            var consultantSkills = await _context.ConsultantSkills
                .Where(cs => cs.ConsultantId == dto.ConsultantId)
                .ToListAsync();
            
            if (!consultantSkills.Any())
                throw new ArgumentException("Consultant must select at least one skill before creating availability slots");

            // Validate input times first
            if (dto.SlotEndTime <= dto.SlotStartTime)
            {
                throw new ArgumentException($"End time ({dto.SlotEndTime:yyyy-MM-dd HH:mm:ss}) must be after start time ({dto.SlotStartTime:yyyy-MM-dd HH:mm:ss}).");
            }

            // Ensure the dates are in UTC format for PostgreSQL
            var startTimeUtc = dto.SlotStartTime.Kind != DateTimeKind.Utc 
                ? DateTime.SpecifyKind(dto.SlotStartTime, DateTimeKind.Utc)
                : dto.SlotStartTime;
                
            var endTimeUtc = dto.SlotEndTime.Kind != DateTimeKind.Utc
                ? DateTime.SpecifyKind(dto.SlotEndTime, DateTimeKind.Utc)
                : dto.SlotEndTime;

            var createdSlots = new List<ConsultantAvailabilitySlot>();
            var currentTime = startTimeUtc;
            
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
            
            // Final validation - this should never happen now with proper input validation
            if (!createdSlots.Any())
            {
                throw new InvalidOperationException($"No slots were created for time range {startTimeUtc:yyyy-MM-dd HH:mm:ss} to {endTimeUtc:yyyy-MM-dd HH:mm:ss}. This should not happen.");
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

        public async Task<IEnumerable<BookedSlotDto>> GetBookedSlotsForConsultantAsync(Guid consultantId)
        {
            return await _context.Orders
                .Where(o => o.ConsultantId == consultantId && o.TimeSlotId != null)
                .Include(o => o.TimeSlot)
                .Include(o => o.CreatedByUser)
                .Include(o => o.SupportType)
                .Include(o => o.SupportCategory)
                .Include(o => o.Status)
                .Select(o => new BookedSlotDto
                {
                    Id = o.TimeSlot.Id,
                    ConsultantId = consultantId,
                    SlotStartTime = o.TimeSlot.SlotStartTime,
                    SlotEndTime = o.TimeSlot.SlotEndTime,
                    OrderNumber = o.OrderNumber,
                    CustomerName = $"{o.CreatedByUser.FirstName} {o.CreatedByUser.LastName}".Trim(),
                    CustomerEmail = o.CreatedByUser.Email,
                    SupportTypeName = o.SupportType.Name,
                    SupportCategoryName = o.SupportCategory.Name,
                    Priority = o.Priority,
                    Description = o.Description,
                    Status = o.Status.StatusName,
                    CreatedAt = o.CreatedAt
                })
                .OrderBy(b => b.SlotStartTime)
                .ToListAsync();
        }
    }
}
