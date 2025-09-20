using Microsoft.EntityFrameworkCore;
using SapBasisPulse.Api.Data;
using SapBasisPulse.Api.DTOs;
using SapBasisPulse.Api.Entities;

namespace SapBasisPulse.Api.Services
{
    public class SupportTaxonomyService : ISupportTaxonomyService
    {
        private readonly AppDbContext _context;
        public SupportTaxonomyService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<SupportTypeDto>> GetAllSupportTypesAsync()
        {
            return await _context.SupportTypes
                .Include(t => t.Categories)
                .Include(t => t.SubOptions)
                .Select(t => new SupportTypeDto
                {
                    Id = t.Id,
                    Name = t.Name,
                    Categories = t.Categories.Select(c => new SupportCategoryDto { Id = c.Id, Name = c.Name }).ToList(),
                    SubOptions = t.SubOptions.Select(s => new SupportSubOptionDto { Id = s.Id, Name = s.Name }).ToList()
                })
                .ToListAsync();
        }

        public async Task<SupportTypeDto?> GetSupportTypeByIdAsync(Guid id)
        {
            var t = await _context.SupportTypes
                .Include(x => x.Categories)
                .Include(x => x.SubOptions)
                .FirstOrDefaultAsync(x => x.Id == id);
            if (t == null) return null;
            return new SupportTypeDto
            {
                Id = t.Id,
                Name = t.Name,
                Categories = t.Categories.Select(c => new SupportCategoryDto { Id = c.Id, Name = c.Name }).ToList(),
                SubOptions = t.SubOptions.Select(s => new SupportSubOptionDto { Id = s.Id, Name = s.Name }).ToList()
            };
        }

        public async Task<SupportTypeDto> CreateSupportTypeAsync(CreateSupportTypeDto dto)
        {
            var type = new SupportType { Id = Guid.NewGuid(), Name = dto.Name };
            _context.SupportTypes.Add(type);
            await _context.SaveChangesAsync();
            return new SupportTypeDto { Id = type.Id, Name = type.Name, Categories = new(), SubOptions = new() };
        }

        public async Task<SupportCategoryDto> CreateSupportCategoryAsync(CreateSupportCategoryDto dto)
        {
            var cat = new SupportCategory { Id = Guid.NewGuid(), Name = dto.Name, SupportTypeId = dto.SupportTypeId };
            _context.SupportCategories.Add(cat);
            await _context.SaveChangesAsync();
            return new SupportCategoryDto { Id = cat.Id, Name = cat.Name };
        }

        public async Task<SupportSubOptionDto> CreateSupportSubOptionAsync(CreateSupportSubOptionDto dto)
        {
            var sub = new SupportSubOption { Id = Guid.NewGuid(), Name = dto.Name, SupportTypeId = dto.SupportTypeId };
            _context.SupportSubOptions.Add(sub);
            await _context.SaveChangesAsync();
            return new SupportSubOptionDto { Id = sub.Id, Name = sub.Name };
        }
    }
}
