using System;

namespace SapBasisPulse.Api.Entities
{
    public class MessageAttachment
    {
        public Guid Id { get; set; }
        public Guid MessageId { get; set; }
        public Message Message { get; set; }
        public string FileName { get; set; }
        public string OriginalFileName { get; set; }
        public string ContentType { get; set; }
        public long FileSize { get; set; }
        public string FilePath { get; set; }
        public DateTime UploadedAt { get; set; }
        public Guid UploadedByUserId { get; set; }
        public User UploadedBy { get; set; }
    }
}