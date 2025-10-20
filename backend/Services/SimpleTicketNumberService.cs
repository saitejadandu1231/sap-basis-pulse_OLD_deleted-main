using SapBasisPulse.Api.Data;
using SapBasisPulse.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace SapBasisPulse.Api.Services
{
    public interface ISimpleTicketNumberService
    {
        Task<string> GenerateTicketNumberAsync(Guid supportTypeId, Guid supportCategoryId, Guid? supportSubOptionId, string priority);
    }

    public class SimpleTicketNumberService : ISimpleTicketNumberService
    {
        private readonly AppDbContext _context;

        public SimpleTicketNumberService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<string> GenerateTicketNumberAsync(Guid supportTypeId, Guid supportCategoryId, Guid? supportSubOptionId, string priority)
        {
            // Get short codes from taxonomy
            var supportType = await _context.SupportTypes.FindAsync(supportTypeId);
            var supportCategory = await _context.SupportCategories.FindAsync(supportCategoryId);
            var supportSubOption = supportSubOptionId.HasValue 
                ? await _context.SupportSubOptions.FindAsync(supportSubOptionId.Value) 
                : null;

            if (supportType == null || supportCategory == null)
            {
                throw new ArgumentException("Invalid support type or category");
            }

            // Build the prefix: SupportType + Category + SubOption + Priority + MonthYear
            var prefix = $"{supportType.ShortCode}{supportCategory.ShortCode}";
            
            if (supportSubOption != null && !string.IsNullOrEmpty(supportSubOption.ShortCode))
            {
                prefix += supportSubOption.ShortCode;
            }

            // Add priority code
            var priorityCode = GetPriorityCode(priority);
            prefix += priorityCode;

            // Add month and year (MMYY format)
            var now = DateTime.UtcNow;
            var monthYear = now.ToString("MMyy"); // Example: 1025 for October 2025
            prefix += monthYear;

            // Get the next sequence number for this year
            var currentYear = now.Year;
            var sequenceNumber = await GetNextSequenceNumberAsync(currentYear);

            // Format: PREFIX + 5-digit sequence (00001, 00002, etc.)
            var ticketNumber = $"{prefix}{sequenceNumber:D5}";

            return ticketNumber;
        }

        private string GetPriorityCode(string priority)
        {
            return priority?.ToUpper() switch
            {
                "HIGH" => "H",
                "MEDIUM" => "M",
                "LOW" => "L",
                "CRITICAL" => "C",
                "URGENT" => "U",
                _ => "M" // Default to Medium
            };
        }

        private async Task<int> GetNextSequenceNumberAsync(int year)
        {
            // Create or get the sequence counter for this year
            var sequenceRecord = await _context.TicketSequences
                .FirstOrDefaultAsync(ts => ts.Year == year);

            if (sequenceRecord == null)
            {
                // First ticket of the year
                sequenceRecord = new TicketSequence
                {
                    Year = year,
                    LastSequenceNumber = 1,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.TicketSequences.Add(sequenceRecord);
            }

            var currentSequence = sequenceRecord.LastSequenceNumber;
            sequenceRecord.LastSequenceNumber++;
            sequenceRecord.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return currentSequence;
        }
    }
}