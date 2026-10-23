using System;
using System.Collections.Generic;

namespace Ticketing_System_Backend.Models.Entities;

/// <summary>
/// A bus route, e.g. "138 Pettah - Maharagama". Its stops are kept in travel order
/// so the fare can be worked out from how many stops a passenger travelled.
/// </summary>
public class TransitRoute
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string RouteNumber { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    public ICollection<RouteStop> Stops { get; set; } = new List<RouteStop>();
    public ICollection<Bus> Buses { get; set; } = new List<Bus>();
}
