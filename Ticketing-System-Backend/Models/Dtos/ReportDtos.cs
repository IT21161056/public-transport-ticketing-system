using System;
using System.Collections.Generic;

namespace Ticketing_System_Backend.Models.Dtos;

/// <summary>
/// Reporting period in the city's local time. Both dates are inclusive.
/// </summary>
public record ReportPeriodDto(
    DateOnly From,
    DateOnly To,
    string TimeZone
);

public record CountByLabelDto(
    string Label,
    int Count
);

public record RevenueByLabelDto(
    string Label,
    decimal Amount,
    int Journeys
);

public record EvasionByLabelDto(
    string Label,
    int Inspections,
    int Invalid,
    decimal RatePercent
);

/// <summary>
/// Passenger usage of the network, for timetable planning and spotting overcrowding.
/// </summary>
public record RidershipReportDto(
    ReportPeriodDto Period,
    int TotalJourneys,
    int LocalJourneys,
    int GuestJourneys,
    int IncompleteJourneys,
    IReadOnlyList<CountByLabelDto> ByStation,
    IReadOnlyList<CountByLabelDto> ByHourOfDay,
    IReadOnlyList<CountByLabelDto> ByDayOfWeek
);

/// <summary>
/// Fares collected from completed journeys, for financial planning.
/// </summary>
public record RevenueReportDto(
    ReportPeriodDto Period,
    decimal TotalFareRevenue,
    int CompletedJourneys,
    decimal AverageFare,
    IReadOnlyList<RevenueByLabelDto> ByDay,
    IReadOnlyList<RevenueByLabelDto> ByStation,
    IReadOnlyList<string> Notes
);

/// <summary>
/// How often inspectors find passengers without a valid ticket, to decide where inspectors are needed.
/// </summary>
public record FareEvasionReportDto(
    ReportPeriodDto Period,
    int TotalInspections,
    int InvalidInspections,
    decimal EvasionRatePercent,
    IReadOnlyList<CountByLabelDto> ByReason,
    IReadOnlyList<EvasionByLabelDto> ByLocation,
    IReadOnlyList<EvasionByLabelDto> ByTokenType,
    IReadOnlyList<EvasionByLabelDto> ByHourOfDay
);
