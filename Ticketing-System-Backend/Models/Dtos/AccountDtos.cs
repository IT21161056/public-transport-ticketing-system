using System;

namespace Ticketing_System_Backend.Models.Dtos;

public record UserProfileDto(
    Guid Id,
    string FullName,
    string? PhoneNumber,
    decimal CreditBalance,
    string? PersistentQrToken,
    bool IsPhoneVerified,
    short Role = 0,
    string? Email = null,
    string? UserName = null,
    string? TokenMedium = "Digital QR"
);

public record TopUpPaymentDetailsDto(
    string? CardNumber = null,
    string? CardHolderName = null,
    string? ExpiryDate = null,
    string? Cvv = null,
    string? MobileProvider = null,
    string? MobileNumber = null,
    string? StationId = null,
    string? VoucherCode = null,
    bool SimulateDecline = false
);

public record TopUpRequest(
    decimal Amount,
    string? PaymentReference = null,
    string? Method = "ONLINE",
    decimal BonusAmount = 0m,
    TopUpPaymentDetailsDto? PaymentDetails = null,
    Guid? UserId = null,
    string? PhoneNumber = null,
    string? FullName = null
);

public record TopUpTransactionDto(
    Guid Id,
    decimal Amount,
    decimal BonusAmount,
    decimal TotalCredits,
    string Method,
    string ChannelName,
    string Status,
    string? PaymentReference,
    string? FailureReason,
    decimal BalanceAfter,
    DateTime CreatedAtUtc
);

public record TopUpResponseDto(
    bool Success,
    string Message,
    decimal NewBalance,
    TopUpTransactionDto? Transaction = null
);

public record JourneyHistoryDto(
    Guid Id,
    string TapInStation,
    DateTime TapInTimeUtc,
    string? TapOutStation,
    DateTime? TapOutTimeUtc,
    decimal FareAmount,
    string Status
);
