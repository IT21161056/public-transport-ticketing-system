using System;

namespace Ticketing_System_Backend.Models.Dtos;

public record UserProfileDto(
    Guid Id,
    string FullName,
    string? PhoneNumber,
    decimal CreditBalance,
    string? PersistentQrToken,
    bool IsPhoneVerified
);

public record TopUpRequest(
    decimal Amount,
    string? PaymentReference
);

public record TopUpResponseDto(
    bool Success,
    string Message,
    decimal NewBalance
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
