namespace Ticketing_System_Backend.Services.Tap;

/// <summary>
/// Boarding reader rules, bound from the "Tap" section of appsettings.json.
/// How long a journey may stay open comes from Inspection:ActiveJourneyMaxHours,
/// so the reader and the inspector agree on when a journey is stale.
/// </summary>
public class TapOptions
{
    public const string SectionName = "Tap";

    /// <summary>
    /// Account passengers need at least this balance to tap in.
    /// The worst-case balance after a journey is MinimumBalance - Fare:MaxFare.
    /// </summary>
    public decimal MinimumBalance { get; set; } = 100.00m;

    /// <summary>
    /// A second tap of the same ticket on the same bus within this window repeats the last result instead of acting again.
    /// </summary>
    public int DuplicateTapSeconds { get; set; } = 60;

    /// <summary>
    /// Tapping out at the boarding stop within this window cancels the journey without a charge.
    /// </summary>
    public int SameStopCancelMinutes { get; set; } = 5;
}
