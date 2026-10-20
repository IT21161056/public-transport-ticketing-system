using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Ticketing_System_Backend.Models.Entities;
using Ticketing_System_Backend.Models.Enums;
using Ticketing_System_Backend.Services.Reporting;

namespace Ticketing_System_Backend.Data;

/// <summary>
/// Seeds 30 days of realistic journeys and ticket inspections so the Transport Manager reports
/// and the inspection module can be demonstrated. Uses its own demo commuters and guest devices,
/// so the existing demo users are untouched. Runs once per database (enabled by Reporting:SeedDemoData).
/// </summary>
public class ReportDemoDataSeeder : IHostedService
{
    private const string DemoUserCodePrefix = "RPT-DEMO-";
    private const int DaysOfHistory = 30;

    private static readonly string[] Stations =
    {
        "Colombo Fort", "Pettah", "Kollupitiya", "Bambalapitiya", "Wellawatte", "Dehiwala", "Mount Lavinia",
        "Borella", "Rajagiriya", "Battaramulla", "Malabe", "Kaduwela", "Nugegoda", "Maharagama"
    };

    private static readonly string[] Routes =
    {
        "Route 138 - Bus NB-5542", "Route 120 - Bus NC-4471", "Route 177 - Bus ND-2210", "Route 100 - Bus NA-1188"
    };

    // Route 120 is given a higher evasion rate so the report has a clear finding to discuss
    private static readonly Dictionary<string, double> RouteEvasionRates = new()
    {
        ["Route 138 - Bus NB-5542"] = 0.08,
        ["Route 120 - Bus NC-4471"] = 0.25,
        ["Route 177 - Bus ND-2210"] = 0.06,
        ["Route 100 - Bus NA-1188"] = 0.10
    };

    private static readonly string[] DemoCommuterNames =
    {
        "Amali Wickramasinghe", "Dinesh Rajapaksha", "Tharindu Silva", "Ishara Gunawardena",
        "Ruwan Herath", "Nadeesha Perera", "Chamath Bandara", "Shehani Dissanayake"
    };

    // Relative weight of tap-ins per local hour: morning and evening peaks
    private static readonly int[] HourWeights =
    {
        0, 0, 0, 0, 0, 1, 3, 9, 10, 6, 3, 3, 4, 3, 3, 4, 7, 10, 8, 4, 3, 2, 1, 0
    };

    private const decimal BaseFare = 40.00m;
    private const decimal FarePerStation = 15.00m;

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ReportingOptions _options;
    private readonly ILogger<ReportDemoDataSeeder> _logger;

    public ReportDemoDataSeeder(
        IServiceScopeFactory scopeFactory,
        IOptions<ReportingOptions> options,
        ILogger<ReportDemoDataSeeder> logger)
    {
        _scopeFactory = scopeFactory;
        _options = options.Value;
        _logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        if (!_options.SeedDemoData)
        {
            return;
        }

        try
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            bool alreadySeeded = await context.Users
                .AnyAsync(u => u.UserCode != null && u.UserCode.StartsWith(DemoUserCodePrefix), cancellationToken);
            if (alreadySeeded)
            {
                return;
            }

            _logger.LogInformation("Seeding {Days} days of demo journeys and inspections for reports...", DaysOfHistory);
            await SeedAsync(context, cancellationToken);
            _logger.LogInformation("Report demo data seeding completed successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Report demo data seeding failed: {Message}", ex.Message);
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    private async Task SeedAsync(AppDbContext context, CancellationToken cancellationToken)
    {
        var random = new Random(20261020); // fixed seed: same data shape on every machine
        var timeZone = ResolveTimeZone(_options.TimeZone);
        var todayLocal = DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, timeZone));

        var inspector = await context.Users.FirstOrDefaultAsync(u => u.Role == (short)UserRole.Admin, cancellationToken);

        var commuters = DemoCommuterNames
            .Select((name, index) => new User
            {
                FullName = name,
                PhoneNumber = $"+94 70 100 {index + 1:0000}",
                UserCode = $"{DemoUserCodePrefix}{index + 1:00}",
                Role = (short)UserRole.User,
                IsActive = true,
                IsPhoneVerified = true,
                CreditBalance = random.Next(300, 3000),
                CreatedAtUtc = DateTime.UtcNow.AddDays(-(DaysOfHistory + 10))
            })
            .ToList();
        await context.Users.AddRangeAsync(commuters, cancellationToken);

        var guestDevices = Enumerable.Range(1, 6).Select(n => $"demo-guest-{n:00}").ToList();

        var journeys = new List<Journey>();
        var inspections = new List<TicketInspection>();

        for (int daysAgo = DaysOfHistory; daysAgo >= 1; daysAgo--)
        {
            var date = todayLocal.AddDays(-daysAgo);
            bool isWeekend = date.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday;

            var dayJourneys = new List<Journey>();
            int journeyCount = (isWeekend ? 14 : 28) + random.Next(-4, 5);
            for (int i = 0; i < journeyCount; i++)
            {
                dayJourneys.Add(CreateJourney(random, timeZone, date, commuters, guestDevices));
            }
            journeys.AddRange(dayJourneys);

            int inspectionCount = (isWeekend ? 5 : 10) + random.Next(-2, 3);
            for (int i = 0; i < inspectionCount; i++)
            {
                inspections.Add(CreateInspection(random, timeZone, date, dayJourneys, commuters, guestDevices, inspector?.Id));
            }
        }

        await context.Journeys.AddRangeAsync(journeys, cancellationToken);
        await context.TicketInspections.AddRangeAsync(inspections, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
    }

    private static Journey CreateJourney(Random random, TimeZoneInfo timeZone, DateOnly date, List<User> commuters, List<string> guestDevices)
    {
        bool isGuest = random.NextDouble() < 0.25;
        int fromIndex = random.Next(Stations.Length);
        int toIndex = (fromIndex + random.Next(1, Stations.Length)) % Stations.Length;

        var tapInUtc = ToUtc(date, PickHour(random), random.Next(60), timeZone);
        bool forgotTapOut = random.NextDouble() < 0.03;

        var journey = new Journey
        {
            UserId = isGuest ? null : commuters[random.Next(commuters.Count)].Id,
            DeviceUuid = isGuest ? guestDevices[random.Next(guestDevices.Count)] : null,
            TapInStation = Stations[fromIndex],
            TapInTimeUtc = tapInUtc,
            CreatedAtUtc = tapInUtc
        };

        if (forgotTapOut)
        {
            journey.Status = JourneyStatus.InProgress;
            return journey;
        }

        int stationsTravelled = Math.Min(Math.Abs(toIndex - fromIndex), 6);
        journey.TapOutStation = Stations[toIndex];
        journey.TapOutTimeUtc = tapInUtc.AddMinutes(10 + stationsTravelled * 6 + random.Next(0, 15));
        journey.FareAmount = isGuest ? 0.00m : BaseFare + stationsTravelled * FarePerStation;
        journey.Status = JourneyStatus.Completed;
        return journey;
    }

    private static TicketInspection CreateInspection(
        Random random,
        TimeZoneInfo timeZone,
        DateOnly date,
        List<Journey> dayJourneys,
        List<User> commuters,
        List<string> guestDevices,
        Guid? inspectorId)
    {
        string route = Routes[random.Next(Routes.Length)];
        var inspectedAtUtc = ToUtc(date, random.Next(7, 21), random.Next(60), timeZone);
        bool isInvalid = random.NextDouble() < RouteEvasionRates[route];

        if (!isInvalid && dayJourneys.Count > 0)
        {
            var journey = dayJourneys[random.Next(dayJourneys.Count)];
            return new TicketInspection
            {
                TokenIdentifier = journey.UserId?.ToString() ?? journey.DeviceUuid!,
                TokenType = journey.UserId != null ? "LOCAL" : "GUEST",
                UserId = journey.UserId,
                DeviceUuid = journey.DeviceUuid,
                JourneyId = journey.Id,
                Result = InspectionResult.Valid,
                Location = route,
                InspectorId = inspectorId,
                InspectedAtUtc = inspectedAtUtc
            };
        }

        bool isGuest = random.NextDouble() < 0.3;
        var commuter = commuters[random.Next(commuters.Count)];
        string device = guestDevices[random.Next(guestDevices.Count)];

        return new TicketInspection
        {
            TokenIdentifier = isGuest ? device : commuter.Id.ToString(),
            TokenType = isGuest ? "GUEST" : "LOCAL",
            UserId = isGuest ? null : commuter.Id,
            DeviceUuid = isGuest ? device : null,
            Result = PickInvalidResult(random, isGuest),
            Location = route,
            InspectorId = inspectorId,
            InspectedAtUtc = inspectedAtUtc
        };
    }

    private static InspectionResult PickInvalidResult(Random random, bool isGuest)
    {
        double roll = random.NextDouble();
        if (roll < 0.60) return InspectionResult.NoActiveJourney;
        if (roll < 0.75) return InspectionResult.StaleJourney;
        if (roll < 0.85) return InspectionResult.InvalidToken;
        if (isGuest || roll < 0.93) return InspectionResult.Expired;
        return InspectionResult.AccountSuspended;
    }

    private static int PickHour(Random random)
    {
        int roll = random.Next(HourWeights.Sum());
        for (int hour = 0; hour < HourWeights.Length; hour++)
        {
            roll -= HourWeights[hour];
            if (roll < 0) return hour;
        }
        return 8;
    }

    private static DateTime ToUtc(DateOnly date, int hour, int minute, TimeZoneInfo timeZone)
    {
        return TimeZoneInfo.ConvertTimeToUtc(date.ToDateTime(new TimeOnly(hour, minute)), timeZone);
    }

    private static TimeZoneInfo ResolveTimeZone(string timeZoneId)
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById(timeZoneId);
        }
        catch (Exception ex) when (ex is TimeZoneNotFoundException or InvalidTimeZoneException)
        {
            return TimeZoneInfo.Utc;
        }
    }
}
