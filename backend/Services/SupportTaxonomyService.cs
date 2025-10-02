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
                    Description = t.Description,
                    Categories = t.Categories.Select(c => new SupportCategoryDto { Id = c.Id, Name = c.Name, Description = c.Description, SupportTypeId = c.SupportTypeId }).ToList(),
                    SubOptions = t.SubOptions.Select(s => new SupportSubOptionDto { Id = s.Id, Name = s.Name, Description = s.Description, SupportTypeId = s.SupportTypeId, RequiresSrIdentifier = s.RequiresSrIdentifier }).ToList()
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
                Description = t.Description,
                Categories = t.Categories.Select(c => new SupportCategoryDto { Id = c.Id, Name = c.Name, Description = c.Description, SupportTypeId = c.SupportTypeId }).ToList(),
                SubOptions = t.SubOptions.Select(s => new SupportSubOptionDto { Id = s.Id, Name = s.Name, Description = s.Description, SupportTypeId = s.SupportTypeId, RequiresSrIdentifier = s.RequiresSrIdentifier }).ToList()
            };
        }

        public async Task<SupportTypeDto> CreateSupportTypeAsync(CreateSupportTypeDto dto)
        {
            var type = new SupportType { Id = Guid.NewGuid(), Name = dto.Name, Description = dto.Description };
            _context.SupportTypes.Add(type);
            await _context.SaveChangesAsync();
            return new SupportTypeDto { Id = type.Id, Name = type.Name, Description = type.Description, Categories = new(), SubOptions = new() };
        }

        public async Task<SupportTypeDto> UpdateSupportTypeAsync(Guid id, UpdateSupportTypeDto dto)
        {
            var type = await _context.SupportTypes.FindAsync(id);
            if (type == null) throw new KeyNotFoundException("Support type not found");

            type.Name = dto.Name;
            type.Description = dto.Description;
            await _context.SaveChangesAsync();

            return await GetSupportTypeByIdAsync(id) ?? throw new InvalidOperationException("Failed to retrieve updated support type");
        }

        public async Task<bool> DeleteSupportTypeAsync(Guid id)
        {
            var type = await _context.SupportTypes.FindAsync(id);
            if (type == null) return false;

            _context.SupportTypes.Remove(type);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<SupportCategoryDto> CreateSupportCategoryAsync(CreateSupportCategoryDto dto)
        {
            var cat = new SupportCategory { Id = Guid.NewGuid(), Name = dto.Name, Description = dto.Description, SupportTypeId = dto.SupportTypeId };
            _context.SupportCategories.Add(cat);
            await _context.SaveChangesAsync();
            return new SupportCategoryDto { Id = cat.Id, Name = cat.Name, Description = cat.Description, SupportTypeId = cat.SupportTypeId };
        }

        public async Task<SupportCategoryDto> UpdateSupportCategoryAsync(Guid id, UpdateSupportCategoryDto dto)
        {
            var category = await _context.SupportCategories.FindAsync(id);
            if (category == null) throw new KeyNotFoundException("Support category not found");

            category.Name = dto.Name;
            category.Description = dto.Description;
            category.SupportTypeId = dto.SupportTypeId;
            await _context.SaveChangesAsync();

            return new SupportCategoryDto { Id = category.Id, Name = category.Name, Description = category.Description, SupportTypeId = category.SupportTypeId };
        }

        public async Task<bool> DeleteSupportCategoryAsync(Guid id)
        {
            var category = await _context.SupportCategories.FindAsync(id);
            if (category == null) return false;

            _context.SupportCategories.Remove(category);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<SupportSubOptionDto> CreateSupportSubOptionAsync(CreateSupportSubOptionDto dto)
        {
            var sub = new SupportSubOption { Id = Guid.NewGuid(), Name = dto.Name, Description = dto.Description, SupportTypeId = dto.SupportTypeId, RequiresSrIdentifier = dto.RequiresSrIdentifier };
            _context.SupportSubOptions.Add(sub);
            await _context.SaveChangesAsync();
            return new SupportSubOptionDto { Id = sub.Id, Name = sub.Name, Description = sub.Description, SupportTypeId = sub.SupportTypeId, RequiresSrIdentifier = sub.RequiresSrIdentifier };
        }

        public async Task<SupportSubOptionDto> UpdateSupportSubOptionAsync(Guid id, UpdateSupportSubOptionDto dto)
        {
            var subOption = await _context.SupportSubOptions.FindAsync(id);
            if (subOption == null) throw new KeyNotFoundException("Support sub-option not found");

            subOption.Name = dto.Name;
            subOption.Description = dto.Description;
            subOption.SupportTypeId = dto.SupportTypeId;
            subOption.RequiresSrIdentifier = dto.RequiresSrIdentifier;
            await _context.SaveChangesAsync();

            return new SupportSubOptionDto { Id = subOption.Id, Name = subOption.Name, Description = subOption.Description, SupportTypeId = subOption.SupportTypeId, RequiresSrIdentifier = subOption.RequiresSrIdentifier };
        }

        public async Task<bool> DeleteSupportSubOptionAsync(Guid id)
        {
            var subOption = await _context.SupportSubOptions.FindAsync(id);
            if (subOption == null) return false;

            _context.SupportSubOptions.Remove(subOption);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<SupportCategoryDto>> GetSupportCategoriesByTypeAsync(Guid typeId)
        {
            return await _context.SupportCategories
                .Where(c => c.SupportTypeId == typeId)
                .Select(c => new SupportCategoryDto { Id = c.Id, Name = c.Name })
                .ToListAsync();
        }

        public async Task<IEnumerable<SupportSubOptionDto>> GetSupportSubOptionsByTypeAsync(Guid typeId)
        {
            return await _context.SupportSubOptions
                .Where(s => s.SupportTypeId == typeId)
                .Select(s => new SupportSubOptionDto { Id = s.Id, Name = s.Name, RequiresSrIdentifier = s.RequiresSrIdentifier })
                .ToListAsync();
        }

        public async Task<IEnumerable<SupportCategoryDto>> GetAllSupportCategoriesAsync()
        {
            return await _context.SupportCategories
                .Include(c => c.SupportType)
                .Select(c => new SupportCategoryDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Description = c.Description,
                    SupportTypeId = c.SupportTypeId
                })
                .ToListAsync();
        }

        public async Task<IEnumerable<SupportSubOptionDto>> GetAllSupportSubOptionsAsync()
        {
            return await _context.SupportSubOptions
                .Include(s => s.SupportType)
                .Select(s => new SupportSubOptionDto
                {
                    Id = s.Id,
                    Name = s.Name,
                    Description = s.Description,
                    SupportTypeId = s.SupportTypeId,
                    RequiresSrIdentifier = s.RequiresSrIdentifier
                })
                .ToListAsync();
        }

        // Consultant Skills Methods
        public async Task<IEnumerable<ConsultantSkillDto>> GetConsultantSkillsAsync(Guid consultantId)
        {
            return await _context.ConsultantSkills
                .Include(s => s.SupportType)
                .Include(s => s.SupportCategory)
                .Include(s => s.SupportSubOption)
                .Where(s => s.ConsultantId == consultantId)
                .Select(s => new ConsultantSkillDto
                {
                    Id = s.Id,
                    ConsultantId = s.ConsultantId,
                    SupportTypeId = s.SupportTypeId,
                    SupportTypeName = s.SupportType.Name,
                    SupportCategoryId = s.SupportCategoryId,
                    SupportCategoryName = s.SupportCategory != null ? s.SupportCategory.Name : null,
                    SupportSubOptionId = s.SupportSubOptionId,
                    SupportSubOptionName = s.SupportSubOption != null ? s.SupportSubOption.Name : null,
                    CreatedAt = s.CreatedAt
                })
                .ToListAsync();
        }

        public async Task<ConsultantSkillDto> AddConsultantSkillAsync(Guid consultantId, CreateConsultantSkillDto dto)
        {
            // Check if skill already exists
            var existingSkill = await _context.ConsultantSkills
                .FirstOrDefaultAsync(s => s.ConsultantId == consultantId &&
                                        s.SupportTypeId == dto.SupportTypeId &&
                                        s.SupportCategoryId == dto.SupportCategoryId &&
                                        s.SupportSubOptionId == dto.SupportSubOptionId);

            if (existingSkill != null)
            {
                throw new InvalidOperationException("Consultant already has this skill");
            }

            var skill = new ConsultantSkill
            {
                ConsultantId = consultantId,
                SupportTypeId = dto.SupportTypeId,
                SupportCategoryId = dto.SupportCategoryId,
                SupportSubOptionId = dto.SupportSubOptionId
            };

            _context.ConsultantSkills.Add(skill);
            await _context.SaveChangesAsync();

            return await GetConsultantSkillByIdAsync(skill.Id);
        }

        public async Task<bool> RemoveConsultantSkillAsync(Guid consultantId, Guid skillId)
        {
            var skill = await _context.ConsultantSkills
                .FirstOrDefaultAsync(s => s.Id == skillId && s.ConsultantId == consultantId);

            if (skill == null) return false;

            _context.ConsultantSkills.Remove(skill);
            await _context.SaveChangesAsync();
            return true;
        }

        private async Task<ConsultantSkillDto> GetConsultantSkillByIdAsync(Guid skillId)
        {
            var skill = await _context.ConsultantSkills
                .Include(s => s.SupportType)
                .Include(s => s.SupportCategory)
                .Include(s => s.SupportSubOption)
                .FirstOrDefaultAsync(s => s.Id == skillId);

            if (skill == null) throw new KeyNotFoundException("Skill not found");

            return new ConsultantSkillDto
            {
                Id = skill.Id,
                ConsultantId = skill.ConsultantId,
                SupportTypeId = skill.SupportTypeId,
                SupportTypeName = skill.SupportType.Name,
                SupportCategoryId = skill.SupportCategoryId,
                SupportCategoryName = skill.SupportCategory?.Name,
                SupportSubOptionId = skill.SupportSubOptionId,
                SupportSubOptionName = skill.SupportSubOption?.Name,
                CreatedAt = skill.CreatedAt
            };
        }

        public async Task<IEnumerable<ConsultantSkillsDto>> GetConsultantsBySkillsAsync(Guid supportTypeId, Guid? supportCategoryId = null)
        {
            var query = _context.ConsultantSkills
                .Include(s => s.Consultant)
                .Include(s => s.SupportType)
                .Include(s => s.SupportCategory)
                .Include(s => s.SupportSubOption)
                .Where(s => s.Consultant.Role == UserRole.Consultant && s.Consultant.Status == UserStatus.Active);

            // Filter by skills - hierarchical matching for support types
            if (supportCategoryId.HasValue)
            {
                // Exact category match
                query = query.Where(s => s.SupportCategoryId == supportCategoryId);
            }
            else
            {
                // Support type match OR any categories under this type
                query = query.Where(s => s.SupportTypeId == supportTypeId);
            }

            var skillsGrouped = await query
                .GroupBy(s => s.ConsultantId)
                .Select(g => new ConsultantSkillsDto
                {
                    ConsultantId = g.Key,
                    ConsultantName = g.First().Consultant.FirstName + " " + g.First().Consultant.LastName,
                    Skills = g.Select(s => new ConsultantSkillDto
                    {
                        Id = s.Id,
                        ConsultantId = s.ConsultantId,
                        SupportTypeId = s.SupportTypeId,
                        SupportTypeName = s.SupportType.Name,
                        SupportCategoryId = s.SupportCategoryId,
                        SupportCategoryName = s.SupportCategory!.Name,
                        SupportSubOptionId = s.SupportSubOptionId,
                        SupportSubOptionName = s.SupportSubOption!.Name,
                        CreatedAt = s.CreatedAt
                    }).ToList()
                })
                .ToListAsync();

            return skillsGrouped;
        }
    }
}
