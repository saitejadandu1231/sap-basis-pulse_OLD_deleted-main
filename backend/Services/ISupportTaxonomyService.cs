using SapBasisPulse.Api.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SapBasisPulse.Api.Services
{
    public interface ISupportTaxonomyService
    {
        Task<IEnumerable<SupportTypeDto>> GetAllSupportTypesAsync();
        Task<SupportTypeDto?> GetSupportTypeByIdAsync(Guid id);
        Task<SupportTypeDto> CreateSupportTypeAsync(CreateSupportTypeDto dto);
        Task<SupportTypeDto> UpdateSupportTypeAsync(Guid id, UpdateSupportTypeDto dto);
        Task<bool> DeleteSupportTypeAsync(Guid id);
        Task<SupportCategoryDto> CreateSupportCategoryAsync(CreateSupportCategoryDto dto);
        Task<SupportCategoryDto> UpdateSupportCategoryAsync(Guid id, UpdateSupportCategoryDto dto);
        Task<bool> DeleteSupportCategoryAsync(Guid id);
        Task<SupportSubOptionDto> CreateSupportSubOptionAsync(CreateSupportSubOptionDto dto);
        Task<SupportSubOptionDto> UpdateSupportSubOptionAsync(Guid id, UpdateSupportSubOptionDto dto);
        Task<bool> DeleteSupportSubOptionAsync(Guid id);
        Task<IEnumerable<SupportCategoryDto>> GetSupportCategoriesByTypeAsync(Guid typeId);
        Task<IEnumerable<SupportSubOptionDto>> GetSupportSubOptionsByTypeAsync(Guid typeId);
        Task<IEnumerable<SupportCategoryDto>> GetAllSupportCategoriesAsync();
        Task<IEnumerable<SupportSubOptionDto>> GetAllSupportSubOptionsAsync();
        Task<IEnumerable<ConsultantSkillDto>> GetConsultantSkillsAsync(Guid consultantId);
        Task<ConsultantSkillDto> AddConsultantSkillAsync(Guid consultantId, CreateConsultantSkillDto dto);
        Task<bool> RemoveConsultantSkillAsync(Guid consultantId, Guid skillId);
        Task<IEnumerable<ConsultantSkillsDto>> GetConsultantsBySkillsAsync(Guid supportTypeId, Guid? supportCategoryId = null);
    }
}