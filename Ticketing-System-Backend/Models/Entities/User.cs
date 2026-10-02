using System;
using System.Collections.Generic;

namespace Ticketing_System_Backend.Models.Entities;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string? UserName { get; set; }
    public string? Email { get; set; }
    public string? PasswordHash { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public short Role { get; set; } = 0;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAtUtc { get; set; }
    public DateTime? LastLoginAtUtc { get; set; }
    public string? UserCode { get; set; }
    public decimal CreditBalance { get; set; } = 1250.00m;
    public string? PersistentQrToken { get; set; }
    public bool IsPhoneVerified { get; set; } = false;

    // Navigation properties
    public ICollection<Journey> Journeys { get; set; } = new List<Journey>();
    public ICollection<TransportToken> Tokens { get; set; } = new List<TransportToken>();
}
