namespace Ticketing_System_Backend.Services.Fare;

/// <summary>
/// Fare policy (design: FareCalculationStrategy). Each city picks one through configuration,
/// so the journey and tap logic never change when the fare rules do.
/// </summary>
public interface IFareStrategy
{
    string StrategyName { get; }

    /// <summary>
    /// Highest fare this policy can charge. Used when a passenger never taps out.
    /// </summary>
    decimal MaximumFare { get; }

    decimal CalculateFare(FareContext context);
}
