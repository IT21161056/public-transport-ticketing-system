using System;

namespace Ticketing_System_Backend.Models.Entities;

public class OtpVerification
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string PhoneNumber { get; set; } = string.Empty;
    public string OtpCode { get; set; } = string.Empty;
    public string Purpose { get; set; } = "register";
    public string? FullName { get; set; }
    public int Attempts { get; set; } = 0;
    public bool IsUsed { get; set; } = false;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAtUtc { get; set; }
}
