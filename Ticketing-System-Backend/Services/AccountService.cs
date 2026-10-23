using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Ticketing_System_Backend.Models.Dtos;
using Ticketing_System_Backend.Models.Entities;
using Ticketing_System_Backend.Repositories;
using Ticketing_System_Backend.Services.TopUp;

namespace Ticketing_System_Backend.Services;

/// <summary>
/// Commuter account service implementing RegisteredPassenger.topUpAccount(amount, method, paymentDetails)
/// and coordinating Account, TopUpTransaction, TopUpChannelFactory, TopUpChannel, and PaymentGateway.
/// </summary>
public class AccountService : IAccountService
{
    private readonly IUserRepository _userRepository;
    private readonly IJourneyRepository _journeyRepository;
    private readonly ITopUpTransactionRepository _topUpTransactionRepository;
    private readonly TopUpChannelFactory _channelFactory;

    public AccountService(
        IUserRepository userRepository,
        IJourneyRepository journeyRepository,
        ITopUpTransactionRepository topUpTransactionRepository,
        TopUpChannelFactory channelFactory)
    {
        _userRepository = userRepository;
        _journeyRepository = journeyRepository;
        _topUpTransactionRepository = topUpTransactionRepository;
        _channelFactory = channelFactory;
    }

    public async Task<UserProfileDto?> GetProfileAsync(Guid userId)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            return null;
        }

        return new UserProfileDto(
            Id: user.Id,
            FullName: user.FullName,
            PhoneNumber: user.PhoneNumber,
            CreditBalance: user.CreditBalance,
            PersistentQrToken: user.PersistentQrToken,
            IsPhoneVerified: user.IsPhoneVerified,
            Role: user.Role,
            Email: user.Email,
            UserName: user.UserName
        );
    }

    /// <summary>
    /// Sequence Diagram Step 1-21:
    /// RegisteredPassenger.topUpAccount(amount, method, paymentDetails)
    /// -> create TopUpTransaction(amount, method)
    /// -> tx.execute()
    /// -> TopUpChannelFactory.getChannel(method)
    /// -> channel.topUp(amount, paymentDetails)
    /// -> gateway.processPayment(amount, paymentDetails)
    /// -> [SUCCESS: setStatus("SUCCESS"), account.topUp(amount), account.addTransaction(tx)]
    /// -> [FAILED: setStatus("FAILED"), account.addTransaction(tx)]
    /// </summary>
    public async Task<TopUpResponseDto> TopUpAccountAsync(Guid userId, TopUpRequest request)
    {
        if (request.Amount <= 0)
        {
            return new TopUpResponseDto(false, "Top-up amount must be greater than zero.", 0);
        }

        User? account = null;
        if (userId != Guid.Empty)
        {
            account = await _userRepository.GetByIdAsync(userId);
        }

        if (account == null && !string.IsNullOrWhiteSpace(request.PhoneNumber))
        {
            account = await _userRepository.GetByPhoneNumberAsync(request.PhoneNumber);
        }

        // Auto-provision commuter account if session came from local storage after DB reset
        if (account == null && (userId != Guid.Empty || !string.IsNullOrWhiteSpace(request.PhoneNumber)))
        {
            account = new User
            {
                Id = userId != Guid.Empty ? userId : Guid.NewGuid(),
                FullName = !string.IsNullOrWhiteSpace(request.FullName) ? request.FullName.Trim() : "Registered Commuter",
                PhoneNumber = request.PhoneNumber?.Trim(),
                IsPhoneVerified = true,
                IsActive = true,
                CreditBalance = 1250.00m,
                CreatedAtUtc = DateTime.UtcNow
            };
            await _userRepository.CreateAsync(account);
        }

        if (account == null)
        {
            return new TopUpResponseDto(false, "User account not found.", 0);
        }

        if (!account.IsActive)
        {
            return new TopUpResponseDto(false, "Account is suspended. Top-up is not permitted.", account.CreditBalance);
        }

        var method = string.IsNullOrWhiteSpace(request.Method) ? "ONLINE" : request.Method;
        var paymentDetails = request.PaymentDetails ?? new TopUpPaymentDetailsDto();

        // Step 2-3: create TopUpTransaction(amount, method) -> tx : TopUpTransaction
        var tx = new TopUpTransaction(
            userId: account.Id,
            amount: request.Amount,
            method: method,
            bonusAmount: request.BonusAmount
        );

        bool isSuccess;
        try
        {
            // Step 4: tx.execute()
            isSuccess = await tx.ExecuteAsync(account, _channelFactory, paymentDetails);
        }
        catch (ArgumentException ex)
        {
            return new TopUpResponseDto(false, ex.Message, account.CreditBalance);
        }

        // Persist account balance update (if successful) and transaction record (both SUCCESS and FAILED)
        await _userRepository.UpdateAsync(account);
        await _topUpTransactionRepository.CreateAsync(tx);

        var txDto = MapToDto(tx);

        if (isSuccess)
        {
            // Step 16: true (New Balance & Receipt Confirmed)
            return new TopUpResponseDto(
                Success: true,
                Message: $"Top-up confirmed via {tx.ChannelName} (+{tx.TotalCredits:N2} Credits). New balance: {account.CreditBalance:N2} Credits.",
                NewBalance: account.CreditBalance,
                Transaction: txDto
            );
        }

        // Step 21: false (Payment Failed - Balance Unchanged)
        return new TopUpResponseDto(
            Success: false,
            Message: tx.FailureReason ?? "Payment Failed - Balance Unchanged.",
            NewBalance: account.CreditBalance,
            Transaction: txDto
        );
    }

    public Task<TopUpResponseDto> TopUpAsync(Guid userId, decimal amount, string? paymentReference)
    {
        return TopUpAccountAsync(userId, new TopUpRequest(
            Amount: amount,
            PaymentReference: paymentReference,
            Method: "ONLINE"
        ));
    }

    public async Task<IEnumerable<TopUpTransactionDto>> GetTopUpHistoryAsync(Guid userId)
    {
        var transactions = await _topUpTransactionRepository.GetByUserIdAsync(userId);
        return transactions.Select(MapToDto);
    }

    public async Task<IEnumerable<JourneyHistoryDto>> GetHistoryAsync(Guid userId)
    {
        var journeys = await _journeyRepository.GetHistoryByUserIdAsync(userId);
        return journeys.Select(j => new JourneyHistoryDto(
            Id: j.Id,
            TapInStation: j.TapInStation,
            TapInTimeUtc: j.TapInTimeUtc,
            TapOutStation: j.TapOutStation,
            TapOutTimeUtc: j.TapOutTimeUtc,
            FareAmount: j.FareAmount,
            Status: j.Status.ToString()
        ));
    }

    private static TopUpTransactionDto MapToDto(TopUpTransaction tx) => new(
        Id: tx.Id,
        Amount: tx.Amount,
        BonusAmount: tx.BonusAmount,
        TotalCredits: tx.TotalCredits,
        Method: tx.Method,
        ChannelName: tx.ChannelName,
        Status: tx.Status,
        PaymentReference: tx.PaymentReference,
        FailureReason: tx.FailureReason,
        BalanceAfter: tx.BalanceAfter,
        CreatedAtUtc: tx.CreatedAtUtc
    );
}
