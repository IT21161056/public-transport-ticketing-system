using System;

namespace Ticketing_System_Backend.Models.Entities;

/// <summary>
/// Position of a stop on a route. Sequence starts at 1 and follows the direction of travel.
/// </summary>
public class RouteStop
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid RouteId { get; set; }
    public TransitRoute? Route { get; set; }
    public Guid StopId { get; set; }
    public Stop? Stop { get; set; }
    public int Sequence { get; set; }

    /// <summary>
    /// Road distance from the first stop of the route, for per-kilometre fare policies.
    /// </summary>
    public decimal DistanceFromStartKm { get; set; }
}
