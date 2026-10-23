using System;
using System.Threading.Tasks;
using Ticketing_System_Backend.Models.Dtos;

namespace Ticketing_System_Backend.Services.TopUp;

/// <summary>
/// Concrete implementation of PaymentGateway (design class: PaymentGateway).
/// Authorizes or declines top-up payments and issues an authorization reference.
/// </summary>
public class PaymentGateway : IPaymentGateway
{
    public Task<PaymentGatewayResult> ProcessPaymentAsync(
        decimal amount,
        TopUpPaymentDetailsDto paymentDetails,
        string channelPrefix)
    {
        var referenceCode = $"{channelPrefix}-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}";

        if (amount <= 0)
        {
            return Task.FromResult(new PaymentGatewayResult(
                PaymentAuthorized: false,
                PaymentReference: referenceCode,
                FailureReason: "Payment amount must be greater than zero."
            ));
        }

        // Support explicit decline simulation from the UI or test credentials (e.g., card ending in 0000 or voucher "DECLINE")
        bool isDeclinedCard = !string.IsNullOrWhiteSpace(paymentDetails.CardNumber) &&
                              paymentDetails.CardNumber.Trim().EndsWith("0000", StringComparison.Ordinal);

        bool isDeclinedVoucher = !string.IsNullOrWhiteSpace(paymentDetails.VoucherCode) &&
                                 paymentDetails.VoucherCode.Trim().Equals("DECLINE", StringComparison.OrdinalIgnoreCase);

        if (paymentDetails.SimulateDecline || isDeclinedCard || isDeclinedVoucher)
        {
            return Task.FromResult(new PaymentGatewayResult(
                PaymentAuthorized: false,
                PaymentReference: referenceCode,
                FailureReason: "Payment declined by issuing bank / payment gateway (Authorization Failed)."
            ));
        }

        return Task.FromResult(new PaymentGatewayResult(
            PaymentAuthorized: true,
            PaymentReference: referenceCode,
            FailureReason: null
        ));
    }
}

