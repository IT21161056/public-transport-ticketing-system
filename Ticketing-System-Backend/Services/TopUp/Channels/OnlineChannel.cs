using System.Linq;
using Ticketing_System_Backend.Models.Dtos;

namespace Ticketing_System_Backend.Services.TopUp.Channels;

/// <summary>
/// Online payment channel for Credit/Debit Cards and Web Banking (design class: OnlineChannel).
/// </summary>
public class OnlineChannel : TopUpChannel
{
    public OnlineChannel(IPaymentGateway gateway) : base(gateway)
    {
    }

    public override string ChannelName => "OnlineChannel";
    protected override string ReferencePrefix => "ONL";

    protected override string? ValidatePaymentDetails(TopUpPaymentDetailsDto paymentDetails)
    {
        if (!string.IsNullOrWhiteSpace(paymentDetails.CardNumber))
        {
            var digits = new string(paymentDetails.CardNumber.Where(char.IsDigit).ToArray());
            if (digits.Length < 12)
            {
                return "Invalid card number for OnlineChannel. Please enter at least 12 digits.";
            }
        }
        return null;
    }

    protected override string FormatReference(string baseReference, TopUpPaymentDetailsDto paymentDetails)
    {
        if (!string.IsNullOrWhiteSpace(paymentDetails.CardNumber))
        {
            var digits = new string(paymentDetails.CardNumber.Where(char.IsDigit).ToArray());
            if (digits.Length >= 4)
            {
                return $"{baseReference}-CARD{digits[^4..]}";
            }
        }
        return baseReference;
    }
}

