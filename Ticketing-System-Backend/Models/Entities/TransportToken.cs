using System;
using Ticketing_System_Backend.Models.Enums;

namespace Ticketing_System_Backend.Models.Entities;

public class TransportToken
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? UserId { get; set; }
    public User? User { get; set; }
    public string? DeviceUuid { get; set; }
    public TokenType TokenType { get; set; } = TokenType.LocalUser;
    public string? PassTier { get; set; } // "1-Day", "3-Day", "7-Day"
    public string SignedToken { get; set; } = string.Empty;
    public string Nonce { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiresAtUtc { get; set; }
}
