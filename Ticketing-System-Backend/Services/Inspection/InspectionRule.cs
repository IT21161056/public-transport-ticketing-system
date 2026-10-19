using System.Threading.Tasks;
using Ticketing_System_Backend.Models.Enums;

namespace Ticketing_System_Backend.Services.Inspection;

/// <summary>
/// Base handler holding the link to the next rule.
/// Subclasses only implement <see cref="CheckAsync"/>; the passing logic lives here once.
/// </summary>
public abstract class InspectionRule : IInspectionRule
{
    private IInspectionRule? _next;

    public IInspectionRule SetNext(IInspectionRule next)
    {
        _next = next;
        return next;
    }

    public async Task<InspectionResult> HandleAsync(InspectionContext context)
    {
        var failure = await CheckAsync(context);
        if (failure.HasValue)
        {
            return failure.Value;
        }

        // End of the chain reached without any failure: the ticket is valid
        return _next == null
            ? InspectionResult.Valid
            : await _next.HandleAsync(context);
    }

    /// <summary>
    /// Performs this rule's check. Returns a failure result to stop the chain,
    /// or null to pass the request to the next rule.
    /// </summary>
    protected abstract Task<InspectionResult?> CheckAsync(InspectionContext context);
}
