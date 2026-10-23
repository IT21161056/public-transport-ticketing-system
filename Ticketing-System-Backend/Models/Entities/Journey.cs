using System;
using Ticketing_System_Backend.Models.Enums;

namespace Ticketing_System_Backend.Models.Entities;

public class Journey
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? UserId { get; set; }
    public User? User { get; set; }
    public string? DeviceUuid { get; set; }
    public Guid? TokenId { get; set; }
    public TransportToken? Token { get; set; }
    public string TapInStation { get; set; } = string.Empty;
    public DateTime TapInTimeUtc { get; set; } = DateTime.UtcNow;
    public string? TapOutStation { get; set; }
    public DateTime? TapOutTimeUtc { get; set; }
    public decimal FareAmount { get; set; } = 0.00m;
    public JourneyStatus Status { get; set; } = JourneyStatus.InProgress;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    // Set by the boarding reader. Nullable because demo/report seed journeys only carry station names.
    public Guid? RouteId { get; set; }
    public TransitRoute? Route { get; set; }
    public Guid? BusId { get; set; }
    public Bus? Bus { get; set; }
    public Guid? BoardingStopId { get; set; }
    public Stop? BoardingStop { get; set; }
    public Guid? AlightingStopId { get; set; }
    public Stop? AlightingStop { get; set; }

    /// <summary>
    /// Stops between boarding and alighting stop on the route, worked out at tap-out.
    /// </summary>
    public int? StopsTravelled { get; set; }

    /// <summary>
    /// Fare policy used at tap-out (e.g. "Distance-Based"), so the charge can be explained later.
    /// </summary>
    public string? FarePolicy { get; set; }
}
