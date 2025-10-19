using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SapBasisPulse.Api.Data;
using SapBasisPulse.Api.DTOs;
using SapBasisPulse.Api.Entities;
using SapBasisPulse.Api.Services;
using System.Security.Claims;

namespace SapBasisPulse.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class FileUploadController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ICloudinaryTicketFileService _fileUploadService;
        private readonly ISystemSettingsService _systemSettingsService;
        private readonly ILogger<FileUploadController> _logger;

        public FileUploadController(
            AppDbContext context,
            ICloudinaryTicketFileService fileUploadService,
            ISystemSettingsService systemSettingsService,
            ILogger<FileUploadController> logger)
        {
            _context = context;
            _fileUploadService = fileUploadService;
            _systemSettingsService = systemSettingsService;
            _logger = logger;
        }

        [HttpGet("settings")]
        public async Task<IActionResult> GetFileUploadSettings()
        {
            var isEnabled = await _systemSettingsService.GetBooleanSettingAsync("EnableFileUploads", false);
            var maxFileSize = await _systemSettingsService.GetLongSettingAsync("MaxFileUploadSizeBytes", 10 * 1024 * 1024); // 10MB default
            var maxFilesPerTicket = await _systemSettingsService.GetIntSettingAsync("MaxFilesPerTicket", 5);
            
            var allowedTypes = new[]
            {
                "image/jpeg", "image/png", "image/gif", "image/webp",
                "application/pdf",
                "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "text/plain", "application/zip"
            };

            var settings = new TicketFileUploadSettingsDto
            {
                IsEnabled = isEnabled,
                MaxFileSizeBytes = maxFileSize,
                AllowedFileTypes = allowedTypes,
                MaxFilesPerTicket = maxFilesPerTicket
            };

            return Ok(settings);
        }

        [HttpPost("upload")]
        public async Task<IActionResult> UploadFile([FromForm] UploadTicketFileDto dto)
        {
            try
            {
                // Check if file upload is enabled
                var isEnabled = await _systemSettingsService.GetBooleanSettingAsync("EnableFileUploads", false);
                if (!isEnabled)
                {
                    return BadRequest("File upload is currently disabled");
                }

                var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? throw new UnauthorizedAccessException());

                // Verify the order exists and user has access
                var order = await _context.Orders
                    .Where(o => o.Id == dto.OrderId)
                    .Where(o => o.CreatedByUserId == userId || o.ConsultantId == userId || User.IsInRole("Admin"))
                    .FirstOrDefaultAsync();

                if (order == null)
                {
                    return NotFound("Ticket not found or access denied");
                }

                // Check file count limit
                var maxFiles = await _systemSettingsService.GetIntSettingAsync("MaxFilesPerTicket", 5);
                var currentFileCount = await _context.TicketAttachments
                    .CountAsync(ta => ta.OrderId == dto.OrderId);

                if (currentFileCount >= maxFiles)
                {
                    return BadRequest($"Maximum {maxFiles} files allowed per ticket");
                }

                // Validate file
                if (!_fileUploadService.IsFileTypeAllowed(dto.File.ContentType))
                {
                    return BadRequest($"File type {dto.File.ContentType} is not allowed");
                }

                if (!_fileUploadService.IsFileSizeAllowed(dto.File.Length))
                {
                    var maxSize = await _systemSettingsService.GetLongSettingAsync("MaxFileUploadSizeBytes", 10 * 1024 * 1024);
                    return BadRequest($"File size exceeds maximum allowed size of {maxSize / (1024 * 1024)}MB");
                }

                // Upload file to Cloudinary
                var fileUrl = await _fileUploadService.UploadFileAsync(dto.File, $"tickets/{dto.OrderId}");

                // Save attachment record
                var attachment = new TicketAttachment
                {
                    Id = Guid.NewGuid(),
                    OrderId = dto.OrderId,
                    UploadedById = userId,
                    FileName = dto.File.FileName ?? "unknown",
                    OriginalFileName = dto.File.FileName ?? "unknown",
                    FileUrl = fileUrl,
                    FileSize = dto.File.Length,
                    ContentType = dto.File.ContentType,
                    UploadProvider = "cloudinary",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.TicketAttachments.Add(attachment);
                await _context.SaveChangesAsync();

                var response = new TicketFileUploadResponseDto
                {
                    Id = attachment.Id,
                    FileName = attachment.FileName,
                    FileUrl = attachment.FileUrl,
                    FileSize = attachment.FileSize,
                    ContentType = attachment.ContentType,
                    CreatedAt = attachment.CreatedAt
                };

                _logger.LogInformation("File uploaded successfully: {FileName} for ticket {OrderId}", dto.File.FileName, dto.OrderId);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading file for ticket {OrderId}", dto.OrderId);
                return StatusCode(500, "Internal server error during file upload");
            }
        }

        [HttpGet("ticket/{orderId}")]
        public async Task<IActionResult> GetTicketAttachments(Guid orderId)
        {
            try
            {
                var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? throw new UnauthorizedAccessException());

                // Verify the order exists and user has access
                var order = await _context.Orders
                    .Where(o => o.Id == orderId)
                    .Where(o => o.CreatedByUserId == userId || o.ConsultantId == userId || User.IsInRole("Admin"))
                    .FirstOrDefaultAsync();

                if (order == null)
                {
                    return NotFound("Ticket not found or access denied");
                }

                var attachments = await _context.TicketAttachments
                    .Include(ta => ta.UploadedBy)
                    .Where(ta => ta.OrderId == orderId)
                    .OrderByDescending(ta => ta.CreatedAt)
                    .Select(ta => new TicketAttachmentDto
                    {
                        Id = ta.Id,
                        OrderId = ta.OrderId,
                        UploadedById = ta.UploadedById,
                        UploadedByName = ta.UploadedBy.FirstName + " " + ta.UploadedBy.LastName,
                        FileName = ta.FileName,
                        OriginalFileName = ta.OriginalFileName,
                        FileUrl = ta.FileUrl,
                        FileSize = ta.FileSize,
                        ContentType = ta.ContentType,
                        UploadProvider = ta.UploadProvider,
                        CreatedAt = ta.CreatedAt
                    })
                    .ToListAsync();

                return Ok(attachments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting attachments for ticket {OrderId}", orderId);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpDelete("{attachmentId}")]
        public async Task<IActionResult> DeleteAttachment(Guid attachmentId)
        {
            try
            {
                var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? throw new UnauthorizedAccessException());

                var attachment = await _context.TicketAttachments
                    .Include(ta => ta.Order)
                    .Where(ta => ta.Id == attachmentId)
                    .FirstOrDefaultAsync();

                if (attachment == null)
                {
                    return NotFound("Attachment not found");
                }

                // Check if user has permission to delete (uploader, consultant, or admin)
                var canDelete = attachment.UploadedById == userId ||
                               attachment.Order.ConsultantId == userId ||
                               User.IsInRole("Admin");

                if (!canDelete)
                {
                    return Forbid("You don't have permission to delete this attachment");
                }

                // Delete from Cloudinary
                var deleted = await _fileUploadService.DeleteFileAsync(attachment.FileUrl);
                if (!deleted)
                {
                    _logger.LogWarning("Failed to delete file from Cloudinary: {FileUrl}", attachment.FileUrl);
                }

                // Delete from database
                _context.TicketAttachments.Remove(attachment);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Attachment deleted: {AttachmentId} by user {UserId}", attachmentId, userId);
                return Ok(new { message = "Attachment deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting attachment {AttachmentId}", attachmentId);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("download/{attachmentId}")]
        public async Task<IActionResult> DownloadAttachment(Guid attachmentId)
        {
            try
            {
                var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? throw new UnauthorizedAccessException());

                var attachment = await _context.TicketAttachments
                    .Include(ta => ta.Order)
                    .Where(ta => ta.Id == attachmentId)
                    .Where(ta => ta.Order.CreatedByUserId == userId || ta.Order.ConsultantId == userId || User.IsInRole("Admin"))
                    .FirstOrDefaultAsync();

                if (attachment == null)
                {
                    return NotFound("Attachment not found or access denied");
                }

                // For Cloudinary, we can just redirect to the secure URL
                // or proxy the file through our server
                return Redirect(attachment.FileUrl);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downloading attachment {AttachmentId}", attachmentId);
                return StatusCode(500, "Internal server error");
            }
        }
    }
}