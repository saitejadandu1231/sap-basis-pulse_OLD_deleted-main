using System.ComponentModel.DataAnnotations;

namespace SapBasisPulse.Api.DTOs
{
    public class TicketAttachmentDto
    {
        public Guid Id { get; set; }
        public Guid OrderId { get; set; }
        public Guid UploadedById { get; set; }
        public string UploadedByName { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public string OriginalFileName { get; set; } = string.Empty;
        public string FileUrl { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public string ContentType { get; set; } = string.Empty;
        public string UploadProvider { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public string FileSizeFormatted => FormatFileSize(FileSize);

        private static string FormatFileSize(long bytes)
        {
            if (bytes < 1024) return $"{bytes} B";
            if (bytes < 1024 * 1024) return $"{bytes / 1024.0:F1} KB";
            if (bytes < 1024 * 1024 * 1024) return $"{bytes / (1024.0 * 1024.0):F1} MB";
            return $"{bytes / (1024.0 * 1024.0 * 1024.0):F1} GB";
        }
    }

    public class UploadTicketFileDto
    {
        [Required]
        public Guid OrderId { get; set; }
        
        [Required]
        public IFormFile File { get; set; } = null!;
    }

    public class TicketFileUploadResponseDto
    {
        public Guid Id { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string FileUrl { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public string ContentType { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class TicketFileUploadSettingsDto
    {
        public bool IsEnabled { get; set; }
        public long MaxFileSizeBytes { get; set; }
        public string[] AllowedFileTypes { get; set; } = Array.Empty<string>();
        public int MaxFilesPerTicket { get; set; }
    }
}