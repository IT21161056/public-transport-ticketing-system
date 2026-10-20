using System.Threading.Tasks;
using Ticketing_System_Backend.Models.Enums;

namespace Ticketing_System_Backend.Services.Inspection;

/// <summary>
/// Chain of Responsibility handler for ticket inspection.
/// Each rule performs one check and either stops the chain with a failure
/// or passes the request on to the next rule.
/// </summary>
public interface IInspectionRule
{
    /// <summary>
    /// Links the next rule in the chain and returns it, so rules can be chained fluently.
    /// </summary>
    IInspectionRule SetNext(IInspectionRule next);

    Task<InspectionResult> HandleAsync(InspectionContext context);
}
