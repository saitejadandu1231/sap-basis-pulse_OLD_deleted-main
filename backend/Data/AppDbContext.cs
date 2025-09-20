using Microsoft.EntityFrameworkCore;
using SapBasisPulse.Api.Entities;

namespace SapBasisPulse.Api.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<ConsultantAvailabilitySlot> ConsultantAvailabilitySlots { get; set; }
        public DbSet<CustomerChoice> CustomerChoices { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<TicketRating> TicketRatings { get; set; }
        public DbSet<SupportType> SupportTypes { get; set; }
        public DbSet<SupportCategory> SupportCategories { get; set; }
        public DbSet<SupportSubOption> SupportSubOptions { get; set; }
    public DbSet<LoginActivity> LoginActivities { get; set; }
    public DbSet<RefreshToken> RefreshTokens { get; set; }
    public DbSet<AuditLog> AuditLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
        // Configure relationships and constraints
        modelBuilder.Entity<CustomerChoice>(entity =>
        {
            entity.HasOne(cc => cc.User)
                .WithMany(u => u.CustomerChoices)
                .HasForeignKey(cc => cc.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(cc => cc.Consultant)
                .WithMany()
                .HasForeignKey(cc => cc.ConsultantId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(cc => cc.Slot)
                .WithOne(s => s.BookedByCustomerChoice)
                .HasForeignKey<ConsultantAvailabilitySlot>(s => s.BookedByCustomerChoiceId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Order>(entity =>
        {
            entity.HasOne(o => o.CustomerChoice)
                .WithMany(cc => cc.Orders)
                .HasForeignKey(o => o.CustomerChoiceId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(o => o.Consultant)
                .WithMany()
                .HasForeignKey(o => o.ConsultantId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(o => o.CreatedByUser)
                .WithMany(u => u.Orders)
                .HasForeignKey(o => o.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(o => o.TimeSlot)
                .WithMany()
                .HasForeignKey(o => o.TimeSlotId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        base.OnModelCreating(modelBuilder);
        }
    }
}