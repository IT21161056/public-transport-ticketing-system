using System;

namespace Ticketing_System_Backend.Models.Dtos;

public record RequestOtpRequest(string PhoneNumber, string? FullName);

public record RequestOtpResponse(bool Success, string Message, string? DebugOtp = null);

public record VerifyOtpRequest(string PhoneNumber, string OtpCode, string? FullName);

public record AuthResponseDto(
    bool Success,
    string Message,
    string? Token,
    UserProfileDto? User
);
