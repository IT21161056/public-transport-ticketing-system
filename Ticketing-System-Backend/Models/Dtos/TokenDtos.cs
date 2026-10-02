using System;

namespace Ticketing_System_Backend.Models.Dtos;

public record GenerateTokenResponse(
    string Token,
    string TokenType,
    DateTime? ExpiresAtUtc,
    string Nonce,
    string QrPayload
);

public record GuestPassPurchaseRequest(
    string DeviceUuid,
    string PassTier,
    decimal Amount
);

public record GuestPassDto(
    Guid Id,
    string DeviceUuid,
    string PassTier,
    string SignedToken,
    DateTime ExpiresAtUtc,
    bool IsActive
);

public record ScanValidationResult(
    bool IsValid,
    string Message,
    string TokenType,
    string HolderIdentifier,
    decimal? RemainingBalance = null
);
