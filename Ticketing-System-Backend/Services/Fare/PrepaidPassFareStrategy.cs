namespace Ticketing_System_Backend.Services.Fare;

/// <summary>
/// Pre-paid Pass Strategy for visitors: the pass was paid for at purchase,
/// so a journey costs nothing at tap-out (design: Scenario 2, step 5).
/// </summary>
public class PrepaidPassFareStrategy : IFareStrategy
{
    public string StrategyName => "Pre-paid Pass";

    public decimal MaximumFare => 0.00m;

    public decimal CalculateFare(FareContext context)
    {
        return 0.00m;
    }
}
