using System;
using System.Collections.Generic;

namespace Ticketing_System_Backend.Models.Dtos;

public record AdminLoginRequest(string UsernameOrEmail, string Password);

public record AdminAuthResponse(
    bool Success,
    string Message,
    string? Token,
    UserProfileDto? User
);

public record AdminDashboardStatsDto(
    int TotalUsers,
    decimal TotalWalletCredits,
    int ActiveGuestPasses,
    int TotalJourneys,
    decimal TotalFareCollected
);

public record AdminUserItemDto(
    Guid Id,
    string? UserName,
    string? Email,
    string FullName,
    string? PhoneNumber,
    short Role,
    string RoleName,
    bool IsActive,
    decimal CreditBalance,
    string? PersistentQrToken,
    DateTime CreatedAtUtc,
    DateTime? LastLoginAtUtc
);

public record UpdateUserStatusRequest(bool IsActive);

public record AdjustUserBalanceRequest(decimal Amount, string Reason);

public record AdminJourneyItemDto(
    Guid Id,
    string? CommuterName,
    string? CommuterPhone,
    string? DeviceUuid,
    string TapInStation,
    DateTime TapInTimeUtc,
    string? TapOutStation,
    DateTime? TapOutTimeUtc,
    decimal FareAmount,
    string Status
);

public record AdminGuestPassItemDto(
    Guid Id,
    string DeviceUuid,
    string PassTier,
    string SignedToken,
    bool IsActive,
    DateTime CreatedAtUtc,
    DateTime? ExpiresAtUtc
);
