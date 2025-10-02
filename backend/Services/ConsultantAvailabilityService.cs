using Microsoft.EntityFrameworkCore;
using SapBasisPulse.Api.Data;
using SapBasisPulse.Api.DTOs;
using SapBasisPulse.Api.Entities;
using Microsoft.Extensions.Logging;

namespace SapBasisPulse.Api.Services
{
    public class ConsultantAvailabilityService : IConsultantAvailabilityService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<ConsultantAvailabilityService> _logger;

        public ConsultantAvailabilityService(AppDbContext context, ILogger<ConsultantAvailabilityService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<IEnumerable<ConsultantAvailabilitySlotDto>> GetSlotsForConsultantAsync(Guid consultantId)
        {
            try
            {
                _logger.LogInformation("Retrieving availability slots for consultant {ConsultantId}", consultantId);

                var slots = await _context.ConsultantAvailabilitySlots
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

                _logger.LogInformation("Retrieved {Count} availability slots for consultant {ConsultantId}", slots.Count, consultantId);
                return slots;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving availability slots for consultant {ConsultantId}", consultantId);
                throw new ApplicationException("Failed to retrieve availability slots. Please try again later.");
            }
        }
        
        public async Task<IEnumerable<ConsultantAvailabilitySlotDto>> GetSlotsForDateRangeAsync(Guid consultantId, DateTime startDate, DateTime endDate)
        {
            try
            {
                _logger.LogInformation("Retrieving slots for date range for consultant {ConsultantId} between {StartDate} and {EndDate}",
                    consultantId, startDate, endDate);

                // Ensure dates are in UTC
                var startDateUtc = startDate.Kind != DateTimeKind.Utc 
                    ? DateTime.SpecifyKind(startDate, DateTimeKind.Utc) 
                    : startDate;
                    
                var endDateUtc = endDate.Kind != DateTimeKind.Utc 
                    ? DateTime.SpecifyKind(endDate, DateTimeKind.Utc) 
                    : endDate;
                    
                // Set the end date to the end of the day
                endDateUtc = endDateUtc.Date.AddDays(1).AddSeconds(-1);
                
                var slots = await _context.ConsultantAvailabilitySlots
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

                _logger.LogInformation("Retrieved {Count} slots for date range for consultant {ConsultantId}", slots.Count, consultantId);
                return slots;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving slots for date range for consultant {ConsultantId} between {StartDate} and {EndDate}",
                    consultantId, startDate, endDate);
                throw new ApplicationException("Failed to retrieve slots for the specified date range. Please try again later.");
            }
        }

        public async Task<ConsultantAvailabilitySlotDto?> GetSlotByIdAsync(Guid id)
        {
            try
            {
                _logger.LogInformation("Retrieving slot by ID {SlotId}", id);

                var slot = await _context.ConsultantAvailabilitySlots.FindAsync(id);
                if (slot == null)
                {
                    _logger.LogWarning("Slot with ID {SlotId} not found", id);
                    return null;
                }

                var dto = new ConsultantAvailabilitySlotDto
                {
                    Id = slot.Id,
                    ConsultantId = slot.ConsultantId,
                    SlotStartTime = slot.SlotStartTime,
                    SlotEndTime = slot.SlotEndTime,
                    IsBooked = slot.BookedByCustomerChoiceId != null
                };

                _logger.LogInformation("Retrieved slot {SlotId} for consultant {ConsultantId}", id, slot.ConsultantId);
                return dto;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving slot by ID {SlotId}", id);
                throw new ApplicationException("Failed to retrieve the slot. Please try again later.");
            }
        }

        public async Task<ConsultantAvailabilitySlotsResponse> CreateSlotAsync(CreateConsultantAvailabilitySlotDto dto)
        {
            try
            {
                _logger.LogInformation("Creating availability slot for consultant {ConsultantId} from {StartTime} to {EndTime}",
                    dto.ConsultantId, dto.SlotStartTime, dto.SlotEndTime);

                // Validate that the consultant exists and has an hourly rate set
                var consultant = await _context.Users.FindAsync(dto.ConsultantId);
                if (consultant == null || consultant.Role != UserRole.Consultant)
                {
                    _logger.LogWarning("Invalid consultant {ConsultantId} selected for slot creation", dto.ConsultantId);
                    throw new ArgumentException("Invalid consultant selected");
                }

                if (!consultant.HourlyRate.HasValue)
                {
                    _logger.LogWarning("Consultant {ConsultantId} must set hourly rate before creating slots", dto.ConsultantId);
                    throw new ArgumentException("Consultant must set an hourly rate before creating availability slots");
                }

                // Validate that the consultant has at least one skill
                var consultantSkills = await _context.ConsultantSkills
                    .Where(cs => cs.ConsultantId == dto.ConsultantId)
                    .ToListAsync();
                
                if (!consultantSkills.Any())
                {
                    _logger.LogWarning("Consultant {ConsultantId} has no skills configured", dto.ConsultantId);
                    throw new ArgumentException("Consultant must select at least one skill before creating availability slots");
                }

                // Validate input times first
                if (dto.SlotEndTime <= dto.SlotStartTime)
                {
                    _logger.LogWarning("Invalid time range for consultant {ConsultantId}: end time {EndTime} is not after start time {StartTime}",
                        dto.ConsultantId, dto.SlotEndTime, dto.SlotStartTime);
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
                
                // Calculate the total duration
                var totalDuration = endTimeUtc - startTimeUtc;
                var totalHours = (int)Math.Floor(totalDuration.TotalHours);
                
                // Create 1-hour slots for the entire duration
                for (int i = 0; i < totalHours; i++)
                {
                    var slotStart = startTimeUtc.AddHours(i);
                    var slotEnd = slotStart.AddHours(1);
                    
                    var slot = new ConsultantAvailabilitySlot
                    {
                        Id = Guid.NewGuid(),
                        ConsultantId = dto.ConsultantId,
                        SlotStartTime = slotStart,
                        SlotEndTime = slotEnd
                    };
                    _context.ConsultantAvailabilitySlots.Add(slot);
                    createdSlots.Add(slot);
                }
                
                // Handle any remaining minutes (though validation ensures minimum 1 hour, 
                // this handles cases where duration isn't exactly divisible by 1 hour)
                var remainingMinutes = totalDuration.TotalMinutes % 60;
                if (remainingMinutes > 0 && totalHours > 0)
                {
                    // Create an additional slot for the remaining time
                    var lastSlotStart = startTimeUtc.AddHours(totalHours);
                    var lastSlotEnd = endTimeUtc;
                    
                    var remainingSlot = new ConsultantAvailabilitySlot
                    {
                        Id = Guid.NewGuid(),
                        ConsultantId = dto.ConsultantId,
                        SlotStartTime = lastSlotStart,
                        SlotEndTime = lastSlotEnd
                    };
                    _context.ConsultantAvailabilitySlots.Add(remainingSlot);
                    createdSlots.Add(remainingSlot);
                }
                
                // Final validation - this should never happen now with proper input validation
                if (!createdSlots.Any())
                {
                    _logger.LogError("No slots were created for consultant {ConsultantId} - this should not happen", dto.ConsultantId);
                    throw new InvalidOperationException($"No slots were created for time range {startTimeUtc:yyyy-MM-dd HH:mm:ss} to {endTimeUtc:yyyy-MM-dd HH:mm:ss}. This should not happen.");
                }
                
                await _context.SaveChangesAsync();
                
                var response = new ConsultantAvailabilitySlotsResponse
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

                _logger.LogInformation("Successfully created {Count} availability slots for consultant {ConsultantId}",
                    createdSlots.Count, dto.ConsultantId);
                return response;
            }
            catch (ArgumentException)
            {
                // Re-throw validation errors as-is
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating availability slot for consultant {ConsultantId}", dto.ConsultantId);
                throw new ApplicationException("Failed to create availability slot. Please try again later.");
            }
        }

        public async Task<bool> DeleteSlotAsync(Guid id)
        {
            try
            {
                _logger.LogInformation("Attempting to delete slot {SlotId}", id);

                var slot = await _context.ConsultantAvailabilitySlots.FindAsync(id);
                if (slot == null)
                {
                    _logger.LogWarning("Slot {SlotId} not found for deletion", id);
                    return false;
                }

                // Check if slot is already booked
                if (slot.BookedByCustomerChoiceId != null)
                {
                    _logger.LogWarning("Cannot delete slot {SlotId} - it is already booked", id);
                    throw new InvalidOperationException("Cannot delete a slot that has already been booked");
                }

                _context.ConsultantAvailabilitySlots.Remove(slot);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Successfully deleted slot {SlotId}", id);
                return true;
            }
            catch (InvalidOperationException)
            {
                // Re-throw business rule violations
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting slot {SlotId}", id);
                throw new ApplicationException("Failed to delete the slot. Please try again later.");
            }
        }

        public async Task<IEnumerable<BookedSlotDto>> GetBookedSlotsForConsultantAsync(Guid consultantId)
        {
            try
            {
                _logger.LogInformation("Retrieving booked slots for consultant {ConsultantId}", consultantId);

                var bookedSlots = await _context.Orders
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

                _logger.LogInformation("Retrieved {Count} booked slots for consultant {ConsultantId}", bookedSlots.Count, consultantId);
                return bookedSlots;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving booked slots for consultant {ConsultantId}", consultantId);
                throw new ApplicationException("Failed to retrieve booked slots. Please try again later.");
            }
        }

        public async Task<int> DeleteExpiredSlotsAsync()
        {
            try
            {
                _logger.LogInformation("Starting cleanup of expired availability slots");

                var expiredSlots = await _context.ConsultantAvailabilitySlots
                    .Where(s => s.SlotEndTime < DateTime.UtcNow)
                    .ToListAsync();
                
                if (expiredSlots.Any())
                {
                    _context.ConsultantAvailabilitySlots.RemoveRange(expiredSlots);
                    await _context.SaveChangesAsync();
                    _logger.LogInformation("Deleted {Count} expired availability slots", expiredSlots.Count);
                }
                else
                {
                    _logger.LogInformation("No expired slots found to delete");
                }
                
                return expiredSlots.Count;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting expired slots");
                throw new ApplicationException("Failed to clean up expired slots. Please try again later.");
            }
        }
    }
}
