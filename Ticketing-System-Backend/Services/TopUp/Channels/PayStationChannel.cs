using Ticketing_System_Backend.Models.Dtos;

namespace Ticketing_System_Backend.Services.TopUp.Channels;

/// <summary>
/// Physical station kiosk and voucher top-up channel (design class: PayStationChannel).
/// </summary>
public class PayStationChannel : TopUpChannel
{
    public PayStationChannel(IPaymentGateway gateway) : base(gateway)
    {
    }

    public override string ChannelName => "PayStationChannel";
    protected override string ReferencePrefix => "PST";

    protected override string? ValidatePaymentDetails(TopUpPaymentDetailsDto paymentDetails)
    {
        if (!string.IsNullOrWhiteSpace(paymentDetails.VoucherCode) &&
            paymentDetails.VoucherCode.Trim().Length < 4)
        {
            return "Invalid station kiosk voucher/receipt code for PayStationChannel.";
        }
        return null;
    }

    protected override string FormatReference(string baseReference, TopUpPaymentDetailsDto paymentDetails)
    {
        var station = string.IsNullOrWhiteSpace(paymentDetails.StationId)
            ? "KIOSK01"
            : paymentDetails.StationId.Trim().ToUpperInvariant().Replace(" ", "");
        return $"{baseReference}-{station}";
    }
}

