using Microsoft.EntityFrameworkCore;
using Ticketing_System_Backend.Models.Entities;

namespace Ticketing_System_Backend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<OtpVerification> OtpVerifications => Set<OtpVerification>();
    public DbSet<TransportToken> TransportTokens => Set<TransportToken>();
    public DbSet<Journey> Journeys => Set<Journey>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users");
            entity.HasKey(e => e.Id).HasName("pk_users");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.UserName).HasColumnName("user_name").HasMaxLength(50);
            entity.Property(e => e.Email).HasColumnName("email").HasMaxLength(256);
            entity.Property(e => e.PasswordHash).HasColumnName("password_hash").HasMaxLength(255);
            entity.Property(e => e.FullName).HasColumnName("full_name").HasMaxLength(150).IsRequired();
            entity.Property(e => e.PhoneNumber).HasColumnName("phone_number").HasMaxLength(20);
            entity.Property(e => e.Role).HasColumnName("role").HasDefaultValue((short)0);
            entity.Property(e => e.IsActive).HasColumnName("is_active").HasDefaultValue(true);
            entity.Property(e => e.CreatedAtUtc).HasColumnName("created_at_utc");
            entity.Property(e => e.UpdatedAtUtc).HasColumnName("updated_at_utc");
            entity.Property(e => e.LastLoginAtUtc).HasColumnName("last_login_at_utc");
            entity.Property(e => e.UserCode).HasColumnName("user_code").HasMaxLength(50);
            entity.Property(e => e.CreditBalance).HasColumnName("credit_balance").HasPrecision(10, 2).HasDefaultValue(1250.00m);
            entity.Property(e => e.PersistentQrToken).HasColumnName("persistent_qr_token").HasMaxLength(255);
            entity.Property(e => e.IsPhoneVerified).HasColumnName("is_phone_verified").HasDefaultValue(false);

            entity.HasMany(e => e.Journeys)
                  .WithOne(j => j.User)
                  .HasForeignKey(j => j.UserId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasMany(e => e.Tokens)
                  .WithOne(t => t.User)
                  .HasForeignKey(t => t.UserId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<OtpVerification>(entity =>
        {
            entity.ToTable("otp_verifications");
            entity.HasKey(e => e.Id).HasName("pk_otp_verifications");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.PhoneNumber).HasColumnName("phone_number").HasMaxLength(30).IsRequired();
            entity.Property(e => e.OtpCode).HasColumnName("otp_code").HasMaxLength(10).IsRequired();
            entity.Property(e => e.Purpose).HasColumnName("purpose").HasMaxLength(30).HasDefaultValue("register");
            entity.Property(e => e.FullName).HasColumnName("full_name").HasMaxLength(150);
            entity.Property(e => e.Attempts).HasColumnName("attempts").HasDefaultValue(0);
            entity.Property(e => e.IsUsed).HasColumnName("is_used").HasDefaultValue(false);
            entity.Property(e => e.CreatedAtUtc).HasColumnName("created_at_utc");
            entity.Property(e => e.ExpiresAtUtc).HasColumnName("expires_at_utc");
        });

        modelBuilder.Entity<TransportToken>(entity =>
        {
            entity.ToTable("transport_tokens");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.DeviceUuid).HasColumnName("device_uuid").HasMaxLength(100);
            entity.Property(e => e.TokenType).HasColumnName("token_type");
            entity.Property(e => e.PassTier).HasColumnName("pass_tier").HasMaxLength(20);
            entity.Property(e => e.SignedToken).HasColumnName("signed_token").IsRequired();
            entity.Property(e => e.Nonce).HasColumnName("nonce").HasMaxLength(50).IsRequired();
            entity.Property(e => e.IsActive).HasColumnName("is_active").HasDefaultValue(true);
            entity.Property(e => e.CreatedAtUtc).HasColumnName("created_at_utc");
            entity.Property(e => e.ExpiresAtUtc).HasColumnName("expires_at_utc");
        });

        modelBuilder.Entity<Journey>(entity =>
        {
            entity.ToTable("journeys");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.DeviceUuid).HasColumnName("device_uuid").HasMaxLength(100);
            entity.Property(e => e.TokenId).HasColumnName("token_id");
            entity.Property(e => e.TapInStation).HasColumnName("tap_in_station").HasMaxLength(100).IsRequired();
            entity.Property(e => e.TapInTimeUtc).HasColumnName("tap_in_time_utc");
            entity.Property(e => e.TapOutStation).HasColumnName("tap_out_station").HasMaxLength(100);
            entity.Property(e => e.TapOutTimeUtc).HasColumnName("tap_out_time_utc");
            entity.Property(e => e.FareAmount).HasColumnName("fare_amount").HasPrecision(10, 2).HasDefaultValue(0.00m);
            entity.Property(e => e.Status).HasColumnName("status");
            entity.Property(e => e.CreatedAtUtc).HasColumnName("created_at_utc");

            entity.HasOne(e => e.Token)
                  .WithMany()
                  .HasForeignKey(e => e.TokenId)
                  .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
