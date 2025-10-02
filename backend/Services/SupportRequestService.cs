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
            
            // Validate time slots
            if (dto.TimeSlotIds == null || dto.TimeSlotIds.Count == 0)
                throw new ArgumentException("At least one time slot must be selected");

            // SR Identifier logic: required for certain suboptions (handled in UI, double-check here)
            if (dto.SupportSubOptionId.HasValue)
            {
                var subOption = await _context.SupportSubOptions.FindAsync(dto.SupportSubOptionId.Value);
                if (subOption != null && subOption.Name.Contains("SR", StringComparison.OrdinalIgnoreCase) && string.IsNullOrWhiteSpace(dto.SrIdentifier))
                    throw new ArgumentException("SR Identifier is required for this request type");
            }

            // Validate and check availability of all selected time slots
            var timeSlots = await _context.ConsultantAvailabilitySlots
                .Where(ts => dto.TimeSlotIds.Contains(ts.Id))
                .ToListAsync();

            if (timeSlots.Count != dto.TimeSlotIds.Count)
                throw new ArgumentException("One or more selected time slots do not exist");

            if (timeSlots.Any(ts => ts.BookedByCustomerChoiceId != null))
                throw new ArgumentException("One or more selected time slots are already booked");

            // Get consultant's hourly rate
            var consultant = await _context.Users.FindAsync(dto.ConsultantId);
            if (consultant == null || consultant.Role != UserRole.Consultant)
                throw new ArgumentException("Invalid consultant selected");

            if (!consultant.HourlyRate.HasValue)
                throw new ArgumentException("Consultant has not set an hourly rate");

            // Calculate total hours and amount
            int totalHours = 0;
            foreach (var slot in timeSlots)
            {
                var duration = slot.SlotEndTime - slot.SlotStartTime;
                totalHours += (int)duration.TotalHours;
            }
            decimal totalAmount = totalHours * consultant.HourlyRate.Value;

            // Mark slots as booked and create customer choice
            var customerChoiceId = Guid.NewGuid();
            var customerChoice = new CustomerChoice
            {
                Id = customerChoiceId,
                UserId = createdByUserId,
                SlotId = timeSlots.First().Id, // Use first slot for backward compatibility
                CreatedAt = DateTime.UtcNow,
                Description = dto.Description,
                Priority = dto.Priority,
                Status = "Open",
                ConsultantId = dto.ConsultantId,
                SupportTypeId = dto.SupportTypeId,
                SupportCategoryId = dto.SupportCategoryId,
                SupportSubOptionId = dto.SupportSubOptionId
            };
            _context.CustomerChoices.Add(customerChoice);

            // Mark all time slots as booked
            foreach (var slot in timeSlots)
            {
                slot.BookedByCustomerChoiceId = customerChoiceId;
            }

            // Create support request (Order)
            string orderNumber = $"SR-{DateTime.UtcNow:yyyy-MMdd}-{new Random().Next(1000, 9999)}";
            
            var supportType = await _context.SupportTypes.FindAsync(dto.SupportTypeId);
            string supportTypeName = supportType?.Name ?? "Unknown";
            
            string srIdentifier = !string.IsNullOrWhiteSpace(dto.SrIdentifier) 
                ? dto.SrIdentifier 
                : $"AUTO-{orderNumber}";
                
            var order = new Order
            {
                Id = Guid.NewGuid(),
                OrderNumber = orderNumber,
                CustomerChoiceId = customerChoice.Id,
                SupportTypeId = dto.SupportTypeId,
                SupportTypeName = supportTypeName,
                SupportCategoryId = dto.SupportCategoryId,
                SupportSubOptionId = dto.SupportSubOptionId,
                Description = dto.Description,
                SrIdentifier = srIdentifier,
                Priority = dto.Priority,
                ConsultantId = dto.ConsultantId,
                TimeSlotId = timeSlots.First().Id, // Keep for backward compatibility
                CreatedByUserId = createdByUserId,
                CreatedAt = DateTime.UtcNow,
                StatusId = 1, // Default to "New" status
                StatusString = "New", // Keep backward compatibility
                TotalAmount = totalAmount,
                PaymentStatus = "Pending"
            };
            _context.Orders.Add(order);

            // Create OrderTimeSlot entries for multiple slots
            foreach (var slot in timeSlots)
            {
                var orderTimeSlot = new OrderTimeSlot
                {
                    Id = Guid.NewGuid(),
                    OrderId = order.Id,
                    TimeSlotId = slot.Id
                };
                _context.OrderTimeSlots.Add(orderTimeSlot);
            }

            await _context.SaveChangesAsync();
            return await ToDto(order);
        }

        public async Task<IEnumerable<SupportRequestDto>> GetRecentForUserAsync(Guid userId, string? searchQuery = null)
        {
            var query = _context.Orders
                .Include(o => o.SupportType)
                .Include(o => o.SupportCategory)
                .Include(o => o.SupportSubOption)
                .Include(o => o.Consultant)
                .Include(o => o.TimeSlot)
                .Include(o => o.CreatedByUser)
                .Include(o => o.Status)
                .Include(o => o.OrderTimeSlots).ThenInclude(ots => ots.TimeSlot)
                .Where(o => o.CreatedByUserId == userId);

            // Apply search filter if provided
            if (!string.IsNullOrWhiteSpace(searchQuery))
            {
                var searchTerm = searchQuery.ToLower().Trim();
                query = query.Where(o =>
                    o.OrderNumber.ToLower().Contains(searchTerm) ||
                    o.SrIdentifier.ToLower().Contains(searchTerm) ||
                    (o.SupportType != null && o.SupportType.Name.ToLower().Contains(searchTerm)) ||
                    (o.Description != null && o.Description.ToLower().Contains(searchTerm)) ||
                    (o.Consultant != null && (o.Consultant.FirstName + " " + o.Consultant.LastName).ToLower().Contains(searchTerm)) ||
                    (o.CreatedByUser != null && (o.CreatedByUser.FirstName + " " + o.CreatedByUser.LastName).ToLower().Contains(searchTerm)) ||
                    (o.Status != null && o.Status.StatusName.ToLower().Contains(searchTerm)) ||
                    (o.Priority != null && o.Priority.ToLower().Contains(searchTerm))
                );
            }

            var orders = await query
                .OrderByDescending(o => o.CreatedAt)
                .Take(50) // Increase limit for search results
                .ToListAsync();

            var dtos = new List<SupportRequestDto>();
            foreach (var order in orders)
            {
                dtos.Add(await ToDto(order));
            }
            return dtos;
        }

        public async Task<IEnumerable<SupportRequestDto>> GetRecentForConsultantAsync(Guid consultantId, string? searchQuery = null)
        {
            var query = _context.Orders
                .Include(o => o.SupportType)
                .Include(o => o.SupportCategory)
                .Include(o => o.SupportSubOption)
                .Include(o => o.Consultant)
                .Include(o => o.TimeSlot)
                .Include(o => o.CreatedByUser)
                .Include(o => o.Status)
                .Include(o => o.OrderTimeSlots).ThenInclude(ots => ots.TimeSlot)
                .Where(o => o.ConsultantId == consultantId);

            // Apply search filter if provided
            if (!string.IsNullOrWhiteSpace(searchQuery))
            {
                var searchTerm = searchQuery.ToLower().Trim();
                query = query.Where(o =>
                    o.OrderNumber.ToLower().Contains(searchTerm) ||
                    o.SrIdentifier.ToLower().Contains(searchTerm) ||
                    (o.SupportType != null && o.SupportType.Name.ToLower().Contains(searchTerm)) ||
                    (o.Description != null && o.Description.ToLower().Contains(searchTerm)) ||
                    (o.Consultant != null && (o.Consultant.FirstName + " " + o.Consultant.LastName).ToLower().Contains(searchTerm)) ||
                    (o.CreatedByUser != null && (o.CreatedByUser.FirstName + " " + o.CreatedByUser.LastName).ToLower().Contains(searchTerm)) ||
                    (o.Status != null && o.Status.StatusName.ToLower().Contains(searchTerm)) ||
                    (o.Priority != null && o.Priority.ToLower().Contains(searchTerm))
                );
            }

            var orders = await query
                .OrderByDescending(o => o.CreatedAt)
                .Take(50) // Increase limit for search results
                .ToListAsync();

            var dtos = new List<SupportRequestDto>();
            foreach (var order in orders)
            {
                dtos.Add(await ToDto(order));
            }
            return dtos;
        }

        public async Task<IEnumerable<SupportRequestDto>> GetAllAsync()
        {
            var orders = await _context.Orders
                .Include(o => o.SupportType)
                .Include(o => o.SupportCategory)
                .Include(o => o.SupportSubOption)
                .Include(o => o.Consultant)
                .Include(o => o.TimeSlot)
                .Include(o => o.CreatedByUser)
                .Include(o => o.Status)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();

            var dtos = new List<SupportRequestDto>();
            foreach (var order in orders)
            {
                dtos.Add(await ToDto(order));
            }
            return dtos;
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
            await _context.Entry(o).Reference(x => x.Status).LoadAsync();

            // Check for existing conversation
            var conversation = await _context.Conversations
                .FirstOrDefaultAsync(c => c.OrderId == o.Id);

            int unreadCount = 0;
            if (conversation != null)
            {
                // Count unread messages in the conversation
                unreadCount = await _context.Messages
                    .Where(m => m.ConversationId == conversation.Id && m.ReadAt == null)
                    .CountAsync();
            }
            
            // Load order time slots for multiple slots support
            await _context.Entry(o).Collection(x => x.OrderTimeSlots).LoadAsync();
            foreach (var ots in o.OrderTimeSlots)
            {
                await _context.Entry(ots).Reference(x => x.TimeSlot).LoadAsync();
            }

            // Calculate total hours from all time slots
            int totalHours = 0;
            var timeSlotInfos = new List<TimeSlotInfo>();
            foreach (var ots in o.OrderTimeSlots)
            {
                var slot = ots.TimeSlot;
                if (slot != null)
                {
                    var duration = slot.SlotEndTime - slot.SlotStartTime;
                    var hours = (int)duration.TotalHours;
                    totalHours += hours;
                    
                    timeSlotInfos.Add(new TimeSlotInfo
                    {
                        Id = slot.Id,
                        StartTime = slot.SlotStartTime,
                        EndTime = slot.SlotEndTime,
                        DurationHours = hours
                    });
                }
            }
            
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
                TimeSlots = timeSlotInfos, // Multiple time slots
                CreatedByUserId = o.CreatedByUserId,
                CreatedByName = o.CreatedByUser != null ? o.CreatedByUser.FirstName + " " + o.CreatedByUser.LastName : "Unknown",
                CreatedAt = o.CreatedAt,
                Status = o.Status.StatusName,
                ConversationId = conversation?.Id,
                HasConversation = conversation != null,
                UnreadMessageCount = unreadCount,
                TotalAmount = o.TotalAmount,
                PaymentStatus = o.PaymentStatus,
                ConsultantHourlyRate = o.Consultant?.HourlyRate,
                TotalHours = totalHours
            };
        }

                public async Task<bool> UpdateStatusAsync(Guid orderId, string status, Guid changedByUserId, string? comment = null)
        {
            // The orderId parameter is the Order ID from the frontend
            var order = await _context.Orders
                .Include(o => o.Status)
                .FirstOrDefaultAsync(o => o.Id == orderId);
            if (order == null) return false;

            // Find the status master record by status code
            var statusMaster = await _context.StatusMaster.FirstOrDefaultAsync(sm => sm.StatusCode == status);
            if (statusMaster == null) return false;

            // Store the old status for logging
            var oldStatusId = order.StatusId;
            var oldStatus = order.Status;

            // Update the order status
            order.StatusId = statusMaster.Id;
            order.StatusString = status; // Keep backward compatibility
            order.LastUpdated = DateTime.UtcNow;
            
            // Create status change log entry
            var statusChangeLog = new StatusChangeLog
            {
                Id = Guid.NewGuid(),
                OrderId = orderId,
                FromStatusId = oldStatusId,
                ToStatusId = statusMaster.Id,
                ChangedByUserId = changedByUserId,
                Comment = comment,
                ChangedAt = DateTime.UtcNow
            };

            _context.StatusChangeLogs.Add(statusChangeLog);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
