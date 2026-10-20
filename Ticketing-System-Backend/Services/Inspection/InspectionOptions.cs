namespace Ticketing_System_Backend.Services.Inspection;

/// <summary>
/// City-configurable inspection settings, bound from the "Inspection" section of appsettings.json.
/// </summary>
public class InspectionOptions
{
    public const string SectionName = "Inspection";

    /// <summary>
    /// A journey tapped in longer ago than this is treated as stale (passenger forgot to tap out).
    /// </summary>
    public int ActiveJourneyMaxHours { get; set; } = 4;

    /// <summary>
    /// A repeat scan of the same token within this window reuses the earlier result instead of recording a new inspection.
    /// </summary>
    public int DuplicateScanWindowMinutes { get; set; } = 2;
}
