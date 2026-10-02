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
}
