using System.Threading.Tasks;
using Ticketing_System_Backend.Models.Dtos;

namespace Ticketing_System_Backend.Services.TopUp;

public record PaymentGatewayResult(
    bool PaymentAuthorized,
    string PaymentReference,
    string? FailureReason = null
);

/// <summary>
/// External payment gateway contract (design class: PaymentGateway).
/// </summary>
public interface IPaymentGateway
{
    /// <summary>
    /// Sequence Diagram Step 8-9: processPayment(amount, paymentDetails) -> paymentAuthorized : boolean
    /// </summary>
    Task<PaymentGatewayResult> ProcessPaymentAsync(decimal amount, TopUpPaymentDetailsDto paymentDetails, string channelPrefix);
}

