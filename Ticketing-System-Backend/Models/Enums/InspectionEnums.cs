namespace Ticketing_System_Backend.Models.Enums;

/// <summary>
/// Outcome of a ticket inspection performed by an Inspector's handheld reader.
/// Replaces the design's boolean <c>result</c> so that the fare-evasion report
/// can distinguish why a passenger failed the check.
/// </summary>
public enum InspectionResult
{
    Valid = 0,
    NoActiveJourney = 1,
    StaleJourney = 2,
    InvalidToken = 3,
    Expired = 4,
    AccountSuspended = 5
}
