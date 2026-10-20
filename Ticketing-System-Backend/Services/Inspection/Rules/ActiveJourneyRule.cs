using System.Threading.Tasks;
using Ticketing_System_Backend.Models.Enums;
using Ticketing_System_Backend.Repositories;

namespace Ticketing_System_Backend.Services.Inspection.Rules;

/// <summary>
/// Rule 3: the passenger must have tapped in, i.e. hold an in-progress journey.
/// Applies to both local users and guests (guests must tap in so managers get ridership data).
/// </summary>
public class ActiveJourneyRule : InspectionRule
{
    private readonly IJourneyRepository _journeyRepository;

    public ActiveJourneyRule(IJourneyRepository journeyRepository)
    {
        _journeyRepository = journeyRepository;
    }

    protected override async Task<InspectionResult?> CheckAsync(InspectionContext context)
    {
        context.ActiveJourney = context.User != null
            ? await _journeyRepository.GetActiveJourneyByUserIdAsync(context.User.Id)
            : await _journeyRepository.GetActiveJourneyByDeviceUuidAsync(context.TokenIdentifier);

        return context.ActiveJourney == null ? InspectionResult.NoActiveJourney : null;
    }
}
