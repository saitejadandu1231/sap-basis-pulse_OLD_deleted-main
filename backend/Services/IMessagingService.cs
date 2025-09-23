using SapBasisPulse.Api.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SapBasisPulse.Api.Services
{
    public interface IMessagingService
    {
        Task<bool> OrderExistsAsync(Guid orderId);
        // Conversation operations
        Task<ConversationDto> CreateConversationAsync(CreateConversationDto dto, Guid userId);
        Task<ConversationDto?> GetConversationByIdAsync(Guid conversationId, Guid userId);
        Task<ConversationDto?> GetConversationByOrderIdAsync(Guid orderId, Guid userId);
        Task<IEnumerable<ConversationDto>> GetUserConversationsAsync(Guid userId, int page = 1, int pageSize = 20);
        Task<bool> UpdateConversationStatusAsync(Guid conversationId, bool isActive, Guid userId);

        // Message operations
        Task<MessageDto> SendMessageAsync(CreateMessageDto dto, Guid senderId);
        Task<MessageDto?> GetMessageByIdAsync(Guid messageId, Guid userId);
        Task<IEnumerable<MessageDto>> GetConversationMessagesAsync(Guid conversationId, Guid userId, int page = 1, int pageSize = 50);
        Task<MessageDto?> UpdateMessageAsync(Guid messageId, UpdateMessageDto dto, Guid userId);
        Task<bool> DeleteMessageAsync(Guid messageId, Guid userId);
        Task<bool> MarkMessagesAsReadAsync(MarkMessageReadDto dto, Guid userId);

        // Attachment operations
        Task<MessageAttachmentDto> AddAttachmentToMessageAsync(Guid messageId, string fileName, string originalFileName, string contentType, long fileSize, string filePath, Guid userId);
        Task<MessageAttachmentDto?> GetAttachmentAsync(Guid attachmentId, Guid userId);
        Task<bool> DeleteAttachmentAsync(Guid attachmentId, Guid userId);

        // Utility operations
        Task<int> GetUnreadMessageCountAsync(Guid userId);
        Task<bool> CanUserAccessConversationAsync(Guid conversationId, Guid userId);
    }
}