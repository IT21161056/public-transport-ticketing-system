using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Ticketing_System_Backend.Models.Dtos;
using Ticketing_System_Backend.Models.Entities;
using Ticketing_System_Backend.Models.Enums;
using Ticketing_System_Backend.Repositories;
using Ticketing_System_Backend.Services.Reporting;

namespace Ticketing_System_Backend.Services;

/// <summary>
/// Builds the Transport Manager's ridership, revenue and fare-evasion reports from the
/// journey and inspection records collected during normal operation.
/// </summary>
public class ReportService : IReportService
{
    private const int DefaultPeriodDays = 30;
    private const int MaxPeriodDays = 366;

    private static readonly DayOfWeek[] WeekOrder =
    {
        DayOfWeek.Monday, DayOfWeek.Tuesday, DayOfWeek.Wednesday, DayOfWeek.Thursday,
        DayOfWeek.Friday, DayOfWeek.Saturday, DayOfWeek.Sunday
    };

    private readonly IReportRepository _reportRepository;
    private readonly TimeZoneInfo _timeZone;

    public ReportService(
        IReportRepository reportRepository,
        IOptions<ReportingOptions> options,
        ILogger<ReportService> logger)
    {
        _reportRepository = reportRepository;
        _timeZone = ResolveTimeZone(options.Value.TimeZone, logger);
    }

    public async Task<RidershipReportDto> GenerateRidershipReportAsync(DateOnly? from, DateOnly? to)
    {
        var period = ResolvePeriod(from, to);
        var journeys = await _reportRepository.GetJourneysTappedInBetweenAsync(period.FromUtc, period.ToUtc);
        var tapInTimes = journeys.Select(j => ToLocal(j.TapInTimeUtc)).ToList();

        var byStation = journeys
            .GroupBy(j => j.TapInStation)
            .Select(g => new CountByLabelDto(g.Key, g.Count()))
            .OrderByDescending(s => s.Count)
            .ThenBy(s => s.Label)
            .ToList();

        var byHour = Enumerable.Range(0, 24)
            .Select(hour => new CountByLabelDto(HourLabel(hour), tapInTimes.Count(t => t.Hour == hour)))
            .ToList();

        var byDay = WeekOrder
            .Select(day => new CountByLabelDto(day.ToString()[..3], tapInTimes.Count(t => t.DayOfWeek == day)))
            .ToList();

        return new RidershipReportDto(
            Period: period.Dto,
            TotalJourneys: journeys.Count,
            LocalJourneys: journeys.Count(j => j.UserId != null),
            GuestJourneys: journeys.Count(j => j.UserId == null),
            IncompleteJourneys: journeys.Count(j => j.Status == JourneyStatus.InProgress || j.Status == JourneyStatus.Incomplete),
            ByStation: byStation,
            ByHourOfDay: byHour,
            ByDayOfWeek: byDay);
    }

    public async Task<RevenueReportDto> GenerateRevenueReportAsync(DateOnly? from, DateOnly? to)
    {
        var period = ResolvePeriod(from, to);
        var journeys = await _reportRepository.GetCompletedJourneysTappedOutBetweenAsync(period.FromUtc, period.ToUtc);

        var totalRevenue = journeys.Sum(j => j.FareAmount);

        var journeysByDate = journeys
            .GroupBy(j => DateOnly.FromDateTime(ToLocal(j.TapOutTimeUtc!.Value)))
            .ToDictionary(g => g.Key, g => g.ToList());

        var byDay = new List<RevenueByLabelDto>();
        for (var date = period.From; date <= period.To; date = date.AddDays(1))
        {
            var dayJourneys = journeysByDate.GetValueOrDefault(date) ?? new List<Journey>();
            byDay.Add(new RevenueByLabelDto(date.ToString("yyyy-MM-dd"), dayJourneys.Sum(j => j.FareAmount), dayJourneys.Count));
        }

        var byStation = journeys
            .GroupBy(j => j.TapInStation)
            .Select(g => new RevenueByLabelDto(g.Key, g.Sum(j => j.FareAmount), g.Count()))
            .OrderByDescending(s => s.Amount)
            .ThenBy(s => s.Label)
            .ToList();

        var notes = new List<string>
        {
            "Revenue covers fares charged at tap-out for completed journeys.",
            "Guest pass sales are not included because pass prices are not yet recorded.",
            "Account top-ups are not included here; they are prepaid credit, and fares are counted when that credit is spent on journeys."
        };

        return new RevenueReportDto(
            Period: period.Dto,
            TotalFareRevenue: totalRevenue,
            CompletedJourneys: journeys.Count,
            AverageFare: journeys.Count == 0 ? 0m : Math.Round(totalRevenue / journeys.Count, 2),
            ByDay: byDay,
            ByStation: byStation,
            Notes: notes);
    }

    public async Task<FareEvasionReportDto> GenerateFareEvasionReportAsync(DateOnly? from, DateOnly? to)
    {
        var period = ResolvePeriod(from, to);
        var inspections = await _reportRepository.GetInspectionsBetweenAsync(period.FromUtc, period.ToUtc);
        var invalidCount = inspections.Count(i => !i.IsValid);

        var byReason = Enum.GetValues<InspectionResult>()
            .Where(result => result != InspectionResult.Valid)
            .Select(result => new CountByLabelDto(result.ToString(), inspections.Count(i => i.Result == result)))
            .ToList();

        var byLocation = inspections
            .GroupBy(i => string.IsNullOrWhiteSpace(i.Location) ? "Not specified" : i.Location.Trim())
            .Select(g => ToEvasionRow(g.Key, g.ToList()))
            .OrderByDescending(r => r.Invalid)
            .ThenByDescending(r => r.RatePercent)
            .ToList();

        var byTokenType = inspections
            .GroupBy(i => TokenTypeLabel(i.TokenType))
            .Select(g => ToEvasionRow(g.Key, g.ToList()))
            .OrderBy(r => r.Label)
            .ToList();

        var byHour = Enumerable.Range(0, 24)
            .Select(hour => ToEvasionRow(HourLabel(hour), inspections.Where(i => ToLocal(i.InspectedAtUtc).Hour == hour).ToList()))
            .ToList();

        return new FareEvasionReportDto(
            Period: period.Dto,
            TotalInspections: inspections.Count,
            InvalidInspections: invalidCount,
            EvasionRatePercent: RatePercent(invalidCount, inspections.Count),
            ByReason: byReason,
            ByLocation: byLocation,
            ByTokenType: byTokenType,
            ByHourOfDay: byHour);
    }

    /// <summary>
    /// Converts inclusive local dates into a UTC range [FromUtc, ToUtc) for querying.
    /// </summary>
    private ReportPeriod ResolvePeriod(DateOnly? from, DateOnly? to)
    {
        var today = DateOnly.FromDateTime(ToLocal(DateTime.UtcNow));
        var toDate = to ?? today;
        var fromDate = from ?? toDate.AddDays(-(DefaultPeriodDays - 1));

        if (fromDate > toDate)
        {
            throw new ArgumentException("The 'from' date must be on or before the 'to' date.");
        }

        if (toDate.DayNumber - fromDate.DayNumber + 1 > MaxPeriodDays)
        {
            throw new ArgumentException($"The report period cannot be longer than {MaxPeriodDays} days.");
        }

        var fromUtc = TimeZoneInfo.ConvertTimeToUtc(fromDate.ToDateTime(TimeOnly.MinValue), _timeZone);
        var toUtc = TimeZoneInfo.ConvertTimeToUtc(toDate.AddDays(1).ToDateTime(TimeOnly.MinValue), _timeZone);

        return new ReportPeriod(fromDate, toDate, fromUtc, toUtc, new ReportPeriodDto(fromDate, toDate, _timeZone.Id));
    }

    private DateTime ToLocal(DateTime utc)
    {
        return TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(utc, DateTimeKind.Utc), _timeZone);
    }

    private static TimeZoneInfo ResolveTimeZone(string timeZoneId, ILogger logger)
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById(timeZoneId);
        }
        catch (Exception ex) when (ex is TimeZoneNotFoundException or InvalidTimeZoneException)
        {
            logger.LogWarning("Reporting time zone '{TimeZone}' not found. Falling back to UTC.", timeZoneId);
            return TimeZoneInfo.Utc;
        }
    }

    private static EvasionByLabelDto ToEvasionRow(string label, IReadOnlyCollection<TicketInspection> inspections)
    {
        var invalid = inspections.Count(i => !i.IsValid);
        return new EvasionByLabelDto(label, inspections.Count, invalid, RatePercent(invalid, inspections.Count));
    }

    private static decimal RatePercent(int part, int total)
    {
        return total == 0 ? 0m : Math.Round(part * 100m / total, 1);
    }

    private static string HourLabel(int hour) => $"{hour:00}:00";

    private static string TokenTypeLabel(string tokenType) => tokenType switch
    {
        "LOCAL" => "Local account",
        "GUEST" => "Guest pass",
        _ => "Unknown"
    };

    private sealed record ReportPeriod(DateOnly From, DateOnly To, DateTime FromUtc, DateTime ToUtc, ReportPeriodDto Dto);
}
