using Microsoft.EntityFrameworkCore;
using SapBasisPulse.Api.Data;
using SapBasisPulse.Api.DTOs;
using SapBasisPulse.Api.Entities;

namespace SapBasisPulse.Api.Services
{
    public class SupportRequestService : ISupportRequestService
    {
        private readonly AppDbContext _context;
        public SupportRequestService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<SupportRequestDto> CreateAsync(CreateSupportRequestDto dto, Guid createdByUserId)
        {
            // Validate required fields
            if (string.IsNullOrWhiteSpace(dto.Description) || string.IsNullOrWhiteSpace(dto.Priority))
                throw new ArgumentException("Description and Priority are required");
            // SR Identifier logic: required for certain suboptions (handled in UI, double-check here)
            if (dto.SupportSubOptionId.HasValue)
            {
                var subOption = await _context.SupportSubOptions.FindAsync(dto.SupportSubOptionId.Value);
                if (subOption != null && subOption.Name.Contains("SR", StringComparison.OrdinalIgnoreCase) && string.IsNullOrWhiteSpace(dto.SrIdentifier))
                    throw new ArgumentException("SR Identifier is required for this request type");
            }
            var slot = await _context.ConsultantAvailabilitySlots.FindAsync(dto.TimeSlotId);
            if (slot == null || slot.BookedByCustomerChoiceId != null)
                throw new ArgumentException("Selected time slot is not available");
            // Mark slot as booked
            slot.BookedByCustomerChoiceId = Guid.NewGuid(); // Create a new CustomerChoice (simplified)
            var customerChoice = new CustomerChoice
            {
                Id = slot.BookedByCustomerChoiceId.Value,
                UserId = createdByUserId,
                SlotId = slot.Id,
                CreatedAt = DateTime.UtcNow
            };
            _context.CustomerChoices.Add(customerChoice);
            // Create support request (Order)
            var order = new Order
            {
                Id = Guid.NewGuid(),
                SupportTypeId = dto.SupportTypeId,
                SupportCategoryId = dto.SupportCategoryId,
                SupportSubOptionId = dto.SupportSubOptionId,
                Description = dto.Description,
                SrIdentifier = dto.SrIdentifier,
                Priority = dto.Priority,
                ConsultantId = dto.ConsultantId,
                TimeSlotId = dto.TimeSlotId,
                CreatedByUserId = createdByUserId,
                CreatedAt = DateTime.UtcNow,
                Status = "Open"
            };
            _context.Orders.Add(order);
            await _context.SaveChangesAsync();
            return await ToDto(order);
        }

        public async Task<IEnumerable<SupportRequestDto>> GetRecentForUserAsync(Guid userId)
        {
            return await _context.Orders
                .Where(o => o.CreatedByUserId == userId)
                .OrderByDescending(o => o.CreatedAt)
                .Take(10)
                .Select(o => new SupportRequestDto
                {
                    Id = o.Id,
                    SupportTypeId = o.SupportTypeId,
                    SupportTypeName = o.SupportType.Name,
                    SupportCategoryId = o.SupportCategoryId,
                    SupportCategoryName = o.SupportCategory.Name,
                    SupportSubOptionId = o.SupportSubOptionId,
                    SupportSubOptionName = o.SupportSubOption != null ? o.SupportSubOption.Name : null,
                    Description = o.Description,
                    SrIdentifier = o.SrIdentifier,
                    Priority = o.Priority,
                    ConsultantId = o.Consultant.Id,
                    ConsultantName = o.Consultant.FirstName + " " + o.Consultant.LastName,
                    TimeSlotId = o.TimeSlotId ?? Guid.Empty,
                    SlotStartTime = o.TimeSlot.SlotStartTime,
                    SlotEndTime = o.TimeSlot.SlotEndTime,
                    CreatedByUserId = o.CreatedByUserId,
                    CreatedByName = o.CreatedByUser.FirstName + " " + o.CreatedByUser.LastName,
                    CreatedAt = o.CreatedAt,
                    Status = o.Status
                })
                .ToListAsync();
        }

        public async Task<IEnumerable<SupportRequestDto>> GetRecentForConsultantAsync(Guid consultantId)
        {
            return await _context.Orders
                .Where(o => o.ConsultantId == consultantId)
                .OrderByDescending(o => o.CreatedAt)
                .Take(10)
                .Select(o => new SupportRequestDto
                {
                    Id = o.Id,
                    SupportTypeId = o.SupportTypeId,
                    SupportTypeName = o.SupportType.Name,
                    SupportCategoryId = o.SupportCategoryId,
                    SupportCategoryName = o.SupportCategory.Name,
                    SupportSubOptionId = o.SupportSubOptionId,
                    SupportSubOptionName = o.SupportSubOption != null ? o.SupportSubOption.Name : null,
                    Description = o.Description,
                    SrIdentifier = o.SrIdentifier,
                    Priority = o.Priority,
                    ConsultantId = o.Consultant.Id,
                    ConsultantName = o.Consultant.FirstName + " " + o.Consultant.LastName,
                    TimeSlotId = o.TimeSlotId ?? Guid.Empty,
                    SlotStartTime = o.TimeSlot.SlotStartTime,
                    SlotEndTime = o.TimeSlot.SlotEndTime,
                    CreatedByUserId = o.CreatedByUserId,
                    CreatedByName = o.CreatedByUser.FirstName + " " + o.CreatedByUser.LastName,
                    CreatedAt = o.CreatedAt,
                    Status = o.Status
                })
                .ToListAsync();
        }

        public async Task<IEnumerable<SupportRequestDto>> GetAllAsync()
        {
            return await _context.Orders
                .OrderByDescending(o => o.CreatedAt)
                .Select(o => new SupportRequestDto
                {
                    Id = o.Id,
                    SupportTypeId = o.SupportTypeId,
                    SupportTypeName = o.SupportType.Name,
                    SupportCategoryId = o.SupportCategoryId,
                    SupportCategoryName = o.SupportCategory.Name,
                    SupportSubOptionId = o.SupportSubOptionId,
                    SupportSubOptionName = o.SupportSubOption != null ? o.SupportSubOption.Name : null,
                    Description = o.Description,
                    SrIdentifier = o.SrIdentifier,
                    Priority = o.Priority,
                    ConsultantId = o.Consultant.Id,
                    ConsultantName = o.Consultant.FirstName + " " + o.Consultant.LastName,
                    TimeSlotId = o.TimeSlotId ?? Guid.Empty,
                    SlotStartTime = o.TimeSlot.SlotStartTime,
                    SlotEndTime = o.TimeSlot.SlotEndTime,
                    CreatedByUserId = o.CreatedByUserId,
                    CreatedByName = o.CreatedByUser.FirstName + " " + o.CreatedByUser.LastName,
                    CreatedAt = o.CreatedAt,
                    Status = o.Status
                })
                .ToListAsync();
        }

        private async Task<SupportRequestDto> ToDto(Order o)
        {
            await _context.Entry(o).Reference(x => x.SupportType).LoadAsync();
            await _context.Entry(o).Reference(x => x.SupportCategory).LoadAsync();
            if (o.SupportSubOptionId.HasValue)
                await _context.Entry(o).Reference(x => x.SupportSubOption).LoadAsync();
            await _context.Entry(o).Reference(x => x.Consultant).LoadAsync();
            await _context.Entry(o).Reference(x => x.TimeSlot).LoadAsync();
            await _context.Entry(o).Reference(x => x.CreatedByUser).LoadAsync();
            return new SupportRequestDto
            {
                Id = o.Id,
                SupportTypeId = o.SupportTypeId,
                SupportTypeName = o.SupportType.Name,
                SupportCategoryId = o.SupportCategoryId,
                SupportCategoryName = o.SupportCategory.Name,
                SupportSubOptionId = o.SupportSubOptionId,
                SupportSubOptionName = o.SupportSubOption?.Name,
                Description = o.Description,
                SrIdentifier = o.SrIdentifier,
                Priority = o.Priority,
                ConsultantId = o.Consultant.Id,
                ConsultantName = o.Consultant.FirstName + " " + o.Consultant.LastName,
                TimeSlotId = o.TimeSlotId ?? Guid.Empty,
                SlotStartTime = o.TimeSlot?.SlotStartTime ?? DateTime.MinValue,
                SlotEndTime = o.TimeSlot?.SlotEndTime ?? DateTime.MinValue,
                CreatedByUserId = o.CreatedByUserId,
                CreatedByName = o.CreatedByUser.FirstName + " " + o.CreatedByUser.LastName,
                CreatedAt = o.CreatedAt,
                Status = o.Status
            };
        }
    }
}
