namespace Ticketing_System_Backend.Services.Fare;

public interface IFareStrategy
{
    string StrategyName { get; }
    decimal CalculateFare(string tapInStation, string? tapOutStation);
}
