using Microsoft.EntityFrameworkCore;
using SapBasisPulse.Api.DTOs;
using System.Net;
using System.Text.Json;

namespace SapBasisPulse.Api.Middleware
{
    public class GlobalExceptionHandlingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<GlobalExceptionHandlingMiddleware> _logger;
        private readonly IWebHostEnvironment _environment;

        public GlobalExceptionHandlingMiddleware(
            RequestDelegate next, 
            ILogger<GlobalExceptionHandlingMiddleware> logger,
            IWebHostEnvironment environment)
        {
            _next = next;
            _logger = logger;
            _environment = environment;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An unhandled exception occurred during request processing");
                await HandleExceptionAsync(context, ex);
            }
        }

        private async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/json";
            
            var response = new ErrorResponseDto("An error occurred while processing your request.")
            {
                TraceId = context.TraceIdentifier
            };

            // Map specific exception types to user-friendly messages and status codes
            switch (exception)
            {
                case ArgumentNullException nullEx:
                    context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                    response.Message = "Required information is missing.";
                    response.Code = "MISSING_REQUIRED_FIELD";
                    if (!string.IsNullOrEmpty(nullEx.ParamName))
                    {
                        response.Details = $"The field '{nullEx.ParamName}' is required.";
                    }
                    break;

                case ArgumentException argEx:
                    context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                    response.Message = "Invalid input provided.";
                    response.Code = "INVALID_INPUT";
                    if (!string.IsNullOrEmpty(argEx.ParamName))
                    {
                        response.Details = $"The parameter '{argEx.ParamName}' is invalid.";
                    }
                    break;

                case UnauthorizedAccessException:
                    context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
                    response.Message = "You are not authorized to perform this action.";
                    response.Code = "UNAUTHORIZED";
                    break;

                case KeyNotFoundException:
                    context.Response.StatusCode = (int)HttpStatusCode.NotFound;
                    response.Message = "The requested resource was not found.";
                    response.Code = "NOT_FOUND";
                    break;

                case InvalidOperationException invOpEx:
                    context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                    response.Message = "The operation cannot be completed at this time.";
                    response.Code = "INVALID_OPERATION";
                    // Only include specific details for certain known cases
                    if (invOpEx.Message.Contains("already exists", StringComparison.OrdinalIgnoreCase))
                    {
                        response.Details = "A record with this information already exists.";
                    }
                    else if (invOpEx.Message.Contains("not found", StringComparison.OrdinalIgnoreCase))
                    {
                        response.Details = "The requested item could not be found.";
                    }
                    break;

                case DbUpdateException dbEx:
                    context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                    response.Message = "Unable to save your changes.";
                    response.Code = "DATABASE_ERROR";
                    
                    // Check for common database constraint violations
                    if (dbEx.InnerException?.Message.Contains("duplicate key", StringComparison.OrdinalIgnoreCase) == true ||
                        dbEx.InnerException?.Message.Contains("unique constraint", StringComparison.OrdinalIgnoreCase) == true)
                    {
                        response.Details = "A record with this information already exists.";
                    }
                    else if (dbEx.InnerException?.Message.Contains("foreign key", StringComparison.OrdinalIgnoreCase) == true)
                    {
                        response.Details = "This action cannot be completed because it would affect related data.";
                    }
                    break;

                case TimeoutException:
                    context.Response.StatusCode = (int)HttpStatusCode.RequestTimeout;
                    response.Message = "The request took too long to process. Please try again.";
                    response.Code = "TIMEOUT";
                    break;

                case NotImplementedException:
                    context.Response.StatusCode = (int)HttpStatusCode.NotImplemented;
                    response.Message = "This feature is not yet available.";
                    response.Code = "NOT_IMPLEMENTED";
                    break;

                default:
                    context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                    response.Message = "An unexpected error occurred. Please try again later.";
                    response.Code = "INTERNAL_ERROR";
                    break;
            }

            // In development, include more details for debugging
            if (_environment.IsDevelopment())
            {
                response.Details = exception.Message;
                // Optionally include stack trace in development
                // response.Details += $"\n\nStack Trace:\n{exception.StackTrace}";
            }

            var jsonResponse = JsonSerializer.Serialize(response, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            await context.Response.WriteAsync(jsonResponse);
        }
    }
}