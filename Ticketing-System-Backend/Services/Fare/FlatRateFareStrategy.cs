using Microsoft.Extensions.Options;

namespace Ticketing_System_Backend.Services.Fare;

/// <summary>
/// Flat-Rate Fare Strategy: every journey costs the same, however far the passenger travels.
/// Selected with "Fare:Policy": "Flat" for cities that charge a single fare.
/// </summary>
public class FlatRateFareStrategy : IFareStrategy
{
    private readonly FareOptions _options;

    public FlatRateFareStrategy(IOptions<FareOptions> options)
    {
        _options = options.Value;
    }

    public string StrategyName => "Flat-Rate";

    public decimal MaximumFare => _options.FlatFare;

    public decimal CalculateFare(FareContext context)
    {
        return _options.FlatFare;
    }
}
