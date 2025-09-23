using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;

namespace SapBasisPulse.Api.Services
{
    public interface IFileUploadService
    {
        Task<(bool Success, string? FilePath, string? FileName, string? Error)> UploadFileAsync(IFormFile file, string uploadDirectory = "uploads");
        Task<bool> DeleteFileAsync(string filePath);
        Task<(bool Success, Stream? FileStream, string? ContentType, string? Error)> GetFileAsync(string filePath);
        bool IsValidFileType(string fileName, string contentType);
        bool IsValidFileSize(long fileSize);
        string GenerateUniqueFileName(string originalFileName);
        List<string> GetAllowedFileTypes();
        long GetMaxFileSize();
    }

    public class FileUploadService : IFileUploadService
    {
        private readonly IConfiguration _configuration;
        private readonly List<string> _allowedFileTypes;
        private readonly long _maxFileSize;

        public FileUploadService(IConfiguration configuration)
        {
            _configuration = configuration;
            
            // Configure allowed file types (you can move this to appsettings.json)
            _allowedFileTypes = new List<string>
            {
                // Images
                "image/jpeg", "image/jpg", "image/png", "image/gif", "image/bmp", "image/webp",
                // Documents
                "application/pdf", "application/msword", 
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/vnd.ms-excel",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "application/vnd.ms-powerpoint",
                "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                // Text files
                "text/plain", "text/csv",
                // Archives
                "application/zip", "application/x-rar-compressed", "application/x-7z-compressed"
            };

            // Max file size: 10MB (you can move this to appsettings.json)
            _maxFileSize = 10 * 1024 * 1024; // 10MB
        }

        public async Task<(bool Success, string? FilePath, string? FileName, string? Error)> UploadFileAsync(IFormFile file, string uploadDirectory = "uploads")
        {
            try
            {
                if (file == null || file.Length == 0)
                    return (false, null, null, "No file provided");

                if (!IsValidFileType(file.FileName, file.ContentType))
                    return (false, null, null, "File type not allowed");

                if (!IsValidFileSize(file.Length))
                    return (false, null, null, $"File size exceeds maximum limit of {_maxFileSize / (1024 * 1024)}MB");

                // Create upload directory if it doesn't exist
                var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", uploadDirectory);
                if (!Directory.Exists(uploadsPath))
                {
                    Directory.CreateDirectory(uploadsPath);
                }

                // Generate unique file name
                var uniqueFileName = GenerateUniqueFileName(file.FileName);
                var filePath = Path.Combine(uploadsPath, uniqueFileName);

                // Save file
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // Return relative path for database storage
                var relativePath = Path.Combine(uploadDirectory, uniqueFileName);
                return (true, relativePath.Replace("\\", "/"), uniqueFileName, null);
            }
            catch (Exception ex)
            {
                return (false, null, null, $"File upload failed: {ex.Message}");
            }
        }

        public async Task<bool> DeleteFileAsync(string filePath)
        {
            try
            {
                var fullPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", filePath);
                if (File.Exists(fullPath))
                {
                    await Task.Run(() => File.Delete(fullPath));
                    return true;
                }
                return false;
            }
            catch
            {
                return false;
            }
        }

        public async Task<(bool Success, Stream? FileStream, string? ContentType, string? Error)> GetFileAsync(string filePath)
        {
            try
            {
                var fullPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", filePath);
                if (!File.Exists(fullPath))
                    return (false, null, null, "File not found");

                var fileStream = new FileStream(fullPath, FileMode.Open, FileAccess.Read);
                var contentType = GetContentType(Path.GetExtension(fullPath));

                return (true, fileStream, contentType, null);
            }
            catch (Exception ex)
            {
                return (false, null, null, $"Error reading file: {ex.Message}");
            }
        }

        public bool IsValidFileType(string fileName, string contentType)
        {
            if (string.IsNullOrEmpty(fileName) || string.IsNullOrEmpty(contentType))
                return false;

            return _allowedFileTypes.Contains(contentType.ToLower());
        }

        public bool IsValidFileSize(long fileSize)
        {
            return fileSize > 0 && fileSize <= _maxFileSize;
        }

        public string GenerateUniqueFileName(string originalFileName)
        {
            var extension = Path.GetExtension(originalFileName);
            var fileNameWithoutExtension = Path.GetFileNameWithoutExtension(originalFileName);
            var uniqueId = Guid.NewGuid().ToString("N")[..8]; // First 8 characters of GUID
            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            
            return $"{fileNameWithoutExtension}_{timestamp}_{uniqueId}{extension}";
        }

        public List<string> GetAllowedFileTypes()
        {
            return new List<string>(_allowedFileTypes);
        }

        public long GetMaxFileSize()
        {
            return _maxFileSize;
        }

        private string GetContentType(string extension)
        {
            return extension.ToLower() switch
            {
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".gif" => "image/gif",
                ".bmp" => "image/bmp",
                ".webp" => "image/webp",
                ".pdf" => "application/pdf",
                ".doc" => "application/msword",
                ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ".xls" => "application/vnd.ms-excel",
                ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                ".ppt" => "application/vnd.ms-powerpoint",
                ".pptx" => "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                ".txt" => "text/plain",
                ".csv" => "text/csv",
                ".zip" => "application/zip",
                ".rar" => "application/x-rar-compressed",
                ".7z" => "application/x-7z-compressed",
                _ => "application/octet-stream"
            };
        }
    }
}