namespace Ticketing_System_Backend.Models.Enums;

/// <summary>
/// What the boarding reader did with a tap.
/// </summary>
public enum TapAction
{
    TapIn = 0,
    TapOut = 1,
    Rejected = 2
}

/// <summary>
/// Detailed outcome of a tap, shown on the reader and used for the audio/visual feedback.
/// </summary>
public enum TapResult
{
    TapInAccepted = 0,
    TapOutCompleted = 1,
    JourneyCancelled = 2,
    InvalidToken = 3,
    PassExpired = 4,
    AccountSuspended = 5,
    InsufficientBalance = 6
}
