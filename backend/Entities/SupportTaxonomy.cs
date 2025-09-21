using System.Collections.Generic;
using System;

namespace SapBasisPulse.Api.Entities
{
    public class SupportType
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public ICollection<SupportCategory> Categories { get; set; }
        public ICollection<SupportSubOption> SubOptions { get; set; }
    }

    public class SupportCategory
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public Guid SupportTypeId { get; set; }
        public SupportType SupportType { get; set; }
    }

    public class SupportSubOption
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public Guid SupportTypeId { get; set; }
        public SupportType SupportType { get; set; }
        public bool RequiresSrIdentifier { get; set; }
    }
}