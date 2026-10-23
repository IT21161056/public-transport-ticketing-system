using System;
using System.Threading.Tasks;
using Ticketing_System_Backend.Models.Dtos;
using Ticketing_System_Backend.Services.TopUp;

namespace Ticketing_System_Backend.Models.Entities;

/// <summary>
/// Represents a top-up transaction (design class: TopUpTransaction).
/// Coordinates channel resolution via TopUpChannelFactory, payment processing,
/// status transitions ("SUCCESS" / "FAILED"), and account balance/ledger updates.
/// </summary>
public class TopUpTransaction
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public User? User { get; set; }

    public decimal Amount { get; set; }
    public decimal BonusAmount { get; set; }
    public decimal TotalCredits { get; set; }

    /// <summary>
    /// Requested payment method ("ONLINE", "MOBILE", "PAYSTATION").
    /// </summary>
    public string Method { get; set; } = "ONLINE";

    /// <summary>
    /// Concrete channel resolved by TopUpChannelFactory
    /// ("OnlineChannel", "MobileChannel", or "PayStationChannel").
    /// </summary>
    public string ChannelName { get; set; } = "OnlineChannel";

    /// <summary>
    /// Transaction status: "PENDING", "SUCCESS", or "FAILED".
    /// </summary>
    public string Status { get; set; } = "PENDING";

    public string? PaymentReference { get; set; }
    public string? FailureReason { get; set; }
    public decimal BalanceAfter { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public TopUpTransaction()
    {
    }

    /// <summary>
    /// Sequence Diagram Step 2-3: create TopUpTransaction(amount, method)
    /// </summary>
    public TopUpTransaction(Guid userId, decimal amount, string method, decimal bonusAmount = 0m)
    {
        Id = Guid.NewGuid();
        UserId = userId;
        Amount = amount;
        BonusAmount = bonusAmount < 0 ? 0 : bonusAmount;
        TotalCredits = amount + BonusAmount;
        Method = string.IsNullOrWhiteSpace(method) ? "ONLINE" : method.Trim().ToUpperInvariant();
        Status = "PENDING";
        CreatedAtUtc = DateTime.UtcNow;
    }

    /// <summary>
    /// Sequence Diagram Steps 11 & 18: setStatus("SUCCESS") / setStatus("FAILED")
    /// </summary>
    public void SetStatus(string status, string? failureReason = null)
    {
        Status = status;
        FailureReason = failureReason;
    }

    /// <summary>
    /// Sequence Diagram Step 4: execute()
    /// Resolves the TopUpChannel from TopUpChannelFactory, executes channel.topUp(amount, paymentDetails),
    /// and updates the Account accordingly for both SUCCESS and FAILED branches.
    /// </summary>
    public async Task<bool> ExecuteAsync(
        User account,
        TopUpChannelFactory channelFactory,
        TopUpPaymentDetailsDto paymentDetails)
    {
        // Step 5-6: getChannel(method) -> channel : TopUpChannel
        var channel = channelFactory.GetChannel(Method);
        ChannelName = channel.ChannelName;

        // Step 7-9: channel.topUp(amount, paymentDetails) -> gateway.processPayment(amount, paymentDetails)
        var channelResult = await channel.TopUpAsync(Amount, paymentDetails);
        PaymentReference = channelResult.PaymentReference;

        if (channelResult.PaymentAuthorized)
        {
            // Alt branch 1: [Payment Successful (paymentAuthorized == true)]
            // Step 11: setStatus("SUCCESS")
            SetStatus("SUCCESS");

            // Step 12-13: account.topUp(amount) -> balanceUpdated
            BalanceAfter = account.TopUp(TotalCredits);

            // Step 14-15: account.addTransaction(tx) -> transactionRecorded
            account.AddTransaction(this);

            // Step 16: true (New Balance & Receipt Confirmed)
            return true;
        }
        else
        {
            // Alt branch 2: [Payment Declined (paymentAuthorized == false)]
            // Step 18: setStatus("FAILED")
            SetStatus("FAILED", channelResult.FailureReason ?? "Payment declined by gateway.");
            BalanceAfter = account.CreditBalance;

            // Step 19-20: account.addTransaction(tx) -> failedAttemptRecorded
            account.AddTransaction(this);

            // Step 21: false (Payment Failed - Balance Unchanged)
            return false;
        }
    }
}

