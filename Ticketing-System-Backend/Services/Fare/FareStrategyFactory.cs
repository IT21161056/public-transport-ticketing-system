using System;
using Microsoft.Extensions.Options;
using Ticketing_System_Backend.Models.Enums;

namespace Ticketing_System_Backend.Services.Fare;

public interface IFareStrategyFactory
{
    IFareStrategy GetStrategy(TokenType tokenType);
}

/// <summary>
/// Factory Method (design: FareStrategyFactory.getStrategy(cityPolicy)).
/// Picks the fare strategy at runtime from the city's "Fare:Policy" setting.
/// </summary>
public class FareStrategyFactory : IFareStrategyFactory
{
    private readonly FareOptions _options;
    private readonly DistanceBasedFareStrategy _distanceBased;
    private readonly FlatRateFareStrategy _flatRate;
    private readonly PrepaidPassFareStrategy _prepaidPass;

    public FareStrategyFactory(
        IOptions<FareOptions> options,
        DistanceBasedFareStrategy distanceBased,
        FlatRateFareStrategy flatRate,
        PrepaidPassFareStrategy prepaidPass)
    {
        _options = options.Value;
        _distanceBased = distanceBased;
        _flatRate = flatRate;
        _prepaidPass = prepaidPass;
    }

    public IFareStrategy GetStrategy(TokenType tokenType)
    {
        if (tokenType == TokenType.GuestPass)
        {
            return _prepaidPass;
        }

        if (string.Equals(_options.Policy, FareOptions.FlatPolicy, StringComparison.OrdinalIgnoreCase))
        {
            return _flatRate;
        }

        if (string.Equals(_options.Policy, FareOptions.DistanceBasedPolicy, StringComparison.OrdinalIgnoreCase))
        {
            return _distanceBased;
        }

        // Unreachable when options are validated at startup (see ServiceExtensions)
        throw new InvalidOperationException($"Unknown fare policy '{_options.Policy}'.");
    }

    /// <summary>
    /// Used by the startup check so a typo in "Fare:Policy" stops the API at launch, not on a passenger's tap-out.
    /// </summary>
    public static bool IsKnownPolicy(string? policy) =>
        string.Equals(policy, FareOptions.DistanceBasedPolicy, StringComparison.OrdinalIgnoreCase) ||
        string.Equals(policy, FareOptions.FlatPolicy, StringComparison.OrdinalIgnoreCase);
}
