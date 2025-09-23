using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using SapBasisPulse.Api.Data;
using SapBasisPulse.Api.Entities;

namespace SapBasisPulse.Api.Utilities
{
    public static class ServiceRequestIdentifierManager
    {
        public static void AddOrUpdateServiceRequestIdentifiers(IServiceProvider serviceProvider)
        {
            using (var scope = serviceProvider.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();
                
                Console.WriteLine("Checking Service Request Identifiers...");
                
                // Get all existing identifiers from the database
                var allExistingIdentifiers = dbContext.ServiceRequestIdentifiers.ToList();
                
                // If database already has data, don't add from configuration
                if (allExistingIdentifiers.Any())
                {
                    Console.WriteLine($"Database already contains {allExistingIdentifiers.Count} Service Request Identifiers. Skipping configuration seeding.");
                    
                    // List all identifiers
                    Console.WriteLine("\nCurrent Service Request Identifiers from Database:");
                    foreach (var sri in allExistingIdentifiers.Where(x => x.IsActive))
                    {
                        Console.WriteLine($"ID: {sri.Id}, Identifier: {sri.Identifier}, Task: {sri.Task}, Active: {sri.IsActive}");
                    }
                    Console.WriteLine();
                    return;
                }
                
                // Only seed from configuration if database is empty
                Console.WriteLine("Database is empty. Seeding Service Request Identifiers from configuration...");
                
                // Get identifiers from configuration or use default ones
                var requestedIdentifiers = GetServiceRequestIdentifiersFromConfig(configuration);
                
                int added = 0;
                
                foreach (var item in requestedIdentifiers)
                {
                    // Add new identifier
                    dbContext.ServiceRequestIdentifiers.Add(new ServiceRequestIdentifier
                    {
                        Id = Guid.NewGuid(),
                        Identifier = item.Identifier,
                        Task = item.Task,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    });
                    added++;
                }
                
                if (added > 0)
                {
                    dbContext.SaveChanges();
                    Console.WriteLine($"Service Request Identifiers: {added} added from configuration.");
                }
                
                // List all identifiers
                var allIdentifiers = dbContext.ServiceRequestIdentifiers.ToList();
                Console.WriteLine("\nFinal Service Request Identifiers:");
                foreach (var sri in allIdentifiers.Where(x => x.IsActive))
                {
                    Console.WriteLine($"ID: {sri.Id}, Identifier: {sri.Identifier}, Task: {sri.Task}, Active: {sri.IsActive}");
                }
                Console.WriteLine();
            }
        }

        private static ServiceRequestIdentifierConfig[] GetServiceRequestIdentifiersFromConfig(IConfiguration configuration)
        {
            // Try to get from configuration first, fall back to defaults
            var configSection = configuration.GetSection("ServiceRequestIdentifiers");
            
            if (configSection.Exists() && configSection.GetChildren().Any())
            {
                return configSection.GetChildren()
                    .Select(c => new ServiceRequestIdentifierConfig
                    { 
                        Identifier = c["Identifier"] ?? "", 
                        Task = c["Task"] ?? "" 
                    })
                    .ToArray();
            }
            
            // Default identifiers if none configured
            return new ServiceRequestIdentifierConfig[]
            {
                new ServiceRequestIdentifierConfig { Identifier = "SR-2024-001", Task = "SAP Basis System Support" },
                new ServiceRequestIdentifierConfig { Identifier = "SR-2024-002", Task = "SAP Security Configuration" },
                new ServiceRequestIdentifierConfig { Identifier = "SR-2024-003", Task = "SAP Performance Optimization" },
                new ServiceRequestIdentifierConfig { Identifier = "SR-2024-004", Task = "SAP Database Management" },
                new ServiceRequestIdentifierConfig { Identifier = "SR-2024-005", Task = "SAP Transport Management" },
                new ServiceRequestIdentifierConfig { Identifier = "SR-2024-006", Task = "SAP User Management" },
                new ServiceRequestIdentifierConfig { Identifier = "SR-2024-007", Task = "SAP System Monitoring" },
                new ServiceRequestIdentifierConfig { Identifier = "SR-2024-008", Task = "SAP Backup and Recovery" },
                new ServiceRequestIdentifierConfig { Identifier = "SR-2024-009", Task = "SAP Interface Management" },
                new ServiceRequestIdentifierConfig { Identifier = "SR-2024-010", Task = "SAP Upgrade and Migration" }
            };
        }
    }

    public class ServiceRequestIdentifierConfig
    {
        public string Identifier { get; set; } = string.Empty;
        public string Task { get; set; } = string.Empty;
    }
}