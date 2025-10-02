using System.Collections.Generic;
using System;

namespace SapBasisPulse.Api.Entities
{
    public class SupportType
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public ICollection<SupportCategory> Categories { get; set; }
        public ICollection<SupportSubOption> SubOptions { get; set; }
    }

    public class SupportCategory
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public Guid SupportTypeId { get; set; }
        public SupportType SupportType { get; set; }
    }

    public class SupportSubOption
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public Guid SupportTypeId { get; set; }
        public SupportType SupportType { get; set; }
        public bool RequiresSrIdentifier { get; set; }
    }

    public class ConsultantSkill
    {
        public Guid Id { get; set; }
        public Guid ConsultantId { get; set; }
        public User Consultant { get; set; }
        public Guid SupportTypeId { get; set; }
        public SupportType SupportType { get; set; }
        public Guid? SupportCategoryId { get; set; }
        public SupportCategory? SupportCategory { get; set; }
        public Guid? SupportSubOptionId { get; set; }
        public SupportSubOption? SupportSubOption { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Additional audit fields
        public string? CreatedBy { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? UpdatedBy { get; set; }
        public bool IsDeleted { get; set; } = false;
    }
}