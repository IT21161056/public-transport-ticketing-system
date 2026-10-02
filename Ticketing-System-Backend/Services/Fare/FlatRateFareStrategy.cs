namespace Ticketing_System_Backend.Services.Fare;

/// <summary>
/// Flat-Rate / Pass-Based Fare Strategy:
/// Used for Guest Pass Users with pre-paid unlimited passes. The fare deducted per journey is 0.00.
/// </summary>
public class FlatRateFareStrategy : IFareStrategy
{
    public string StrategyName => "Flat-Rate/Pass-Based";

    public decimal CalculateFare(string tapInStation, string? tapOutStation)
    {
        return 0.00m;
    }
}
