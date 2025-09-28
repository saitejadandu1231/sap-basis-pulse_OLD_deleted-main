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
        public DbSet<OrderSlot> OrderSlots { get; set; }
        public DbSet<TicketRating> TicketRatings { get; set; }
        public DbSet<SupportType> SupportTypes { get; set; }
        public DbSet<SupportCategory> SupportCategories { get; set; }
        public DbSet<SupportSubOption> SupportSubOptions { get; set; }
        public DbSet<LoginActivity> LoginActivities { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }
        public DbSet<ServiceRequestIdentifier> ServiceRequestIdentifiers { get; set; }
        public DbSet<Conversation> Conversations { get; set; }
        public DbSet<Message> Messages { get; set; }
        public DbSet<MessageAttachment> MessageAttachments { get; set; }
        public DbSet<StatusMaster> StatusMaster { get; set; }
        public DbSet<StatusChangeLog> StatusChangeLogs { get; set; }
        public DbSet<SSOConfiguration> SSOConfigurations { get; set; }
    public DbSet<Payment> Payments { get; set; }
    public DbSet<ConsultantProfile> ConsultantProfiles { get; set; }
    public DbSet<AdminPaymentSettings> AdminPaymentSettings { get; set; }

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

        modelBuilder.Entity<OrderSlot>(entity =>
        {
            entity.HasOne(os => os.Order)
                .WithMany(o => o.OrderSlots)
                .HasForeignKey(os => os.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(os => os.Slot)
                .WithMany()
                .HasForeignKey(os => os.SlotId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(os => new { os.OrderId, os.SlotId }).IsUnique();
        });

        // Apply the ServiceRequestIdentifier configuration
        modelBuilder.ApplyConfiguration(new ServiceRequestIdentifierConfiguration());

        // Configure messaging entities
        modelBuilder.Entity<Conversation>(entity =>
        {
            entity.HasOne(c => c.Order)
                .WithMany()
                .HasForeignKey(c => c.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(c => c.Customer)
                .WithMany()
                .HasForeignKey(c => c.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(c => c.Consultant)
                .WithMany()
                .HasForeignKey(c => c.ConsultantId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.Property(c => c.Subject)
                .HasMaxLength(200)
                .IsRequired();

            entity.HasIndex(c => c.OrderId);
            entity.HasIndex(c => new { c.CustomerId, c.ConsultantId });
        });

        modelBuilder.Entity<Message>(entity =>
        {
            entity.HasOne(m => m.Conversation)
                .WithMany(c => c.Messages)
                .HasForeignKey(m => m.ConversationId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(m => m.Sender)
                .WithMany()
                .HasForeignKey(m => m.SenderId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.Property(m => m.Content)
                .HasMaxLength(2000)
                .IsRequired();

            entity.Property(m => m.MessageType)
                .HasMaxLength(20)
                .HasDefaultValue("text");

            entity.HasIndex(m => m.ConversationId);
            entity.HasIndex(m => m.SentAt);
        });

        modelBuilder.Entity<MessageAttachment>(entity =>
        {
            entity.HasOne(ma => ma.Message)
                .WithMany(m => m.Attachments)
                .HasForeignKey(ma => ma.MessageId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(ma => ma.UploadedBy)
                .WithMany()
                .HasForeignKey(ma => ma.UploadedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.Property(ma => ma.FileName)
                .HasMaxLength(255)
                .IsRequired();

            entity.Property(ma => ma.OriginalFileName)
                .HasMaxLength(255)
                .IsRequired();

            entity.Property(ma => ma.ContentType)
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(ma => ma.FilePath)
                .HasMaxLength(500)
                .IsRequired();
        });

        // StatusMaster configuration
        modelBuilder.Entity<StatusMaster>(entity =>
        {
            entity.HasKey(sm => sm.Id);
            
            entity.HasIndex(sm => sm.StatusCode)
                .IsUnique();
                
            entity.Property(sm => sm.StatusCode)
                .HasMaxLength(50)
                .IsRequired();
                
            entity.Property(sm => sm.StatusName)
                .HasMaxLength(100)
                .IsRequired();
        });

        // StatusChangeLog configuration
        modelBuilder.Entity<StatusChangeLog>(entity =>
        {
            entity.HasKey(scl => scl.Id);
            
            entity.HasOne(scl => scl.Order)
                .WithMany(o => o.StatusChangeLogs)
                .HasForeignKey(scl => scl.OrderId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasOne(scl => scl.FromStatus)
                .WithMany()
                .HasForeignKey(scl => scl.FromStatusId)
                .OnDelete(DeleteBehavior.Restrict);
                
            entity.HasOne(scl => scl.ToStatus)
                .WithMany(sm => sm.StatusChangeLogs)
                .HasForeignKey(scl => scl.ToStatusId)
                .OnDelete(DeleteBehavior.Restrict);
                
            entity.HasOne(scl => scl.ChangedByUser)
                .WithMany()
                .HasForeignKey(scl => scl.ChangedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Update Order configuration to include Status relationship
        modelBuilder.Entity<Order>(entity =>
        {
            entity.HasOne(o => o.Status)
                .WithMany(sm => sm.Orders)
                .HasForeignKey(o => o.StatusId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // SSOConfiguration configuration
        modelBuilder.Entity<SSOConfiguration>(entity =>
        {
            entity.HasKey(sso => sso.Id);
            
            entity.Property(sso => sso.GoogleEnabled)
                .HasDefaultValue(false);
                
            entity.Property(sso => sso.AppleEnabled)
                .HasDefaultValue(false);
                
            entity.Property(sso => sso.SupabaseEnabled)
                .HasDefaultValue(false);
        });

        // Payment configuration
        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasKey(p => p.Id);
            entity.HasIndex(p => p.OrderId);
            entity.HasIndex(p => p.RazorpayOrderId).IsUnique();
            entity.Property(p => p.Currency).HasMaxLength(5).HasDefaultValue("INR");
            entity.Property(p => p.RazorpayOrderId).HasMaxLength(100).IsRequired();
            entity.Property(p => p.RazorpayPaymentId).HasMaxLength(100);
            entity.Property(p => p.RazorpaySignature).HasMaxLength(256);

            entity.HasOne(p => p.Order)
                .WithMany()
                .HasForeignKey(p => p.OrderId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ConsultantProfile configuration (1:1 with User)
        modelBuilder.Entity<ConsultantProfile>(entity =>
        {
            entity.HasKey(cp => cp.ConsultantId);
            entity.Property(cp => cp.UPIId).HasMaxLength(100);
            entity.Property(cp => cp.HourlyRate).HasPrecision(18, 2);

            entity.HasOne(cp => cp.Consultant)
                .WithOne()
                .HasForeignKey<ConsultantProfile>(cp => cp.ConsultantId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // AdminPaymentSettings configuration
        modelBuilder.Entity<AdminPaymentSettings>(entity =>
        {
            entity.HasKey(s => s.Id);
            entity.Property(s => s.Currency).HasMaxLength(5).HasDefaultValue("INR");
            entity.Property(s => s.PlatformCommissionPercent).HasPrecision(5, 2).HasDefaultValue(10m);
            entity.Property(s => s.RazorpayKeyIdHint).HasMaxLength(50);
        });

        base.OnModelCreating(modelBuilder);
        }
    }
}