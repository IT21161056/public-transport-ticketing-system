using System;

namespace Ticketing_System_Backend.Models.Entities;

/// <summary>
/// A bus stop (design class: Stop). One stop can be served by several routes.
/// </summary>
public class Stop
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Fare zone (design: getZone()). Kept for cities that use a zonal fare policy.
    /// </summary>
    public int Zone { get; set; } = 1;
}
