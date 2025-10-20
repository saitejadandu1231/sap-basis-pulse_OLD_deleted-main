using System;

namespace SapBasisPulse.Api.DTOs
{
    public class ErrorResponseDto
    {
        public string Message { get; set; }
        public string? Code { get; set; }
        public string? Details { get; set; }
        public DateTime Timestamp { get; set; }
        public string? TraceId { get; set; }

        public ErrorResponseDto(string message, string? code = null, string? details = null)
        {
            Message = message;
            Code = code;
            Details = details;
            Timestamp = DateTime.UtcNow;
        }
    }

    public class ValidationErrorResponseDto : ErrorResponseDto
    {
        public Dictionary<string, string[]> Errors { get; set; }

        public ValidationErrorResponseDto(string message, Dictionary<string, string[]> errors) 
            : base(message, "VALIDATION_ERROR")
        {
            Errors = errors;
        }
    }
}