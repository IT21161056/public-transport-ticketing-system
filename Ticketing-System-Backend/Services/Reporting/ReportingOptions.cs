namespace Ticketing_System_Backend.Services.Reporting;

/// <summary>
/// City-configurable reporting settings, bound from the "Reporting" section of appsettings.json.
/// </summary>
public class ReportingOptions
{
    public const string SectionName = "Reporting";

    /// <summary>
    /// IANA time zone of the city. Times are stored in UTC and converted to this zone for
    /// hour-of-day, day-of-week and per-day grouping.
    /// </summary>
    public string TimeZone { get; set; } = "Asia/Colombo";

    /// <summary>
    /// When true, 30 days of demo journeys and inspections are seeded once at startup for report demonstrations.
    /// </summary>
    public bool SeedDemoData { get; set; } = false;
}
