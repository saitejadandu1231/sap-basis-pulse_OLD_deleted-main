using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SapBasisPulse.Api.DTOs;
using SapBasisPulse.Api.Services;
using System;
using System.Collections.Generic;
using System.IO;
using System.Security.Claims;
using System.Threading.Tasks;

namespace SapBasisPulse.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MessagingController : ControllerBase
    {
        private readonly IMessagingService _messagingService;
        private readonly IFileUploadService _fileUploadService;
        private readonly IConfiguration _configuration;

        public MessagingController(IMessagingService messagingService, IFileUploadService fileUploadService, IConfiguration configuration)
        {
            _messagingService = messagingService;
            _fileUploadService = fileUploadService;
            _configuration = configuration;
        }

        private bool IsMessagingEnabled()
        {
            return _configuration.GetSection("Auth")["MessagingEnabled"]?.ToLower() == "true";
        }

        private Guid GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(userIdClaim, out var userId) ? userId : Guid.Empty;
        }

        // Conversation endpoints
        [HttpPost("conversations/for-order/{orderId}")]
        public async Task<IActionResult> CreateOrGetConversationForOrder(Guid orderId)
        {
            if (!IsMessagingEnabled())
            {
                return BadRequest(new { error = "Messaging functionality is currently disabled" });
            }

            try
            {
                var userId = GetCurrentUserId();
                
                // First check if order exists
                var orderExists = await _messagingService.OrderExistsAsync(orderId);
                if (!orderExists)
                {
                    return BadRequest(new { error = $"Order with ID {orderId} not found" });
                }
                
                // Create a proper DTO with default values for conversation creation
                var createConversationDto = new CreateConversationDto 
                { 
                    OrderId = orderId,
                    Subject = "Support Request Discussion", // Default subject
                    InitialMessage = "Conversation started for support request." // Default initial message
                };
                
                var conversation = await _messagingService.CreateConversationAsync(createConversationDto, userId);
                return Ok(conversation);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpPost("conversations")]
        public async Task<IActionResult> CreateConversation([FromBody] CreateConversationDto dto)
        {
            if (!IsMessagingEnabled())
            {
                return BadRequest(new { error = "Messaging functionality is currently disabled" });
            }

            try
            {
                var userId = GetCurrentUserId();
                var conversation = await _messagingService.CreateConversationAsync(dto, userId);
                return Ok(conversation);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpGet("conversations")]
        public async Task<IActionResult> GetUserConversations([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            try
            {
                var userId = GetCurrentUserId();
                var conversations = await _messagingService.GetUserConversationsAsync(userId, page, pageSize);
                return Ok(conversations);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpGet("conversations/{conversationId}")]
        public async Task<IActionResult> GetConversation(Guid conversationId)
        {
            try
            {
                var userId = GetCurrentUserId();
                var conversation = await _messagingService.GetConversationByIdAsync(conversationId, userId);
                
                if (conversation == null)
                    return NotFound(new { error = "Conversation not found" });

                return Ok(conversation);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpGet("conversations/by-order/{orderId}")]
        public async Task<IActionResult> GetConversationByOrder(Guid orderId)
        {
            try
            {
                // First check if order exists
                var orderExists = await _messagingService.OrderExistsAsync(orderId);
                if (!orderExists)
                {
                    return NotFound(new { error = $"Order with ID {orderId} not found" });
                }
                
                var userId = GetCurrentUserId();
                var conversation = await _messagingService.GetConversationByOrderIdAsync(orderId, userId);
                
                if (conversation == null)
                    return NotFound(new { error = "Conversation not found for this order" });

                return Ok(conversation);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpPut("conversations/{conversationId}/status")]
        public async Task<IActionResult> UpdateConversationStatus(Guid conversationId, [FromBody] bool isActive)
        {
            try
            {
                var userId = GetCurrentUserId();
                var success = await _messagingService.UpdateConversationStatusAsync(conversationId, isActive, userId);
                
                if (!success)
                    return NotFound(new { error = "Conversation not found or access denied" });

                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        // Message endpoints
        [HttpPost("messages")]
        public async Task<IActionResult> SendMessage([FromBody] CreateMessageDto dto)
        {
            if (!IsMessagingEnabled())
            {
                return BadRequest(new { error = "Messaging functionality is currently disabled" });
            }

            try
            {
                var userId = GetCurrentUserId();
                var message = await _messagingService.SendMessageAsync(dto, userId);
                return Ok(message);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpGet("conversations/{conversationId}/messages")]
        public async Task<IActionResult> GetConversationMessages(Guid conversationId, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        {
            try
            {
                var userId = GetCurrentUserId();
                var messages = await _messagingService.GetConversationMessagesAsync(conversationId, userId, page, pageSize);
                return Ok(messages);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpGet("messages/{messageId}")]
        public async Task<IActionResult> GetMessage(Guid messageId)
        {
            try
            {
                var userId = GetCurrentUserId();
                var message = await _messagingService.GetMessageByIdAsync(messageId, userId);
                
                if (message == null)
                    return NotFound(new { error = "Message not found" });

                return Ok(message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpPut("messages/{messageId}")]
        public async Task<IActionResult> UpdateMessage(Guid messageId, [FromBody] UpdateMessageDto dto)
        {
            try
            {
                var userId = GetCurrentUserId();
                var message = await _messagingService.UpdateMessageAsync(messageId, dto, userId);
                
                if (message == null)
                    return NotFound(new { error = "Message not found or access denied" });

                return Ok(message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpDelete("messages/{messageId}")]
        public async Task<IActionResult> DeleteMessage(Guid messageId)
        {
            try
            {
                var userId = GetCurrentUserId();
                var success = await _messagingService.DeleteMessageAsync(messageId, userId);
                
                if (!success)
                    return NotFound(new { error = "Message not found or access denied" });

                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpPost("messages/mark-read")]
        public async Task<IActionResult> MarkMessagesAsRead([FromBody] MarkMessageReadDto dto)
        {
            try
            {
                var userId = GetCurrentUserId();
                var success = await _messagingService.MarkMessagesAsReadAsync(dto, userId);
                return Ok(new { success = success });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        // File upload endpoints
        [HttpPost("messages/{messageId}/attachments")]
        public async Task<IActionResult> UploadAttachment(Guid messageId, IFormFile file)
        {
            try
            {
                var userId = GetCurrentUserId();

                if (file == null || file.Length == 0)
                    return BadRequest(new { error = "No file provided" });

                // Validate file
                if (!_fileUploadService.IsValidFileType(file.FileName, file.ContentType))
                    return BadRequest(new { error = "File type not allowed" });

                if (!_fileUploadService.IsValidFileSize(file.Length))
                    return BadRequest(new { error = $"File size exceeds maximum limit of {_fileUploadService.GetMaxFileSize() / (1024 * 1024)}MB" });

                // Upload file
                var uploadResult = await _fileUploadService.UploadFileAsync(file, "message-attachments");
                
                if (!uploadResult.Success)
                    return BadRequest(new { error = uploadResult.Error });

                // Save attachment info to database
                var attachment = await _messagingService.AddAttachmentToMessageAsync(
                    messageId, 
                    uploadResult.FileName, 
                    file.FileName, 
                    file.ContentType, 
                    file.Length, 
                    uploadResult.FilePath, 
                    userId
                );

                return Ok(attachment);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpGet("attachments/{attachmentId}")]
        public async Task<IActionResult> GetAttachment(Guid attachmentId)
        {
            try
            {
                var userId = GetCurrentUserId();
                var attachment = await _messagingService.GetAttachmentAsync(attachmentId, userId);
                
                if (attachment == null)
                    return NotFound(new { error = "Attachment not found" });

                return Ok(attachment);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpGet("attachments/{attachmentId}/download")]
        public async Task<IActionResult> DownloadAttachment(Guid attachmentId)
        {
            try
            {
                var userId = GetCurrentUserId();
                var attachment = await _messagingService.GetAttachmentAsync(attachmentId, userId);
                
                if (attachment == null)
                    return NotFound(new { error = "Attachment not found" });

                var fileResult = await _fileUploadService.GetFileAsync(attachment.FileName);
                
                if (!fileResult.Success)
                    return NotFound(new { error = "File not found on server" });

                return File(fileResult.FileStream, fileResult.ContentType, attachment.OriginalFileName);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpDelete("attachments/{attachmentId}")]
        public async Task<IActionResult> DeleteAttachment(Guid attachmentId)
        {
            try
            {
                var userId = GetCurrentUserId();
                var success = await _messagingService.DeleteAttachmentAsync(attachmentId, userId);
                
                if (!success)
                    return NotFound(new { error = "Attachment not found or access denied" });

                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        // Utility endpoints
        [HttpGet("unread-count")]
        public async Task<IActionResult> GetUnreadMessageCount()
        {
            try
            {
                var userId = GetCurrentUserId();
                var count = await _messagingService.GetUnreadMessageCountAsync(userId);
                return Ok(new { unreadCount = count });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpGet("file-upload-info")]
        public IActionResult GetFileUploadInfo()
        {
            try
            {
                return Ok(new
                {
                    allowedFileTypes = _fileUploadService.GetAllowedFileTypes(),
                    maxFileSize = _fileUploadService.GetMaxFileSize(),
                    maxFileSizeMB = _fileUploadService.GetMaxFileSize() / (1024 * 1024)
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error" });
            }
        }
    }
}