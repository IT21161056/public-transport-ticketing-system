using System.Threading.Tasks;
using Ticketing_System_Backend.Models.Dtos;

namespace Ticketing_System_Backend.Services.TopUp;

/// <summary>
/// Abstract base class for top-up channels (design class: TopUpChannel).
/// Delegates payment authorization to PaymentGateway after channel-level validation.
/// </summary>
public abstract class TopUpChannel : ITopUpChannel
{
    protected readonly IPaymentGateway Gateway;

    protected TopUpChannel(IPaymentGateway gateway)
    {
        Gateway = gateway;
    }

    public abstract string ChannelName { get; }
    protected abstract string ReferencePrefix { get; }

    /// <summary>
    /// Sequence Diagram Step 7-9:
    /// topUp(amount, paymentDetails) -> gateway.processPayment(amount, paymentDetails)
    /// </summary>
    public async Task<ChannelTopUpResult> TopUpAsync(decimal amount, TopUpPaymentDetailsDto paymentDetails)
    {
        var validationError = ValidatePaymentDetails(paymentDetails);
        if (validationError != null)
        {
            return new ChannelTopUpResult(
                PaymentAuthorized: false,
                PaymentReference: $"{ReferencePrefix}-REJECTED",
                FailureReason: validationError
            );
        }

        // Step 8-9: gateway.processPayment(amount, paymentDetails) -> paymentAuthorized : boolean
        var gatewayResult = await Gateway.ProcessPaymentAsync(amount, paymentDetails, ReferencePrefix);

        // Step 10 / Step 17: return true / false to TopUpTransaction
        return new ChannelTopUpResult(
            PaymentAuthorized: gatewayResult.PaymentAuthorized,
            PaymentReference: FormatReference(gatewayResult.PaymentReference, paymentDetails),
            FailureReason: gatewayResult.FailureReason
        );
    }

    protected abstract string? ValidatePaymentDetails(TopUpPaymentDetailsDto paymentDetails);

    protected virtual string FormatReference(string baseReference, TopUpPaymentDetailsDto paymentDetails)
    {
        return baseReference;
    }
}

