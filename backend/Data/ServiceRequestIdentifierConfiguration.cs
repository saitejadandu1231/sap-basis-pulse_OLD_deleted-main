using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SapBasisPulse.Api.Entities;

namespace SapBasisPulse.Api.Data
{
    public class ServiceRequestIdentifierConfiguration : IEntityTypeConfiguration<ServiceRequestIdentifier>
    {
        public void Configure(EntityTypeBuilder<ServiceRequestIdentifier> builder)
        {
            builder.ToTable("ServiceRequestIdentifiers");
            
            builder.HasKey(e => e.Id);

            builder.Property(e => e.Identifier)
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(e => e.Task)
                .HasMaxLength(500);

            builder.Property(e => e.CreatedAt)
                .IsRequired()
                .HasDefaultValueSql("now()");

            builder.Property(e => e.UpdatedAt)
                .IsRequired()
                .HasDefaultValueSql("now()");

            builder.Property(e => e.IsActive)
                .IsRequired()
                .HasDefaultValue(true);
        }
    }
}