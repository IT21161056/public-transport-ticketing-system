using System.Threading.Tasks;
using Microsoft.Extensions.Options;
using Ticketing_System_Backend.Models.Enums;

namespace Ticketing_System_Backend.Services.Inspection.Rules;

/// <summary>
/// Rule 4: the active journey must be recent. A tap-in older than the configured limit
/// means the passenger never tapped out and has boarded again without paying.
/// </summary>
public class StaleJourneyRule : InspectionRule
{
    private readonly InspectionOptions _options;

    public StaleJourneyRule(IOptions<InspectionOptions> options)
    {
        _options = options.Value;
    }

    protected override Task<InspectionResult?> CheckAsync(InspectionContext context)
    {
        var journeyAge = context.NowUtc - context.ActiveJourney!.TapInTimeUtc;

        InspectionResult? result = journeyAge.TotalHours > _options.ActiveJourneyMaxHours
            ? InspectionResult.StaleJourney
            : null;

        return Task.FromResult(result);
    }
}
