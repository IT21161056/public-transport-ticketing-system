using System;

namespace Ticketing_System_Backend.Services.Fare;

/// <summary>
/// Everything a fare policy may need about a finished journey.
/// Distance policies use the stop count, zonal policies the zones, time-based policies the tap times.
/// </summary>
public record FareContext(
    int StopsTravelled,
    decimal DistanceKm,
    int BoardingZone,
    int AlightingZone,
    DateTime TapInTimeUtc,
    DateTime TapOutTimeUtc
);
