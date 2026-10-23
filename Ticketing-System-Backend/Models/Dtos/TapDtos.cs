using System;
using System.Collections.Generic;

namespace Ticketing_System_Backend.Models.Dtos;

/// <summary>
/// A tap on a bus boarding reader. The reader knows its bus and the stop it is at.
/// </summary>
public record TapRequest(string QrPayload, Guid BusId, Guid StopId);

/// <summary>
/// What the reader shows the passenger and driver after a tap.
/// Rejections are normal outcomes, so they also come back as 200 with Accepted = false.
/// </summary>
public record TapResponse(
    string Action,                 // TapIn | TapOut | Rejected
    string Result,                 // TapResult name
    bool Accepted,
    string Message,
    string TokenType,              // LOCAL | GUEST | Unknown
    bool IsRepeatTap,
    TapJourneyDto? Journey,
    decimal? BalanceAfter,         // account passengers only
    decimal MinimumBalance,
    DateTime? PassExpiresAtUtc,    // guest passes only
    TapJourneyDto? AutoClosedJourney // earlier journey closed with the maximum fare (no tap-out)
);

public record TapJourneyDto(
    Guid Id,
    string Status,
    string BoardingStop,
    DateTime TapInTimeUtc,
    string? AlightingStop,
    DateTime? TapOutTimeUtc,
    int? StopsTravelled,
    decimal FareCharged,
    string? FarePolicy
);

/// <summary>
/// Routes, stops and buses for setting up a boarding reader, plus the fare settings it displays.
/// </summary>
public record TransitNetworkDto(
    IReadOnlyList<TransitRouteDto> Routes,
    string FarePolicy,
    decimal MinimumBalance
);

public record TransitRouteDto(
    Guid Id,
    string RouteNumber,
    string Name,
    IReadOnlyList<TransitStopDto> Stops,
    IReadOnlyList<TransitBusDto> Buses
);

public record TransitStopDto(Guid Id, string Code, string Name, int Zone, int Sequence, decimal DistanceFromStartKm);

public record TransitBusDto(Guid Id, string RegistrationNumber);
