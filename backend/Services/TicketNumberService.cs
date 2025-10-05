using Microsoft.EntityFrameworkCore;
using SapBasisPulse.Api.Data;
using SapBasisPulse.Api.Entities;
using System.Text.RegularExpressions;

namespace SapBasisPulse.Api.Services
{
    public interface ITicketNumberService
    {
        Task<string> GenerateTicketNumberAsync(Guid supportTypeId, Guid supportCategoryId, Guid? supportSubOptionId);
        Task<string> PreviewTicketNumberAsync(string template, string dateFormat, string sequenceFormat, 
            Guid? supportTypeId = null, Guid? supportCategoryId = null, Guid? supportSubOptionId = null);
    }

    public class TicketNumberService : ITicketNumberService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<TicketNumberService> _logger;

        public TicketNumberService(AppDbContext context, ILogger<TicketNumberService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<string> GenerateTicketNumberAsync(Guid supportTypeId, Guid supportCategoryId, Guid? supportSubOptionId)
        {
            try
            {
                // Find the best matching template based on priority
                var template = await FindBestTemplateAsync(supportTypeId, supportCategoryId, supportSubOptionId);
                
                if (template == null)
                {
                    _logger.LogWarning("No ticket number template found for SupportType: {supportTypeId}, Category: {supportCategoryId}, SubOption: {supportSubOptionId}", 
                        supportTypeId, supportCategoryId, supportSubOptionId);
                    
                    // Fallback to default template or create a basic one
                    template = await _context.TicketNumberTemplates
                        .FirstOrDefaultAsync(t => t.IsDefault && t.IsActive);
                    
                    if (template == null)
                    {
                        _logger.LogError("No default ticket number template found. Using hardcoded fallback.");
                        return await GenerateFallbackTicketNumber();
                    }
                }

                // Generate ticket number using the template
                var ticketNumber = await GenerateFromTemplateAsync(template, supportTypeId, supportCategoryId, supportSubOptionId);
                
                // Update the sequence counter atomically
                await UpdateSequenceCounterAsync(template.Id);
                
                return ticketNumber;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating ticket number for SupportType: {supportTypeId}, Category: {supportCategoryId}, SubOption: {supportSubOptionId}", 
                    supportTypeId, supportCategoryId, supportSubOptionId);
                
                // Fallback to basic ticket number
                return await GenerateFallbackTicketNumber();
            }
        }

        public async Task<string> PreviewTicketNumberAsync(string template, string dateFormat, string sequenceFormat, 
            Guid? supportTypeId = null, Guid? supportCategoryId = null, Guid? supportSubOptionId = null)
        {
            try
            {
                var result = template;
                var now = DateTime.UtcNow;

                // Replace date placeholder
                if (result.Contains("{Date}"))
                {
                    result = result.Replace("{Date}", now.ToString(dateFormat));
                }

                // Replace sequence placeholder
                if (result.Contains("{Sequence}"))
                {
                    var sampleSequence = 1;
                    result = result.Replace("{Sequence}", sampleSequence.ToString(sequenceFormat));
                }

                // Replace support type placeholder
                if (result.Contains("{SupportType}") && supportTypeId.HasValue)
                {
                    var supportType = await _context.SupportTypes.FindAsync(supportTypeId.Value);
                    var shortName = CreateShortName(supportType?.Name ?? "Unknown");
                    result = result.Replace("{SupportType}", shortName);
                }
                else if (result.Contains("{SupportType}"))
                {
                    result = result.Replace("{SupportType}", "TYPE");
                }

                // Replace category placeholder
                if (result.Contains("{Category}") && supportCategoryId.HasValue)
                {
                    var category = await _context.SupportCategories.FindAsync(supportCategoryId.Value);
                    var shortName = CreateShortName(category?.Name ?? "Unknown");
                    result = result.Replace("{Category}", shortName);
                }
                else if (result.Contains("{Category}"))
                {
                    result = result.Replace("{Category}", "CAT");
                }

                // Replace sub-type placeholder
                if (result.Contains("{SubType}") && supportSubOptionId.HasValue)
                {
                    var subOption = await _context.SupportSubOptions.FindAsync(supportSubOptionId.Value);
                    var shortName = CreateShortName(subOption?.Name ?? "Unknown");
                    result = result.Replace("{SubType}", shortName);
                }
                else if (result.Contains("{SubType}"))
                {
                    result = result.Replace("{SubType}", "SUB");
                }

                return result.ToUpper();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error previewing ticket number with template: {template}", template);
                return "PREVIEW-ERROR";
            }
        }

        private async Task<TicketNumberTemplate?> FindBestTemplateAsync(Guid supportTypeId, Guid supportCategoryId, Guid? supportSubOptionId)
        {
            // Find templates ordered by priority (descending) and specificity
            var templates = await _context.TicketNumberTemplates
                .Where(t => t.IsActive)
                .OrderByDescending(t => t.Priority)
                .ThenByDescending(t => t.SupportSubOptionId != null ? 3 : 
                                     t.SupportCategoryId != null ? 2 : 
                                     t.SupportTypeId != null ? 1 : 0)
                .ToListAsync();

            // Find the most specific match
            foreach (var template in templates)
            {
                if (IsTemplateMatch(template, supportTypeId, supportCategoryId, supportSubOptionId))
                {
                    return template;
                }
            }

            return null;
        }

        private bool IsTemplateMatch(TicketNumberTemplate template, Guid supportTypeId, Guid supportCategoryId, Guid? supportSubOptionId)
        {
            // Check if template matches the given criteria
            if (template.SupportSubOptionId.HasValue && template.SupportSubOptionId != supportSubOptionId)
                return false;
                
            if (template.SupportCategoryId.HasValue && template.SupportCategoryId != supportCategoryId)
                return false;
                
            if (template.SupportTypeId.HasValue && template.SupportTypeId != supportTypeId)
                return false;

            return true;
        }

        private async Task<string> GenerateFromTemplateAsync(TicketNumberTemplate template, Guid supportTypeId, Guid supportCategoryId, Guid? supportSubOptionId)
        {
            var result = template.Template;
            var now = DateTime.UtcNow;

            // Replace date placeholder
            if (result.Contains("{Date}"))
            {
                result = result.Replace("{Date}", now.ToString(template.DateFormat));
            }

            // Replace sequence placeholder
            if (result.Contains("{Sequence}"))
            {
                var nextSequence = template.CurrentSequence + 1;
                result = result.Replace("{Sequence}", nextSequence.ToString(template.SequenceFormat));
            }

            // Replace support type placeholder
            if (result.Contains("{SupportType}"))
            {
                var supportType = await _context.SupportTypes.FindAsync(supportTypeId);
                var shortName = CreateShortName(supportType?.Name ?? "Unknown");
                result = result.Replace("{SupportType}", shortName);
            }

            // Replace category placeholder
            if (result.Contains("{Category}"))
            {
                var category = await _context.SupportCategories.FindAsync(supportCategoryId);
                var shortName = CreateShortName(category?.Name ?? "Unknown");
                result = result.Replace("{Category}", shortName);
            }

            // Replace sub-type placeholder
            if (result.Contains("{SubType}") && supportSubOptionId.HasValue)
            {
                var subOption = await _context.SupportSubOptions.FindAsync(supportSubOptionId.Value);
                var shortName = CreateShortName(subOption?.Name ?? "Unknown");
                result = result.Replace("{SubType}", shortName);
            }

            return result.ToUpper();
        }

        private string CreateShortName(string name)
        {
            if (string.IsNullOrWhiteSpace(name))
                return "UNK";

            // Remove common words and create abbreviation
            var cleanName = name.Replace("Service Request", "SR")
                               .Replace("(SR)", "SR")
                               .Replace(" ", "")
                               .Replace("-", "")
                               .Replace("/", "");

            // Take up to first 5 characters or create acronym
            if (cleanName.Length <= 5)
                return cleanName;

            // Create acronym from words
            var words = name.Split(new[] { ' ', '-', '/' }, StringSplitOptions.RemoveEmptyEntries);
            if (words.Length > 1)
            {
                var acronym = string.Join("", words.Select(w => w.Substring(0, 1)));
                return acronym.Length <= 5 ? acronym : acronym.Substring(0, 5);
            }

            return cleanName.Substring(0, Math.Min(5, cleanName.Length));
        }

        private async Task UpdateSequenceCounterAsync(Guid templateId)
        {
            try
            {
                // Use raw SQL for atomic increment to avoid concurrency issues
                await _context.Database.ExecuteSqlRawAsync(
                    "UPDATE \"TicketNumberTemplates\" SET \"CurrentSequence\" = \"CurrentSequence\" + 1 WHERE \"Id\" = {0}",
                    templateId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating sequence counter for template: {templateId}", templateId);
                // Non-critical error, don't throw
            }
        }

        private async Task<string> GenerateFallbackTicketNumber()
        {
            var now = DateTime.UtcNow;
            var random = new Random();
            return $"TKT-{now:yyyy-MM-dd}-{random.Next(1000, 9999)}";
        }
    }
}