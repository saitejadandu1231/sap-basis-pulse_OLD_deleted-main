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
                CreatedAt = DateTime.UtcNow,
                Description = dto.Description, // Set required Description from DTO
                Priority = dto.Priority, // Set Priority from DTO
                Status = "Open", // Default status
                ConsultantId = dto.ConsultantId, // Set ConsultantId from DTO
                SupportTypeId = dto.SupportTypeId, // Copy support taxonomy info
                SupportCategoryId = dto.SupportCategoryId,
                SupportSubOptionId = dto.SupportSubOptionId
            };
            _context.CustomerChoices.Add(customerChoice);
            // Create support request (Order)
            // Generate an order number in the format SR-YYYY-MMDD-XXXX where XXXX is a random number
            string orderNumber = $"SR-{DateTime.UtcNow:yyyy-MMdd}-{new Random().Next(1000, 9999)}";
            
            // Get the support type name
            var supportType = await _context.SupportTypes.FindAsync(dto.SupportTypeId);
            string supportTypeName = supportType?.Name ?? "Unknown";
            
            // Ensure SrIdentifier is not null - use orderNumber as a fallback if it's not provided
            string srIdentifier = !string.IsNullOrWhiteSpace(dto.SrIdentifier) 
                ? dto.SrIdentifier 
                : $"AUTO-{orderNumber}";
                
            var order = new Order
            {
                Id = Guid.NewGuid(),
                OrderNumber = orderNumber, // Set the OrderNumber field
                CustomerChoiceId = customerChoice.Id, // Link to the CustomerChoice we just created
                SupportTypeId = dto.SupportTypeId,
                SupportTypeName = supportTypeName, // Set the SupportTypeName field
                SupportCategoryId = dto.SupportCategoryId,
                SupportSubOptionId = dto.SupportSubOptionId,
                Description = dto.Description,
                SrIdentifier = srIdentifier, // Use the srIdentifier variable which is guaranteed not to be null
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
                .Include(o => o.SupportType)
                .Include(o => o.SupportCategory)
                .Include(o => o.SupportSubOption)
                .Include(o => o.Consultant)
                .Include(o => o.TimeSlot)
                .Include(o => o.CreatedByUser)
                .Where(o => o.CreatedByUserId == userId)
                .OrderByDescending(o => o.CreatedAt)
                .Take(10)
                .Select(o => new SupportRequestDto
                {
                    Id = o.Id,
                    SupportTypeId = o.SupportTypeId,
                    SupportTypeName = o.SupportType != null ? o.SupportType.Name : "Unknown",
                    SupportCategoryId = o.SupportCategoryId,
                    SupportCategoryName = o.SupportCategory != null ? o.SupportCategory.Name : "Unknown",
                    SupportSubOptionId = o.SupportSubOptionId,
                    SupportSubOptionName = o.SupportSubOption != null ? o.SupportSubOption.Name : null,
                    Description = o.Description,
                    SrIdentifier = o.SrIdentifier,
                    Priority = o.Priority,
                    ConsultantId = o.Consultant != null ? o.Consultant.Id : Guid.Empty,
                    ConsultantName = o.Consultant != null ? o.Consultant.FirstName + " " + o.Consultant.LastName : "Unknown",
                    TimeSlotId = o.TimeSlotId ?? Guid.Empty,
                    SlotStartTime = o.TimeSlot != null ? o.TimeSlot.SlotStartTime : DateTime.MinValue,
                    SlotEndTime = o.TimeSlot != null ? o.TimeSlot.SlotEndTime : DateTime.MinValue,
                    CreatedByUserId = o.CreatedByUserId,
                    CreatedByName = o.CreatedByUser != null ? o.CreatedByUser.FirstName + " " + o.CreatedByUser.LastName : "Unknown",
                    CreatedAt = o.CreatedAt,
                    Status = o.Status
                })
                .ToListAsync();
        }

        public async Task<IEnumerable<SupportRequestDto>> GetRecentForConsultantAsync(Guid consultantId)
        {
            return await _context.Orders
                .Include(o => o.SupportType)
                .Include(o => o.SupportCategory)
                .Include(o => o.SupportSubOption)
                .Include(o => o.Consultant)
                .Include(o => o.TimeSlot)
                .Include(o => o.CreatedByUser)
                .Where(o => o.ConsultantId == consultantId)
                .OrderByDescending(o => o.CreatedAt)
                .Take(10)
                .Select(o => new SupportRequestDto
                {
                    Id = o.Id,
                    SupportTypeId = o.SupportTypeId,
                    SupportTypeName = o.SupportType != null ? o.SupportType.Name : "Unknown",
                    SupportCategoryId = o.SupportCategoryId,
                    SupportCategoryName = o.SupportCategory != null ? o.SupportCategory.Name : "Unknown",
                    SupportSubOptionId = o.SupportSubOptionId,
                    SupportSubOptionName = o.SupportSubOption != null ? o.SupportSubOption.Name : null,
                    Description = o.Description,
                    SrIdentifier = o.SrIdentifier,
                    Priority = o.Priority,
                    ConsultantId = o.Consultant != null ? o.Consultant.Id : Guid.Empty,
                    ConsultantName = o.Consultant != null ? o.Consultant.FirstName + " " + o.Consultant.LastName : "Unknown",
                    TimeSlotId = o.TimeSlotId ?? Guid.Empty,
                    SlotStartTime = o.TimeSlot != null ? o.TimeSlot.SlotStartTime : DateTime.MinValue,
                    SlotEndTime = o.TimeSlot != null ? o.TimeSlot.SlotEndTime : DateTime.MinValue,
                    CreatedByUserId = o.CreatedByUserId,
                    CreatedByName = o.CreatedByUser != null ? o.CreatedByUser.FirstName + " " + o.CreatedByUser.LastName : "Unknown",
                    CreatedAt = o.CreatedAt,
                    Status = o.Status
                })
                .ToListAsync();
        }

        public async Task<IEnumerable<SupportRequestDto>> GetAllAsync()
        {
            return await _context.Orders
                .Include(o => o.SupportType)
                .Include(o => o.SupportCategory)
                .Include(o => o.SupportSubOption)
                .Include(o => o.Consultant)
                .Include(o => o.TimeSlot)
                .Include(o => o.CreatedByUser)
                .OrderByDescending(o => o.CreatedAt)
                .Select(o => new SupportRequestDto
                {
                    Id = o.Id,
                    SupportTypeId = o.SupportTypeId,
                    SupportTypeName = o.SupportType != null ? o.SupportType.Name : "Unknown",
                    SupportCategoryId = o.SupportCategoryId,
                    SupportCategoryName = o.SupportCategory != null ? o.SupportCategory.Name : "Unknown",
                    SupportSubOptionId = o.SupportSubOptionId,
                    SupportSubOptionName = o.SupportSubOption != null ? o.SupportSubOption.Name : null,
                    Description = o.Description,
                    SrIdentifier = o.SrIdentifier,
                    Priority = o.Priority,
                    ConsultantId = o.Consultant != null ? o.Consultant.Id : Guid.Empty,
                    ConsultantName = o.Consultant != null ? o.Consultant.FirstName + " " + o.Consultant.LastName : "Unknown",
                    TimeSlotId = o.TimeSlotId ?? Guid.Empty,
                    SlotStartTime = o.TimeSlot != null ? o.TimeSlot.SlotStartTime : DateTime.MinValue,
                    SlotEndTime = o.TimeSlot != null ? o.TimeSlot.SlotEndTime : DateTime.MinValue,
                    CreatedByUserId = o.CreatedByUserId,
                    CreatedByName = o.CreatedByUser != null ? o.CreatedByUser.FirstName + " " + o.CreatedByUser.LastName : "Unknown",
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
            if (o.ConsultantId.HasValue)
                await _context.Entry(o).Reference(x => x.Consultant).LoadAsync();
            if (o.TimeSlotId.HasValue)
                await _context.Entry(o).Reference(x => x.TimeSlot).LoadAsync();
            await _context.Entry(o).Reference(x => x.CreatedByUser).LoadAsync();
            
            return new SupportRequestDto
            {
                Id = o.Id,
                SupportTypeId = o.SupportTypeId,
                SupportTypeName = o.SupportType?.Name ?? "Unknown",
                SupportCategoryId = o.SupportCategoryId,
                SupportCategoryName = o.SupportCategory?.Name ?? "Unknown",
                SupportSubOptionId = o.SupportSubOptionId,
                SupportSubOptionName = o.SupportSubOption?.Name,
                Description = o.Description,
                SrIdentifier = o.SrIdentifier,
                Priority = o.Priority,
                ConsultantId = o.Consultant?.Id ?? Guid.Empty,
                ConsultantName = o.Consultant != null ? o.Consultant.FirstName + " " + o.Consultant.LastName : "Unknown",
                TimeSlotId = o.TimeSlotId ?? Guid.Empty,
                SlotStartTime = o.TimeSlot?.SlotStartTime ?? DateTime.MinValue,
                SlotEndTime = o.TimeSlot?.SlotEndTime ?? DateTime.MinValue,
                CreatedByUserId = o.CreatedByUserId,
                CreatedByName = o.CreatedByUser != null ? o.CreatedByUser.FirstName + " " + o.CreatedByUser.LastName : "Unknown",
                CreatedAt = o.CreatedAt,
                Status = o.Status
            };
        }
    }
}
