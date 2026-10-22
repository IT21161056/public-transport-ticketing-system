using System;
using Microsoft.Extensions.Options;

namespace Ticketing_System_Backend.Services.Fare;

/// <summary>
/// Distance-Based Fare Strategy (Oyster-style, the brief's default):
/// fare = base fare + stops travelled x rate per stop, capped at the maximum fare.
/// Stops travelled comes from the stop order on the route, so the same trip always costs the same.
/// </summary>
public class DistanceBasedFareStrategy : IFareStrategy
{
    private readonly FareOptions _options;

    public DistanceBasedFareStrategy(IOptions<FareOptions> options)
    {
        _options = options.Value;
    }

    public string StrategyName => "Distance-Based";

    public decimal MaximumFare => _options.MaxFare;

    public decimal CalculateFare(FareContext context)
    {
        int stops = Math.Max(0, context.StopsTravelled);
        decimal fare = _options.BaseFare + (stops * _options.RatePerStop);
        return Math.Min(fare, _options.MaxFare);
    }
}
