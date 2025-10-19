using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Http;
using SapBasisPulse.Api.Services;

namespace SapBasisPulse.Api.Services
{
    public class CloudinaryTicketFileService : ICloudinaryTicketFileService
    {
        private readonly IConfiguration _configuration;
        private readonly Cloudinary _cloudinary;
        private readonly ILogger<CloudinaryTicketFileService> _logger;

        public CloudinaryTicketFileService(IConfiguration configuration, ILogger<CloudinaryTicketFileService> logger)
        {
            _configuration = configuration;
            _logger = logger;

            var account = new Account(
                _configuration["Cloudinary:CloudName"],
                _configuration["Cloudinary:ApiKey"],
                _configuration["Cloudinary:ApiSecret"]
            );
            _cloudinary = new Cloudinary(account);
        }

        public async Task<string> UploadFileAsync(IFormFile file, string folder = "tickets")
        {
            if (!IsFileTypeAllowed(file.ContentType))
            {
                throw new InvalidOperationException($"File type {file.ContentType} is not allowed");
            }

            if (!IsFileSizeAllowed(file.Length))
            {
                throw new InvalidOperationException($"File size {file.Length} bytes exceeds maximum allowed size");
            }

            try
            {
                var uploadParams = new RawUploadParams()
                {
                    File = new FileDescription(file.FileName, file.OpenReadStream()),
                    Folder = folder,
                    PublicId = $"{DateTime.UtcNow:yyyyMMddHHmmss}_{Guid.NewGuid():N}",
                    UseFilename = false,
                    UniqueFilename = true
                };

                var uploadResult = await _cloudinary.UploadAsync(uploadParams);

                if (uploadResult.Error != null)
                {
                    _logger.LogError("Cloudinary upload failed: {Error}", uploadResult.Error.Message);
                    throw new InvalidOperationException($"File upload failed: {uploadResult.Error.Message}");
                }

                _logger.LogInformation("File uploaded successfully to Cloudinary: {Url}", uploadResult.SecureUrl);
                return uploadResult.SecureUrl.ToString();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading file to Cloudinary");
                throw;
            }
        }

        public async Task<bool> DeleteFileAsync(string fileUrl)
        {
            try
            {
                var publicId = GetPublicIdFromUrl(fileUrl);
                if (string.IsNullOrEmpty(publicId))
                {
                    _logger.LogWarning("Could not extract public ID from URL: {Url}", fileUrl);
                    return false;
                }

                var deleteParams = new DeletionParams(publicId) 
                { 
                    ResourceType = ResourceType.Auto 
                };
                
                var result = await _cloudinary.DestroyAsync(deleteParams);
                
                _logger.LogInformation("File deletion result: {Result} for publicId: {PublicId}", result.Result, publicId);
                return result.Result == "ok";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting file from Cloudinary: {Url}", fileUrl);
                return false;
            }
        }

        public async Task<Stream> GetFileStreamAsync(string fileUrl)
        {
            try
            {
                using var httpClient = new HttpClient();
                var response = await httpClient.GetAsync(fileUrl);
                response.EnsureSuccessStatusCode();
                return await response.Content.ReadAsStreamAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting file stream from URL: {Url}", fileUrl);
                throw;
            }
        }

        public bool IsFileTypeAllowed(string contentType)
        {
            var allowedTypes = new[]
            {
                // Images
                "image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp", "image/tiff",
                // Documents
                "application/pdf",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/vnd.ms-excel",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "application/vnd.ms-powerpoint",
                "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                // Text files
                "text/plain", "text/csv",
                // Archives
                "application/zip", "application/x-zip-compressed",
                "application/x-rar-compressed", "application/x-7z-compressed",
                // Other common types
                "application/json", "application/xml", "text/xml"
            };

            return allowedTypes.Contains(contentType?.ToLowerInvariant());
        }

        public bool IsFileSizeAllowed(long fileSize)
        {
            // Default max size: 10MB
            var maxSizeBytes = _configuration.GetValue<long>("FileUpload:MaxSizeBytes", 10 * 1024 * 1024);
            return fileSize <= maxSizeBytes && fileSize > 0;
        }

        public string GetPublicIdFromUrl(string url)
        {
            try
            {
                var uri = new Uri(url);
                var path = uri.AbsolutePath;
                
                // Extract public ID from Cloudinary URL
                // Format: /v{version}/{cloud_name}/{resource_type}/{type}/{folder}/{public_id}.{extension}
                var segments = path.Split('/');
                
                if (segments.Length < 3)
                    return string.Empty;

                // Find the version segment (starts with 'v')
                var versionIndex = -1;
                for (int i = 0; i < segments.Length; i++)
                {
                    if (segments[i].StartsWith("v") && segments[i].Length > 1 && char.IsDigit(segments[i][1]))
                    {
                        versionIndex = i;
                        break;
                    }
                }

                if (versionIndex == -1 || versionIndex + 3 >= segments.Length)
                    return string.Empty;

                // Get segments after version/{cloud_name}/{resource_type}/
                var publicIdSegments = segments.Skip(versionIndex + 3).ToArray();
                var publicIdWithExtension = string.Join("/", publicIdSegments);
                
                // Remove file extension
                var lastDotIndex = publicIdWithExtension.LastIndexOf('.');
                if (lastDotIndex > 0)
                {
                    return publicIdWithExtension.Substring(0, lastDotIndex);
                }

                return publicIdWithExtension;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error extracting public ID from URL: {Url}", url);
                return string.Empty;
            }
        }
    }
}