using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SapBasisPulse.Api.Data;
using SapBasisPulse.Api.Entities;

namespace SapBasisPulse.Api.Utilities
{
    public static class SeedData
    {
        public static async Task Initialize(IServiceProvider serviceProvider)
        {
            using var context = new AppDbContext(serviceProvider.GetRequiredService<DbContextOptions<AppDbContext>>());
            
            // Check if we already have data
            if (context.SupportTypes.Any())
            {
                Console.WriteLine("Database already seeded with support taxonomy data.");
                return;
            }
            
            Console.WriteLine("Seeding support taxonomy data...");
            
            // Add Support Types
            var saptRise = new SupportType { Id = Guid.NewGuid(), Name = "SAP RISE" };
            var sapGrow = new SupportType { Id = Guid.NewGuid(), Name = "SAP Grow" };
            var onPremNonCatalogue = new SupportType { Id = Guid.NewGuid(), Name = "On-Prem/Non-Catalogue" };
            var migration = new SupportType { Id = Guid.NewGuid(), Name = "Migration" };
            
            context.SupportTypes.AddRange(saptRise, sapGrow, onPremNonCatalogue, migration);
            await context.SaveChangesAsync();
            
            Console.WriteLine("Support types added successfully.");
            
            // Add Support Categories
            var basis = new SupportCategory { Id = Guid.NewGuid(), Name = "BASIS", SupportTypeId = saptRise.Id };
            var db = new SupportCategory { Id = Guid.NewGuid(), Name = "DB", SupportTypeId = saptRise.Id };
            var os = new SupportCategory { Id = Guid.NewGuid(), Name = "OS", SupportTypeId = saptRise.Id };
            var network = new SupportCategory { Id = Guid.NewGuid(), Name = "Network", SupportTypeId = saptRise.Id };
            
            // Also add categories to other support types
            var basis2 = new SupportCategory { Id = Guid.NewGuid(), Name = "BASIS", SupportTypeId = sapGrow.Id };
            var db2 = new SupportCategory { Id = Guid.NewGuid(), Name = "DB", SupportTypeId = sapGrow.Id };
            var os2 = new SupportCategory { Id = Guid.NewGuid(), Name = "OS", SupportTypeId = sapGrow.Id };
            var network2 = new SupportCategory { Id = Guid.NewGuid(), Name = "Network", SupportTypeId = sapGrow.Id };
            
            var basis3 = new SupportCategory { Id = Guid.NewGuid(), Name = "BASIS", SupportTypeId = onPremNonCatalogue.Id };
            var db3 = new SupportCategory { Id = Guid.NewGuid(), Name = "DB", SupportTypeId = onPremNonCatalogue.Id };
            var os3 = new SupportCategory { Id = Guid.NewGuid(), Name = "OS", SupportTypeId = onPremNonCatalogue.Id };
            var network3 = new SupportCategory { Id = Guid.NewGuid(), Name = "Network", SupportTypeId = onPremNonCatalogue.Id };
            
            var basis4 = new SupportCategory { Id = Guid.NewGuid(), Name = "BASIS", SupportTypeId = migration.Id };
            var db4 = new SupportCategory { Id = Guid.NewGuid(), Name = "DB", SupportTypeId = migration.Id };
            var os4 = new SupportCategory { Id = Guid.NewGuid(), Name = "OS", SupportTypeId = migration.Id };
            var network4 = new SupportCategory { Id = Guid.NewGuid(), Name = "Network", SupportTypeId = migration.Id };
            
            context.SupportCategories.AddRange(
                basis, db, os, network, 
                basis2, db2, os2, network2, 
                basis3, db3, os3, network3,
                basis4, db4, os4, network4
            );
            await context.SaveChangesAsync();
            
            Console.WriteLine("Support categories added successfully.");
            
            // Add Support SubOptions
            var serviceRequest = new SupportSubOption { Id = Guid.NewGuid(), Name = "Service Request (SR)", SupportTypeId = saptRise.Id, RequiresSrIdentifier = true };
            var incident = new SupportSubOption { Id = Guid.NewGuid(), Name = "Incident", SupportTypeId = saptRise.Id, RequiresSrIdentifier = false };
            
            var serviceRequest2 = new SupportSubOption { Id = Guid.NewGuid(), Name = "Service Request (SR)", SupportTypeId = sapGrow.Id, RequiresSrIdentifier = true };
            var incident2 = new SupportSubOption { Id = Guid.NewGuid(), Name = "Incident", SupportTypeId = sapGrow.Id, RequiresSrIdentifier = false };
            
            var serviceRequest3 = new SupportSubOption { Id = Guid.NewGuid(), Name = "Service Request (SR)", SupportTypeId = onPremNonCatalogue.Id, RequiresSrIdentifier = false };
            var incident3 = new SupportSubOption { Id = Guid.NewGuid(), Name = "Incident", SupportTypeId = onPremNonCatalogue.Id, RequiresSrIdentifier = false };
            
            var serviceRequest4 = new SupportSubOption { Id = Guid.NewGuid(), Name = "Service Request (SR)", SupportTypeId = migration.Id, RequiresSrIdentifier = false };
            var incident4 = new SupportSubOption { Id = Guid.NewGuid(), Name = "Incident", SupportTypeId = migration.Id, RequiresSrIdentifier = false };
            
            context.SupportSubOptions.AddRange(
                serviceRequest, incident,
                serviceRequest2, incident2,
                serviceRequest3, incident3,
                serviceRequest4, incident4
            );
            await context.SaveChangesAsync();
            
            Console.WriteLine("Support sub-options added successfully.");
            
            Console.WriteLine("Seeding complete.");
        }
    }
}