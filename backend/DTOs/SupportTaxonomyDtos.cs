using System;
using System.Collections.Generic;

namespace SapBasisPulse.Api.DTOs
{
    public class SupportTypeDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public List<SupportCategoryDto> Categories { get; set; }
        public List<SupportSubOptionDto> SubOptions { get; set; }
    }
    public class SupportCategoryDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public Guid SupportTypeId { get; set; }
    }
    public class SupportSubOptionDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public Guid SupportTypeId { get; set; }
        public bool RequiresSrIdentifier { get; set; }
    }
    public class CreateSupportTypeDto
    {
        public string Name { get; set; }
        public string Description { get; set; }
    }
    public class CreateSupportCategoryDto
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public Guid SupportTypeId { get; set; }
    }
    public class CreateSupportSubOptionDto
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public Guid SupportTypeId { get; set; }
        public bool RequiresSrIdentifier { get; set; }
    }
    public class UpdateSupportTypeDto
    {
        public string Name { get; set; }
        public string Description { get; set; }
    }
    public class UpdateSupportCategoryDto
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public Guid SupportTypeId { get; set; }
    }
    public class UpdateSupportSubOptionDto
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public Guid SupportTypeId { get; set; }
        public bool RequiresSrIdentifier { get; set; }
    }

    public class ConsultantSkillDto
    {
        public Guid Id { get; set; }
        public Guid ConsultantId { get; set; }
        public Guid SupportTypeId { get; set; }
        public string SupportTypeName { get; set; }
        public Guid? SupportCategoryId { get; set; }
        public string? SupportCategoryName { get; set; }
        public Guid? SupportSubOptionId { get; set; }
        public string? SupportSubOptionName { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateConsultantSkillDto
    {
        public Guid SupportTypeId { get; set; }
        public Guid? SupportCategoryId { get; set; }
        public Guid? SupportSubOptionId { get; set; }
    }

    public class ConsultantSkillsDto
    {
        public Guid ConsultantId { get; set; }
        public string ConsultantName { get; set; }
        public List<ConsultantSkillDto> Skills { get; set; }
    }
}
