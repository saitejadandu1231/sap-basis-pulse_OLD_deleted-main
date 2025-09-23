using System;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;
using SapBasisPulse.Api.Data;

namespace SapBasisPulse.Api.Utilities
{
    public static class UpdateSrIdentifierFlag
    {
        public static async Task UpdateRequiresSrIdentifierFlagsAsync(AppDbContext context)
        {
            Console.WriteLine("Updating RequiresSrIdentifier flags for Service Requests...");
            
            // Get all support types
            var sapRise = await context.SupportTypes.FirstOrDefaultAsync(t => t.Name == "SAP RISE");
            var sapGrow = await context.SupportTypes.FirstOrDefaultAsync(t => t.Name == "SAP Grow");
            
            if (sapRise != null && sapGrow != null)
            {
                // Update Service Request options for SAP RISE and SAP Grow
                var serviceRequestOptions = await context.SupportSubOptions
                    .Where(s => s.Name == "Service Request (SR)" &&
                           (s.SupportTypeId == sapRise.Id || s.SupportTypeId == sapGrow.Id))
                    .ToListAsync();
                
                foreach (var option in serviceRequestOptions)
                {
                    option.RequiresSrIdentifier = true;
                }
                
                var updated = await context.SaveChangesAsync();
                Console.WriteLine($"Updated {updated} Service Request options to require SR Identifier.");
            }
            else
            {
                Console.WriteLine("Could not find SAP RISE or SAP Grow support types.");
            }
        }
    }
}