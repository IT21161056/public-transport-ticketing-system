namespace Ticketing_System_Backend.Services.Fare;

/// <summary>
/// City fare settings, bound from the "Fare" section of appsettings.json.
/// </summary>
public class FareOptions
{
    public const string SectionName = "Fare";

    public const string DistanceBasedPolicy = "DistanceBased";
    public const string FlatPolicy = "Flat";

    /// <summary>
    /// Fare policy for account (LOCAL) passengers: "DistanceBased" or "Flat".
    /// Guest passes are always pre-paid and never charged per journey.
    /// </summary>
    public string Policy { get; set; } = DistanceBasedPolicy;

    /// <summary>
    /// Distance-based: charged for boarding, even for a zero-stop trip.
    /// </summary>
    public decimal BaseFare { get; set; } = 40.00m;

    /// <summary>
    /// Distance-based: added for every stop travelled.
    /// </summary>
    public decimal RatePerStop { get; set; } = 15.00m;

    /// <summary>
    /// Distance-based: cap on a single journey, also charged when a passenger never taps out.
    /// </summary>
    public decimal MaxFare { get; set; } = 150.00m;

    /// <summary>
    /// Flat: the same fare for every journey.
    /// </summary>
    public decimal FlatFare { get; set; } = 60.00m;
}
