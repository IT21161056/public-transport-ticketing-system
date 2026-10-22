using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Ticketing_System_Backend.Models.Entities;
using Ticketing_System_Backend.Models.Enums;
using Ticketing_System_Backend.Utils;

namespace Ticketing_System_Backend.Data;

public static class DbInitializer
{
    public static async Task InitializeAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var logger = scope.ServiceProvider.GetService<ILoggerFactory>()?.CreateLogger("DbInitializer");

        try
        {
            // Ensure schema exists in PostgreSQL
            await context.Database.EnsureCreatedAsync();

            // Ensure top_up_transactions table exists even on pre-existing PostgreSQL volumes
            await context.Database.ExecuteSqlRawAsync(@"
                CREATE TABLE IF NOT EXISTS top_up_transactions (
                    id uuid PRIMARY KEY,
                    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    amount numeric(10,2) NOT NULL,
                    bonus_amount numeric(10,2) NOT NULL DEFAULT 0.00,
                    total_credits numeric(10,2) NOT NULL,
                    method character varying(30) NOT NULL,
                    channel_name character varying(50) NOT NULL,
                    status character varying(20) NOT NULL,
                    payment_reference character varying(100),
                    failure_reason character varying(255),
                    balance_after numeric(10,2) NOT NULL,
                    created_at_utc timestamp with time zone NOT NULL
                );
            ");

            // 1. Seed Administrator User (admin / admin123)
            var adminUser = await context.Users.FirstOrDefaultAsync(u => 
                u.Role == (short)UserRole.Admin || 
                u.UserName == "admin" || 
                u.Email == "admin@urbantransit.com");

            if (adminUser == null)
            {
                logger?.LogInformation("Seeding default Administrator account (admin / admin123)...");
                adminUser = new User
                {
                    UserName = "admin",
                    Email = "admin@urbantransit.com",
                    FullName = "System Administrator",
                    PhoneNumber = "+94 77 000 0000",
                    Role = (short)UserRole.Admin,
                    IsActive = true,
                    IsPhoneVerified = true,
                    CreditBalance = 50000.00m,
                    PasswordHash = PasswordHelper.HashPassword("admin123"),
                    CreatedAtUtc = DateTime.UtcNow.AddMonths(-1),
                    LastLoginAtUtc = DateTime.UtcNow
                };

                await context.Users.AddAsync(adminUser);
                await context.SaveChangesAsync();
                logger?.LogInformation("Admin account successfully created.");
            }
            else
            {
                // Ensure default admin always has valid credentials
                adminUser.UserName = "admin";
                adminUser.Email = "admin@urbantransit.com";
                adminUser.Role = (short)UserRole.Admin;
                adminUser.IsActive = true;
                adminUser.PasswordHash = PasswordHelper.HashPassword("admin123");
                await context.SaveChangesAsync();
            }

            // 2. Seed Demo Commuter & Journeys if database has no commuter users
            bool hasCommuters = await context.Users.AnyAsync(u => u.Role == (short)UserRole.User);
            if (!hasCommuters)
            {
                logger?.LogInformation("Seeding demo commuters and initial transit journeys...");

                var demoUser1 = new User
                {
                    FullName = "Kasun Perera",
                    PhoneNumber = "+94 77 123 4567",
                    Role = (short)UserRole.User,
                    IsActive = true,
                    IsPhoneVerified = true,
                    CreditBalance = 1450.00m,
                    PersistentQrToken = "TK1|LOCAL|demo-user-1|0|a1b2c3d4|DEMOSIG1",
                    CreatedAtUtc = DateTime.UtcNow.AddDays(-10)
                };

                var demoUser2 = new User
                {
                    FullName = "Sanduni Fernando",
                    PhoneNumber = "+94 71 987 6543",
                    Role = (short)UserRole.User,
                    IsActive = true,
                    IsPhoneVerified = true,
                    CreditBalance = 820.00m,
                    PersistentQrToken = "TK1|LOCAL|demo-user-2|0|e5f6g7h8|DEMOSIG2",
                    CreatedAtUtc = DateTime.UtcNow.AddDays(-5)
                };

                var demoUser3 = new User
                {
                    FullName = "Nimal Jayasinghe",
                    PhoneNumber = "+94 70 555 1234",
                    Role = (short)UserRole.User,
                    IsActive = false, // demo suspended user
                    IsPhoneVerified = true,
                    CreditBalance = 35.00m,
                    PersistentQrToken = "TK1|LOCAL|demo-user-3|0|i9j0k1l2|DEMOSIG3",
                    CreatedAtUtc = DateTime.UtcNow.AddDays(-2)
                };

                await context.Users.AddRangeAsync(demoUser1, demoUser2, demoUser3);
                await context.SaveChangesAsync();

                // Seed some journeys for realistic operational graphs
                var journeys = new[]
                {
                    new Journey
                    {
                        UserId = demoUser1.Id,
                        TapInStation = "Colombo Fort Central",
                        TapInTimeUtc = DateTime.UtcNow.AddHours(-3),
                        TapOutStation = "Bambalapitiya Junction",
                        TapOutTimeUtc = DateTime.UtcNow.AddHours(-2).AddMinutes(-35),
                        FareAmount = 70.00m,
                        Status = JourneyStatus.Completed,
                        CreatedAtUtc = DateTime.UtcNow.AddHours(-3)
                    },
                    new Journey
                    {
                        UserId = demoUser2.Id,
                        TapInStation = "Kollupitiya Metro Hub",
                        TapInTimeUtc = DateTime.UtcNow.AddHours(-1).AddMinutes(-15),
                        TapOutStation = "Wellawatte Terminus",
                        TapOutTimeUtc = DateTime.UtcNow.AddMinutes(-50),
                        FareAmount = 55.00m,
                        Status = JourneyStatus.Completed,
                        CreatedAtUtc = DateTime.UtcNow.AddHours(-1)
                    },
                    new Journey
                    {
                        UserId = demoUser1.Id,
                        TapInStation = "Dehiwala Rapid Line",
                        TapInTimeUtc = DateTime.UtcNow.AddMinutes(-20),
                        TapOutStation = null,
                        TapOutTimeUtc = null,
                        FareAmount = 0.00m,
                        Status = JourneyStatus.InProgress,
                        CreatedAtUtc = DateTime.UtcNow.AddMinutes(-20)
                    }
                };

                await context.Journeys.AddRangeAsync(journeys);

                // Seed sample active guest pass
                var sampleGuestPass = new TransportToken
                {
                    DeviceUuid = "dev-visitor-8841",
                    TokenType = TokenType.GuestPass,
                    PassTier = "3-Day",
                    SignedToken = "TK1|GUEST|dev-visitor-8841|1760000000|gst99x|DEMOSIG_GUEST",
                    Nonce = "gst99x",
                    IsActive = true,
                    CreatedAtUtc = DateTime.UtcNow.AddDays(-1),
                    ExpiresAtUtc = DateTime.UtcNow.AddDays(2)
                };

                await context.TransportTokens.AddAsync(sampleGuestPass);
                await context.SaveChangesAsync();

                logger?.LogInformation("Demo data seeding completed successfully.");
            }
        }
        catch (Exception ex)
        {
            logger?.LogError(ex, "An error occurred during database initialization / seeding: {Message}", ex.Message);
        }
    }
}
