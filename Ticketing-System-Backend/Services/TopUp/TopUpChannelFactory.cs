using System;
using Ticketing_System_Backend.Services.TopUp.Channels;

namespace Ticketing_System_Backend.Services.TopUp;

/// <summary>
/// Factory class that resolves the appropriate TopUpChannel based on the payment method
/// (design class: TopUpChannelFactory).
/// Sequence Diagram Step 5-6: getChannel(method) -> Returns OnlineChannel, MobileChannel, or PayStationChannel.
/// </summary>
public class TopUpChannelFactory
{
    private readonly OnlineChannel _onlineChannel;
    private readonly MobileChannel _mobileChannel;
    private readonly PayStationChannel _payStationChannel;

    public TopUpChannelFactory(
        OnlineChannel onlineChannel,
        MobileChannel mobileChannel,
        PayStationChannel payStationChannel)
    {
        _onlineChannel = onlineChannel;
        _mobileChannel = mobileChannel;
        _payStationChannel = payStationChannel;
    }

    /// <summary>
    /// Sequence Diagram Step 5-6: getChannel(method)
    /// Returns OnlineChannel, MobileChannel, or PayStationChannel.
    /// </summary>
    public ITopUpChannel GetChannel(string? method)
    {
        var normalized = (method ?? "ONLINE").Trim().ToUpperInvariant();

        return normalized switch
        {
            "ONLINE" or "ONLINECHANNEL" or "CARD" or "CREDIT_CARD" or "DEBIT_CARD" => _onlineChannel,
            "MOBILE" or "MOBILECHANNEL" or "APPLE_PAY" or "GOOGLE_PAY" or "DIGITAL_WALLET" => _mobileChannel,
            "PAYSTATION" or "PAY_STATION" or "PAYSTATIONCHANNEL" or "KIOSK" or "STATION" => _payStationChannel,
            _ => throw new ArgumentException($"Unsupported top-up channel method: '{method}'. Expected ONLINE, MOBILE, or PAYSTATION.")
        };
    }
}

