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
    public DbSet<TicketInspection> TicketInspections => Set<TicketInspection>();
    public DbSet<TransitRoute> TransitRoutes => Set<TransitRoute>();
    public DbSet<Stop> Stops => Set<Stop>();
    public DbSet<RouteStop> RouteStops => Set<RouteStop>();
    public DbSet<Bus> Buses => Set<Bus>();

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
            entity.Property(e => e.RouteId).HasColumnName("route_id");
            entity.Property(e => e.BusId).HasColumnName("bus_id");
            entity.Property(e => e.BoardingStopId).HasColumnName("boarding_stop_id");
            entity.Property(e => e.AlightingStopId).HasColumnName("alighting_stop_id");
            entity.Property(e => e.StopsTravelled).HasColumnName("stops_travelled");
            entity.Property(e => e.FarePolicy).HasColumnName("fare_policy").HasMaxLength(50);

            // Boarding reader looks up the passenger's open journey on every tap
            entity.HasIndex(e => new { e.UserId, e.Status });
            entity.HasIndex(e => new { e.DeviceUuid, e.Status });

            entity.HasOne(e => e.Token)
                  .WithMany()
                  .HasForeignKey(e => e.TokenId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.Route)
                  .WithMany()
                  .HasForeignKey(e => e.RouteId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.Bus)
                  .WithMany()
                  .HasForeignKey(e => e.BusId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.BoardingStop)
                  .WithMany()
                  .HasForeignKey(e => e.BoardingStopId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.AlightingStop)
                  .WithMany()
                  .HasForeignKey(e => e.AlightingStopId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<TransitRoute>(entity =>
        {
            entity.ToTable("transit_routes");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.RouteNumber).HasColumnName("route_number").HasMaxLength(20).IsRequired();
            entity.Property(e => e.Name).HasColumnName("name").HasMaxLength(150).IsRequired();
            entity.Property(e => e.IsActive).HasColumnName("is_active").HasDefaultValue(true);

            entity.HasIndex(e => e.RouteNumber).IsUnique();
        });

        modelBuilder.Entity<Stop>(entity =>
        {
            entity.ToTable("stops");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Code).HasColumnName("code").HasMaxLength(20).IsRequired();
            entity.Property(e => e.Name).HasColumnName("name").HasMaxLength(100).IsRequired();
            entity.Property(e => e.Zone).HasColumnName("zone");

            entity.HasIndex(e => e.Code).IsUnique();
        });

        modelBuilder.Entity<RouteStop>(entity =>
        {
            entity.ToTable("route_stops");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.RouteId).HasColumnName("route_id");
            entity.Property(e => e.StopId).HasColumnName("stop_id");
            entity.Property(e => e.Sequence).HasColumnName("sequence");
            entity.Property(e => e.DistanceFromStartKm).HasColumnName("distance_from_start_km").HasPrecision(6, 2);

            entity.HasIndex(e => new { e.RouteId, e.Sequence }).IsUnique();
            entity.HasIndex(e => new { e.RouteId, e.StopId }).IsUnique();

            entity.HasOne(e => e.Route)
                  .WithMany(r => r.Stops)
                  .HasForeignKey(e => e.RouteId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Stop)
                  .WithMany()
                  .HasForeignKey(e => e.StopId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Bus>(entity =>
        {
            entity.ToTable("buses");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.RegistrationNumber).HasColumnName("registration_number").HasMaxLength(20).IsRequired();
            entity.Property(e => e.RouteId).HasColumnName("route_id");
            entity.Property(e => e.IsActive).HasColumnName("is_active").HasDefaultValue(true);

            entity.HasIndex(e => e.RegistrationNumber).IsUnique();

            entity.HasOne(e => e.Route)
                  .WithMany(r => r.Buses)
                  .HasForeignKey(e => e.RouteId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<TicketInspection>(entity =>
        {
            entity.ToTable("ticket_inspections");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.TokenIdentifier).HasColumnName("token_identifier").HasMaxLength(100).IsRequired();
            entity.Property(e => e.TokenType).HasColumnName("token_type").HasMaxLength(20).IsRequired();
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.DeviceUuid).HasColumnName("device_uuid").HasMaxLength(100);
            entity.Property(e => e.JourneyId).HasColumnName("journey_id");
            entity.Property(e => e.Result).HasColumnName("result");
            entity.Property(e => e.Location).HasColumnName("location").HasMaxLength(100);
            entity.Property(e => e.InspectorId).HasColumnName("inspector_id");
            entity.Property(e => e.InspectedAtUtc).HasColumnName("inspected_at_utc");
            entity.Ignore(e => e.IsValid);

            entity.HasIndex(e => e.InspectedAtUtc);
            entity.HasIndex(e => new { e.TokenIdentifier, e.InspectedAtUtc });

            entity.HasOne(e => e.Journey)
                  .WithMany()
                  .HasForeignKey(e => e.JourneyId)
                  .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
