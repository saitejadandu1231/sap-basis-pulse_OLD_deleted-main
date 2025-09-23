using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SapBasisPulse.Api.Data;

namespace SapBasisPulse.Api.Services
{
    public interface IServiceRequestValidationService
    {
        Task<ServiceRequestValidationResult> ValidateServiceRequestIdentifierAsync(string identifier);
        Task<bool> IsServiceRequestIdentifierValidAsync(string identifier);
    }

    public class ServiceRequestValidationResult
    {
        public bool IsValid { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? Identifier { get; set; }
        public string? Task { get; set; }
    }

    public class ServiceRequestValidationService : IServiceRequestValidationService
    {
        private readonly AppDbContext _context;

        public ServiceRequestValidationService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<ServiceRequestValidationResult> ValidateServiceRequestIdentifierAsync(string identifier)
        {
            if (string.IsNullOrWhiteSpace(identifier))
            {
                return new ServiceRequestValidationResult
                {
                    IsValid = false,
                    Message = "Service Request Identifier is required."
                };
            }

            // Clean the identifier (remove extra spaces, convert to uppercase if needed)
            var cleanedIdentifier = identifier.Trim();

            try
            {
                // Check if the identifier exists in the database and is active
                var serviceRequestIdentifier = await _context.ServiceRequestIdentifiers
                    .FirstOrDefaultAsync(sri => sri.Identifier == cleanedIdentifier && sri.IsActive);

                if (serviceRequestIdentifier != null)
                {
                    return new ServiceRequestValidationResult
                    {
                        IsValid = true,
                        Message = $"Valid Service Request: {serviceRequestIdentifier.Task}",
                        Identifier = serviceRequestIdentifier.Identifier,
                        Task = serviceRequestIdentifier.Task
                    };
                }
                else
                {
                    // Check if identifier exists but is inactive
                    var inactiveIdentifier = await _context.ServiceRequestIdentifiers
                        .FirstOrDefaultAsync(sri => sri.Identifier == cleanedIdentifier);

                    if (inactiveIdentifier != null)
                    {
                        return new ServiceRequestValidationResult
                        {
                            IsValid = false,
                            Message = "This Service Request Identifier is no longer active."
                        };
                    }
                    else
                    {
                        return new ServiceRequestValidationResult
                        {
                            IsValid = false,
                            Message = "Service Request Identifier not found. Please check the identifier and try again."
                        };
                    }
                }
            }
            catch (Exception ex)
            {
                // Log the exception (you might want to use a logging framework)
                Console.WriteLine($"Error validating Service Request Identifier: {ex.Message}");
                
                return new ServiceRequestValidationResult
                {
                    IsValid = false,
                    Message = "An error occurred while validating the Service Request Identifier. Please try again."
                };
            }
        }

        public async Task<bool> IsServiceRequestIdentifierValidAsync(string identifier)
        {
            var result = await ValidateServiceRequestIdentifierAsync(identifier);
            return result.IsValid;
        }
    }
}