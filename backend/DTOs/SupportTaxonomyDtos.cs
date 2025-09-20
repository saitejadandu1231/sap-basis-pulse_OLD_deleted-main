using System;
using System.Collections.Generic;

namespace SapBasisPulse.Api.DTOs
{
    public class SupportTypeDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public List<SupportCategoryDto> Categories { get; set; }
        public List<SupportSubOptionDto> SubOptions { get; set; }
    }
    public class SupportCategoryDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
    }
    public class SupportSubOptionDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
    }
    public class CreateSupportTypeDto
    {
        public string Name { get; set; }
    }
    public class CreateSupportCategoryDto
    {
        public string Name { get; set; }
        public Guid SupportTypeId { get; set; }
    }
    public class CreateSupportSubOptionDto
    {
        public string Name { get; set; }
        public Guid SupportTypeId { get; set; }
    }
}
