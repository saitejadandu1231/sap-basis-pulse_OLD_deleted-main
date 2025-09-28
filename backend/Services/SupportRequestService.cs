using Microsoft.EntityFrameworkCore;
using SapBasisPulse.Api.Data;
using SapBasisPulse.Api.DTOs;
using SapBasisPulse.Api.Entities;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace SapBasisPulse.Api.Services
{
    public class SupportRequestService : ISupportRequestService
    {
        private readonly AppDbContext _context;
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<SupportRequestService> _logger;
        
        public SupportRequestService(AppDbContext context, IServiceProvider serviceProvider, ILogger<SupportRequestService> logger)
        {
            _context = context;
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        public async Task<SupportRequestDto> CreateAsync(CreateSupportRequestDto dto, Guid createdByUserId)
        {
            // Validate required fields
            if (string.IsNullOrWhiteSpace(dto.Description) || string.IsNullOrWhiteSpace(dto.Priority))
                throw new ArgumentException("Description and Priority are required");

            // Validate that at least one slot is selected
            if (dto.TimeSlotIds == null || dto.TimeSlotIds.Count == 0)
                throw new ArgumentException("At least one time slot must be selected");

            // SR Identifier logic: required for certain suboptions (handled in UI, double-check here)
            if (dto.SupportSubOptionId.HasValue)
            {
                var subOption = await _context.SupportSubOptions.FindAsync(dto.SupportSubOptionId.Value);
                if (subOption != null && subOption.Name.Contains("SR", StringComparison.OrdinalIgnoreCase) && string.IsNullOrWhiteSpace(dto.SrIdentifier))
                    throw new ArgumentException("SR Identifier is required for this request type");
            }

            // Validate all selected slots are available
            var slots = await _context.ConsultantAvailabilitySlots
                .Where(s => dto.TimeSlotIds.Contains(s.Id))
                .ToListAsync();

            if (slots.Count != dto.TimeSlotIds.Count)
                throw new ArgumentException("One or more selected time slots do not exist");

            // Check that all slots belong to the selected consultant and are available
            foreach (var slot in slots)
            {
                if (slot.ConsultantId != dto.ConsultantId)
                    throw new ArgumentException($"Slot {slot.Id} does not belong to the selected consultant");

                if (slot.BookedByCustomerChoiceId != null)
                    throw new ArgumentException($"Slot {slot.Id} is already booked");
            }
            // Mark all slots as booked
            var customerChoiceId = Guid.NewGuid();
            foreach (var slot in slots)
            {
                slot.BookedByCustomerChoiceId = customerChoiceId;
            }

            var customerChoice = new CustomerChoice
            {
                Id = customerChoiceId,
                UserId = createdByUserId,
                Description = dto.Description, // Set required Description from DTO
                Priority = dto.Priority, // Set Priority from DTO
                Status = "Open", // Default status
                ConsultantId = dto.ConsultantId, // Set ConsultantId from DTO
                SupportTypeId = dto.SupportTypeId, // Copy support taxonomy info
                SupportCategoryId = dto.SupportCategoryId,
                SupportSubOptionId = dto.SupportSubOptionId,
                CreatedAt = DateTime.UtcNow
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
                CreatedByUserId = createdByUserId,
                CreatedAt = DateTime.UtcNow,
                StatusId = 1, // Default to "New" status
                StatusString = "New" // Keep backward compatibility
            };

            // Create OrderSlot records for each selected slot
            foreach (var slot in slots)
            {
                var orderSlot = new OrderSlot
                {
                    Id = Guid.NewGuid(),
                    OrderId = order.Id,
                    SlotId = slot.Id,
                    CreatedAt = DateTime.UtcNow
                };
                order.OrderSlots.Add(orderSlot);
            }

            _context.Orders.Add(order);
            await _context.SaveChangesAsync();
            return await ToDto(order);
        }

        public async Task<IEnumerable<SupportRequestDto>> GetRecentForUserAsync(Guid userId)
        {
            var orders = await _context.Orders
                .Include(o => o.SupportType)
                .Include(o => o.SupportCategory)
                .Include(o => o.SupportSubOption)
                .Include(o => o.Consultant)
                .Include(o => o.TimeSlot)
                .Include(o => o.CreatedByUser)
                .Include(o => o.Status)
                .Where(o => o.CreatedByUserId == userId)
                .OrderByDescending(o => o.CreatedAt)
                .Take(10)
                .ToListAsync();

            var dtos = new List<SupportRequestDto>();
            foreach (var order in orders)
            {
                dtos.Add(await ToDto(order));
            }
            return dtos;
        }

        public async Task<IEnumerable<SupportRequestDto>> GetRecentForConsultantAsync(Guid consultantId)
        {
            var orders = await _context.Orders
                .Include(o => o.SupportType)
                .Include(o => o.SupportCategory)
                .Include(o => o.SupportSubOption)
                .Include(o => o.Consultant)
                .Include(o => o.TimeSlot)
                .Include(o => o.CreatedByUser)
                .Include(o => o.Status)
                .Where(o => o.ConsultantId == consultantId)
                .OrderByDescending(o => o.CreatedAt)
                .Take(10)
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

            // Load OrderSlots with their related Slot data
            await _context.Entry(o).Collection(x => x.OrderSlots).LoadAsync();
            foreach (var orderSlot in o.OrderSlots)
            {
                await _context.Entry(orderSlot).Reference(x => x.Slot).LoadAsync();
            }

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

            // Check for payment status
            var payment = await _context.Payments
                .FirstOrDefaultAsync(p => p.OrderId == o.Id);
            string? paymentStatus = payment?.Status.ToString();
            
            // Build OrderSlots DTO
            var orderSlotsDto = o.OrderSlots.Select(os => new OrderSlotDto
            {
                Id = os.Id,
                SlotId = os.SlotId,
                SlotStartTime = os.Slot.SlotStartTime,
                SlotEndTime = os.Slot.SlotEndTime
            }).ToList();

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
                TimeSlotId = o.TimeSlotId ?? Guid.Empty, // Keep for backward compatibility
                SlotStartTime = o.TimeSlot?.SlotStartTime ?? DateTime.MinValue, // Keep for backward compatibility
                SlotEndTime = o.TimeSlot?.SlotEndTime ?? DateTime.MinValue, // Keep for backward compatibility
                OrderSlots = orderSlotsDto,
                CreatedByUserId = o.CreatedByUserId,
                CreatedByName = o.CreatedByUser != null ? o.CreatedByUser.FirstName + " " + o.CreatedByUser.LastName : "Unknown",
                CreatedAt = o.CreatedAt,
                Status = o.Status.StatusName,
                ConversationId = conversation?.Id,
                HasConversation = conversation != null,
                UnreadMessageCount = unreadCount,
                PaymentStatus = paymentStatus
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

            // Mark payment as ready for admin payout when order is closed
            if (status == "Closed" || status == "TopicClosed")
            {
                _logger.LogInformation("Order {OrderId} status changed to {Status}, marking payment as ready for admin payout", orderId, status);
                
                // Find payment for this order
                var payment = await _context.Payments.FirstOrDefaultAsync(p => p.OrderId == orderId);
                if (payment == null)
                {
                    _logger.LogWarning("No payment found for order {OrderId}", orderId);
                }
                else
                {
                    _logger.LogInformation("Found payment {PaymentId} for order {OrderId}, Status: {PaymentStatus}", 
                        payment.Id, orderId, payment.Status);
                    
                    if (payment.Status == PaymentStatus.Paid)
                    {
                        payment.Status = PaymentStatus.PayoutInitiated; // Ready for admin to pay consultant
                        await _context.SaveChangesAsync();
                        
                        _logger.LogInformation("Payment {PaymentId} marked as ready for admin payout", payment.Id);
                    }
                    else
                    {
                        _logger.LogWarning("Payment {PaymentId} is not in Paid status (current: {PaymentStatus}), cannot mark for payout", 
                            payment.Id, payment.Status);
                    }
                }
            }

            return true;
        }
    }
}
