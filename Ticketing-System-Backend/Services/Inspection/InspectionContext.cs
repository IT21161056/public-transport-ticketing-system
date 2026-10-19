using System;
using Ticketing_System_Backend.Models.Entities;

namespace Ticketing_System_Backend.Services.Inspection;

/// <summary>
/// Data passed along the inspection chain. Earlier rules fill in details
/// (token holder, user, active journey) that later rules rely on.
/// </summary>
public class InspectionContext
{
    public InspectionContext(string qrPayload, DateTime nowUtc)
    {
        QrPayload = qrPayload;
        NowUtc = nowUtc;
    }

    public string QrPayload { get; }
    public DateTime NowUtc { get; }

    // Set by TokenSignatureRule
    public string TokenType { get; set; } = string.Empty; // "LOCAL" or "GUEST"
    public string TokenIdentifier { get; set; } = string.Empty;

    // Set by AccountStatusRule (local users only)
    public User? User { get; set; }

    // Set by ActiveJourneyRule
    public Journey? ActiveJourney { get; set; }

    public bool IsLocalUser => TokenType == "LOCAL";
    public bool IsGuest => TokenType == "GUEST";
}
