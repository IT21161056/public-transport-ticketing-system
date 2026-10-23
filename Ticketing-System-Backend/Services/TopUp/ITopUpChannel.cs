using System.Threading.Tasks;
using Ticketing_System_Backend.Models.Dtos;

namespace Ticketing_System_Backend.Services.TopUp;

public record ChannelTopUpResult(
    bool PaymentAuthorized,
    string PaymentReference,
    string? FailureReason = null
);

/// <summary>
/// Top-up channel contract (design class: TopUpChannel).
/// </summary>
public interface ITopUpChannel
{
    string ChannelName { get; }

    /// <summary>
    /// Sequence Diagram Step 7: topUp(amount, paymentDetails)
    /// </summary>
    Task<ChannelTopUpResult> TopUpAsync(decimal amount, TopUpPaymentDetailsDto paymentDetails);
}

