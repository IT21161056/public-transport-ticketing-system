using Ticketing_System_Backend.Models.Dtos;

namespace Ticketing_System_Backend.Services.TopUp.Channels;

/// <summary>
/// Mobile wallet and phone payment channel (design class: MobileChannel).
/// </summary>
public class MobileChannel : TopUpChannel
{
    public MobileChannel(IPaymentGateway gateway) : base(gateway)
    {
    }

    public override string ChannelName => "MobileChannel";
    protected override string ReferencePrefix => "MOB";

    protected override string? ValidatePaymentDetails(TopUpPaymentDetailsDto paymentDetails)
    {
        if (!string.IsNullOrWhiteSpace(paymentDetails.MobileNumber) &&
            paymentDetails.MobileNumber.Trim().Length < 7)
        {
            return "Invalid mobile wallet phone number for MobileChannel.";
        }
        return null;
    }

    protected override string FormatReference(string baseReference, TopUpPaymentDetailsDto paymentDetails)
    {
        var provider = string.IsNullOrWhiteSpace(paymentDetails.MobileProvider)
            ? "WALLET"
            : paymentDetails.MobileProvider.Trim().ToUpperInvariant().Replace(" ", "");
        return $"{baseReference}-{provider}";
    }
}

