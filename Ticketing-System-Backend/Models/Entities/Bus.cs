using System;

namespace Ticketing_System_Backend.Models.Entities;

/// <summary>
/// A bus running on one route. Its boarding reader (design: BoardingReader) is identified by the bus.
/// </summary>
public class Bus
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string RegistrationNumber { get; set; } = string.Empty;
    public Guid RouteId { get; set; }
    public TransitRoute? Route { get; set; }
    public bool IsActive { get; set; } = true;
}
