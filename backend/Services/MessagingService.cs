using Microsoft.EntityFrameworkCore;
using SapBasisPulse.Api.Data;
using SapBasisPulse.Api.DTOs;
using SapBasisPulse.Api.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SapBasisPulse.Api.Services
{
    public class MessagingService : IMessagingService
    {
        private readonly AppDbContext _context;

        public MessagingService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<ConversationDto> CreateConversationAsync(CreateConversationDto dto, Guid userId)
        {
            // Get the order and verify user access
            var order = await _context.Orders
                .Include(o => o.CreatedByUser)
                .Include(o => o.Consultant)
                .FirstOrDefaultAsync(o => o.Id == dto.OrderId);

            if (order == null)
                throw new ArgumentException("Order not found");

            // Verify user has access to this order
            if (order.CreatedByUserId != userId && order.ConsultantId != userId)
                throw new UnauthorizedAccessException("User does not have access to this order");

            // Check if conversation already exists for this order
            var existingConversation = await _context.Conversations
                .FirstOrDefaultAsync(c => c.OrderId == dto.OrderId);

            if (existingConversation != null)
            {
                return await MapToConversationDto(existingConversation, userId);
            }

            // Create new conversation
            var conversation = new Conversation
            {
                Id = Guid.NewGuid(),
                OrderId = dto.OrderId,
                CustomerId = order.CreatedByUserId,
                ConsultantId = order.ConsultantId,
                Subject = dto.Subject,
                CreatedAt = DateTime.UtcNow,
                LastMessageAt = DateTime.UtcNow,
                IsActive = true
            };

            _context.Conversations.Add(conversation);

            // Create initial message
            var initialMessage = new Message
            {
                Id = Guid.NewGuid(),
                ConversationId = conversation.Id,
                SenderId = userId,
                Content = dto.InitialMessage,
                MessageType = "text",
                SentAt = DateTime.UtcNow
            };

            _context.Messages.Add(initialMessage);
            await _context.SaveChangesAsync();

            return await MapToConversationDto(conversation, userId);
        }

        public async Task<ConversationDto?> GetConversationByIdAsync(Guid conversationId, Guid userId)
        {
            var conversation = await _context.Conversations
                .Include(c => c.Customer)
                .Include(c => c.Consultant)
                .Include(c => c.Order)
                .FirstOrDefaultAsync(c => c.Id == conversationId);

            if (conversation == null || !await CanUserAccessConversationAsync(conversationId, userId))
                return null;

            return await MapToConversationDto(conversation, userId);
        }

        public async Task<ConversationDto?> GetConversationByOrderIdAsync(Guid orderId, Guid userId)
        {
            var conversation = await _context.Conversations
                .Include(c => c.Customer)
                .Include(c => c.Consultant)
                .Include(c => c.Order)
                .FirstOrDefaultAsync(c => c.OrderId == orderId);

            if (conversation == null || !await CanUserAccessConversationAsync(conversation.Id, userId))
                return null;

            return await MapToConversationDto(conversation, userId);
        }

        public async Task<IEnumerable<ConversationDto>> GetUserConversationsAsync(Guid userId, int page = 1, int pageSize = 20)
        {
            var conversations = await _context.Conversations
                .Include(c => c.Customer)
                .Include(c => c.Consultant)
                .Include(c => c.Order)
                .Where(c => c.CustomerId == userId || c.ConsultantId == userId)
                .OrderByDescending(c => c.LastMessageAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var conversationDtos = new List<ConversationDto>();
            foreach (var conversation in conversations)
            {
                conversationDtos.Add(await MapToConversationDto(conversation, userId));
            }

            return conversationDtos;
        }

        public async Task<bool> UpdateConversationStatusAsync(Guid conversationId, bool isActive, Guid userId)
        {
            var conversation = await _context.Conversations
                .FirstOrDefaultAsync(c => c.Id == conversationId);

            if (conversation == null || !await CanUserAccessConversationAsync(conversationId, userId))
                return false;

            conversation.IsActive = isActive;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<MessageDto> SendMessageAsync(CreateMessageDto dto, Guid senderId)
        {
            if (!await CanUserAccessConversationAsync(dto.ConversationId, senderId))
                throw new UnauthorizedAccessException("User does not have access to this conversation");

            var message = new Message
            {
                Id = Guid.NewGuid(),
                ConversationId = dto.ConversationId,
                SenderId = senderId,
                Content = dto.Content,
                MessageType = dto.MessageType,
                SentAt = DateTime.UtcNow
            };

            _context.Messages.Add(message);

            // Update conversation's last message time
            var conversation = await _context.Conversations
                .FirstOrDefaultAsync(c => c.Id == dto.ConversationId);
            
            if (conversation != null)
            {
                conversation.LastMessageAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return await MapToMessageDto(message);
        }

        public async Task<MessageDto?> GetMessageByIdAsync(Guid messageId, Guid userId)
        {
            var message = await _context.Messages
                .Include(m => m.Conversation)
                .Include(m => m.Sender)
                .Include(m => m.Attachments)
                    .ThenInclude(a => a.UploadedBy)
                .FirstOrDefaultAsync(m => m.Id == messageId);

            if (message == null || !await CanUserAccessConversationAsync(message.ConversationId, userId))
                return null;

            return await MapToMessageDto(message);
        }

        public async Task<IEnumerable<MessageDto>> GetConversationMessagesAsync(Guid conversationId, Guid userId, int page = 1, int pageSize = 50)
        {
            if (!await CanUserAccessConversationAsync(conversationId, userId))
                throw new UnauthorizedAccessException("User does not have access to this conversation");

            var messages = await _context.Messages
                .Include(m => m.Sender)
                .Include(m => m.Attachments)
                    .ThenInclude(a => a.UploadedBy)
                .Where(m => m.ConversationId == conversationId)
                .OrderByDescending(m => m.SentAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var messageDtos = new List<MessageDto>();
            foreach (var message in messages)
            {
                messageDtos.Add(await MapToMessageDto(message));
            }

            return messageDtos.OrderBy(m => m.SentAt);
        }

        public async Task<MessageDto?> UpdateMessageAsync(Guid messageId, UpdateMessageDto dto, Guid userId)
        {
            var message = await _context.Messages
                .Include(m => m.Sender)
                .Include(m => m.Attachments)
                    .ThenInclude(a => a.UploadedBy)
                .FirstOrDefaultAsync(m => m.Id == messageId);

            if (message == null || message.SenderId != userId)
                return null;

            message.Content = dto.Content;
            message.IsEdited = true;
            message.EditedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return await MapToMessageDto(message);
        }

        public async Task<bool> DeleteMessageAsync(Guid messageId, Guid userId)
        {
            var message = await _context.Messages
                .FirstOrDefaultAsync(m => m.Id == messageId);

            if (message == null || message.SenderId != userId)
                return false;

            _context.Messages.Remove(message);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> MarkMessagesAsReadAsync(MarkMessageReadDto dto, Guid userId)
        {
            var messages = await _context.Messages
                .Include(m => m.Conversation)
                .Where(m => dto.MessageIds.Contains(m.Id))
                .ToListAsync();

            var updated = 0;
            foreach (var message in messages)
            {
                // Only mark as read if user has access and message is not from the same user
                if (message.SenderId != userId && 
                    await CanUserAccessConversationAsync(message.ConversationId, userId))
                {
                    if (message.ReadAt == null)
                    {
                        message.ReadAt = DateTime.UtcNow;
                        updated++;
                    }
                }
            }

            if (updated > 0)
            {
                await _context.SaveChangesAsync();
            }

            return updated > 0;
        }

        public async Task<MessageAttachmentDto> AddAttachmentToMessageAsync(Guid messageId, string fileName, string originalFileName, string contentType, long fileSize, string filePath, Guid userId)
        {
            var message = await _context.Messages
                .Include(m => m.Conversation)
                .FirstOrDefaultAsync(m => m.Id == messageId);

            if (message == null || !await CanUserAccessConversationAsync(message.ConversationId, userId))
                throw new UnauthorizedAccessException("User does not have access to this message");

            var attachment = new MessageAttachment
            {
                Id = Guid.NewGuid(),
                MessageId = messageId,
                FileName = fileName,
                OriginalFileName = originalFileName,
                ContentType = contentType,
                FileSize = fileSize,
                FilePath = filePath,
                UploadedAt = DateTime.UtcNow,
                UploadedByUserId = userId
            };

            _context.MessageAttachments.Add(attachment);
            await _context.SaveChangesAsync();

            return await MapToAttachmentDto(attachment);
        }

        public async Task<MessageAttachmentDto?> GetAttachmentAsync(Guid attachmentId, Guid userId)
        {
            var attachment = await _context.MessageAttachments
                .Include(a => a.Message)
                    .ThenInclude(m => m.Conversation)
                .Include(a => a.UploadedBy)
                .FirstOrDefaultAsync(a => a.Id == attachmentId);

            if (attachment == null || !await CanUserAccessConversationAsync(attachment.Message.ConversationId, userId))
                return null;

            return await MapToAttachmentDto(attachment);
        }

        public async Task<bool> DeleteAttachmentAsync(Guid attachmentId, Guid userId)
        {
            var attachment = await _context.MessageAttachments
                .Include(a => a.Message)
                    .ThenInclude(m => m.Conversation)
                .FirstOrDefaultAsync(a => a.Id == attachmentId);

            if (attachment == null || 
                (attachment.UploadedByUserId != userId && !await CanUserAccessConversationAsync(attachment.Message.ConversationId, userId)))
                return false;

            _context.MessageAttachments.Remove(attachment);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<int> GetUnreadMessageCountAsync(Guid userId)
        {
            return await _context.Messages
                .Include(m => m.Conversation)
                .Where(m => (m.Conversation.CustomerId == userId || m.Conversation.ConsultantId == userId) &&
                           m.SenderId != userId &&
                           m.ReadAt == null)
                .CountAsync();
        }

        public async Task<bool> CanUserAccessConversationAsync(Guid conversationId, Guid userId)
        {
            return await _context.Conversations
                .AnyAsync(c => c.Id == conversationId && 
                              (c.CustomerId == userId || c.ConsultantId == userId));
        }

        private async Task<ConversationDto> MapToConversationDto(Conversation conversation, Guid userId)
        {
            var lastMessage = await _context.Messages
                .Include(m => m.Sender)
                .Where(m => m.ConversationId == conversation.Id)
                .OrderByDescending(m => m.SentAt)
                .FirstOrDefaultAsync();

            var unreadCount = await _context.Messages
                .Where(m => m.ConversationId == conversation.Id && 
                           m.SenderId != userId && 
                           m.ReadAt == null)
                .CountAsync();

            return new ConversationDto
            {
                Id = conversation.Id,
                OrderId = conversation.OrderId,
                OrderNumber = conversation.Order?.OrderNumber ?? "",
                CustomerId = conversation.CustomerId,
                CustomerName = $"{conversation.Customer?.FirstName} {conversation.Customer?.LastName}".Trim(),
                ConsultantId = conversation.ConsultantId,
                ConsultantName = conversation.Consultant != null ? 
                    $"{conversation.Consultant.FirstName} {conversation.Consultant.LastName}".Trim() : "",
                Subject = conversation.Subject,
                CreatedAt = conversation.CreatedAt,
                LastMessageAt = conversation.LastMessageAt,
                IsActive = conversation.IsActive,
                UnreadCount = unreadCount,
                LastMessage = lastMessage != null ? await MapToMessageDto(lastMessage) : null
            };
        }

        private async Task<MessageDto> MapToMessageDto(Message message)
        {
            var attachments = new List<MessageAttachmentDto>();
            if (message.Attachments?.Any() == true)
            {
                foreach (var attachment in message.Attachments)
                {
                    attachments.Add(await MapToAttachmentDto(attachment));
                }
            }

            return new MessageDto
            {
                Id = message.Id,
                ConversationId = message.ConversationId,
                SenderId = message.SenderId,
                SenderName = $"{message.Sender?.FirstName} {message.Sender?.LastName}".Trim(),
                SenderRole = message.Sender?.Role.ToString() ?? "Unknown",
                Content = message.Content,
                MessageType = message.MessageType,
                SentAt = message.SentAt,
                ReadAt = message.ReadAt,
                IsEdited = message.IsEdited,
                EditedAt = message.EditedAt,
                Attachments = attachments
            };
        }

        private async Task<MessageAttachmentDto> MapToAttachmentDto(MessageAttachment attachment)
        {
            return await Task.FromResult(new MessageAttachmentDto
            {
                Id = attachment.Id,
                FileName = attachment.FileName,
                OriginalFileName = attachment.OriginalFileName,
                ContentType = attachment.ContentType,
                FileSize = attachment.FileSize,
                UploadedAt = attachment.UploadedAt,
                UploadedByName = $"{attachment.UploadedBy?.FirstName} {attachment.UploadedBy?.LastName}".Trim(),
                DownloadUrl = $"/api/Messaging/attachments/{attachment.Id}/download"
            });
        }
    }
}