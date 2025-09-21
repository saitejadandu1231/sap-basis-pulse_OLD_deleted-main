using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
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
                
                Console.WriteLine("Adding Service Request Identifiers...");
                
                // Check if the identifiers already exist
                var existingIdentifiers = dbContext.ServiceRequestIdentifiers
                    .Where(sri => sri.Identifier == "SR-2024-001" || sri.Identifier == "SR-2024-002")
                    .ToDictionary(sri => sri.Identifier);
                
                // Define the identifiers we want to ensure exist
                var requestedIdentifiers = new[]
                {
                    new { Identifier = "SR-2024-001", Task = "SAP Basis System Support" },
                    new { Identifier = "SR-2024-002", Task = "SAP Security Configuration" }
                };
                
                int added = 0;
                int updated = 0;
                
                foreach (var item in requestedIdentifiers)
                {
                    if (existingIdentifiers.TryGetValue(item.Identifier, out var existingIdentifier))
                    {
                        // Update if necessary
                        if (existingIdentifier.Task != item.Task || !existingIdentifier.IsActive)
                        {
                            existingIdentifier.Task = item.Task;
                            existingIdentifier.IsActive = true;
                            existingIdentifier.UpdatedAt = DateTime.UtcNow;
                            updated++;
                        }
                    }
                    else
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
                }
                
                dbContext.SaveChanges();
                
                Console.WriteLine($"Service Request Identifiers: {added} added, {updated} updated.");
                
                // List all identifiers
                var allIdentifiers = dbContext.ServiceRequestIdentifiers.ToList();
                Console.WriteLine("\nCurrent Service Request Identifiers:");
                foreach (var sri in allIdentifiers)
                {
                    Console.WriteLine($"ID: {sri.Id}, Identifier: {sri.Identifier}, Task: {sri.Task}, Active: {sri.IsActive}");
                }
                Console.WriteLine();
            }
        }
    }
}