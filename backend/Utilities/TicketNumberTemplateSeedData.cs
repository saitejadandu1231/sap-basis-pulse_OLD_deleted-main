using Microsoft.EntityFrameworkCore;
using SapBasisPulse.Api.Data;
using SapBasisPulse.Api.Entities;

namespace SapBasisPulse.Api.Utilities
{
    public static class TicketNumberTemplateSeedData
    {
        public static async Task SeedDefaultTemplatesAsync(AppDbContext context)
        {
            // Skip if templates already exist
            if (await context.TicketNumberTemplates.AnyAsync())
            {
                Console.WriteLine("TicketNumberTemplates already seeded.");
                return;
            }

            Console.WriteLine("Seeding default ticket number templates...");

            // Get the first admin user to use as creator, or create a system user reference
            var adminUser = await context.Users
                .FirstOrDefaultAsync(u => u.Role == UserRole.Admin);

            if (adminUser == null)
            {
                Console.WriteLine("Warning: No admin user found. Creating system user for template seeding.");
                // We'll use a known GUID that should exist or create a minimal system reference
                // For now, let's skip seeding if no admin exists
                Console.WriteLine("Skipping template seeding until an admin user exists.");
                return;
            }

            var templates = new List<TicketNumberTemplate>
            {
                new TicketNumberTemplate
                {
                    Id = Guid.NewGuid(),
                    Name = "Default Template",
                    Description = "Default fallback template for all ticket types",
                    Template = "{SupportType}-{Date}-{Sequence}",
                    Priority = 0,
                    IsActive = true,
                    IsDefault = true,
                    CurrentSequence = 0,
                    DateFormat = "yyyy-MM-dd",
                    SequenceFormat = "0000",
                    CreatedAt = DateTime.UtcNow,
                    CreatedByUserId = adminUser.Id
                },
                new TicketNumberTemplate
                {
                    Id = Guid.NewGuid(),
                    Name = "Service Request Template",
                    Description = "Template for Service Request tickets with SR identifier",
                    Template = "SR-{Category}-{SubType}-{Date}-{Sequence}",
                    Priority = 100,
                    IsActive = true,
                    IsDefault = false,
                    CurrentSequence = 0,
                    DateFormat = "yyyyMMdd",
                    SequenceFormat = "000",
                    CreatedAt = DateTime.UtcNow,
                    CreatedByUserId = adminUser.Id
                },
                new TicketNumberTemplate
                {
                    Id = Guid.NewGuid(),
                    Name = "Incident Template",
                    Description = "Template for Incident tickets",
                    Template = "INC-{SupportType}-{Category}-{Date}-{Sequence}",
                    Priority = 90,
                    IsActive = true,
                    IsDefault = false,
                    CurrentSequence = 0,
                    DateFormat = "yyyyMMdd",
                    SequenceFormat = "0000",
                    CreatedAt = DateTime.UtcNow,
                    CreatedByUserId = adminUser.Id
                },
                new TicketNumberTemplate
                {
                    Id = Guid.NewGuid(),
                    Name = "Migration Template",
                    Description = "Template for Migration support requests",
                    Template = "MIG-{Category}-{Date}-{Sequence}",
                    Priority = 95,
                    IsActive = true,
                    IsDefault = false,
                    CurrentSequence = 0,
                    DateFormat = "yyyy-MM",
                    SequenceFormat = "00000",
                    CreatedAt = DateTime.UtcNow,
                    CreatedByUserId = adminUser.Id
                }
            };

            context.TicketNumberTemplates.AddRange(templates);
            await context.SaveChangesAsync();

            Console.WriteLine($"Successfully seeded {templates.Count} ticket number templates.");
        }
    }
}