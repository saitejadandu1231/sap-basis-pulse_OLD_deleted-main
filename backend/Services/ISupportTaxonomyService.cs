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
        Task<SupportCategoryDto> CreateSupportCategoryAsync(CreateSupportCategoryDto dto);
        Task<SupportSubOptionDto> CreateSupportSubOptionAsync(CreateSupportSubOptionDto dto);
    }
}