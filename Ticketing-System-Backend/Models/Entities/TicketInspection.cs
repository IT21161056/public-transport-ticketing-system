using System;
using Ticketing_System_Backend.Models.Enums;

namespace Ticketing_System_Backend.Models.Entities;

/// <summary>
/// A single token check performed by a Ticket Inspector (design class: TicketInspection).
/// Every scan is persisted, valid or not, so it can feed the fare-evasion report.
/// </summary>
public class TicketInspection
{
    public Guid Id { get; set; } = Guid.NewGuid();

    // Who was checked: identifier and type parsed from the QR payload
    public string TokenIdentifier { get; set; } = string.Empty;
    public string TokenType { get; set; } = string.Empty; // "LOCAL" or "GUEST"
    public Guid? UserId { get; set; }
    public string? DeviceUuid { get; set; }

    // Journey the passenger was on at the time of inspection (design: 0..1)
    public Guid? JourneyId { get; set; }
    public Journey? Journey { get; set; }

    public InspectionResult Result { get; set; } = InspectionResult.Valid;
    public string? Location { get; set; }
    public Guid? InspectorId { get; set; }
    public DateTime InspectedAtUtc { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Design method getResult(): true when the passenger holds a valid ticket.
    /// </summary>
    public bool IsValid => Result == InspectionResult.Valid;
}
