using System;

namespace Ticketing_System_Backend.Services.Fare;

/// <summary>
/// Distance-Based Fare Strategy:
/// Used for Local Users, calculated at Tap-Out based on journey stations.
/// </summary>
public class DistanceBasedFareStrategy : IFareStrategy
{
    public string StrategyName => "Distance-Based";

    private const decimal BaseFare = 40.00m;
    private const decimal StationRate = 15.00m;

    public decimal CalculateFare(string tapInStation, string? tapOutStation)
    {
        if (string.IsNullOrWhiteSpace(tapOutStation) ||
            string.Equals(tapInStation, tapOutStation, StringComparison.OrdinalIgnoreCase))
        {
            return BaseFare;
        }

        // Deterministic hash distance approximation between station names
        int hash1 = Math.Abs(tapInStation.Trim().ToUpperInvariant().GetHashCode());
        int hash2 = Math.Abs(tapOutStation.Trim().ToUpperInvariant().GetHashCode());
        int stationCount = (Math.Abs(hash1 - hash2) % 6) + 1; // 1 to 6 station difference

        return BaseFare + (stationCount * StationRate);
    }
}
