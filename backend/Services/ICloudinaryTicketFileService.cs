using Microsoft.AspNetCore.Http;

namespace SapBasisPulse.Api.Services
{
    public interface ICloudinaryTicketFileService
    {
        Task<string> UploadFileAsync(IFormFile file, string folder = "tickets");
        Task<bool> DeleteFileAsync(string fileUrl);
        Task<Stream> GetFileStreamAsync(string fileUrl);
        bool IsFileTypeAllowed(string contentType);
        bool IsFileSizeAllowed(long fileSize);
        string GetPublicIdFromUrl(string url);
    }
}