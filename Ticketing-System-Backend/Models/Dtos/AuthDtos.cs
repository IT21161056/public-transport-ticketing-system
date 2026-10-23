using System;

namespace Ticketing_System_Backend.Models.Dtos;

public record RequestOtpRequest(string PhoneNumber, string? FullName);

public record RequestOtpResponse(bool Success, string Message, string? DebugOtp = null);

public record VerifyOtpRequest(
    string PhoneNumber, 
    string OtpCode, 
    string? FullName = null,
    decimal? InitialCredit = null,
    string? TokenMedium = null
);

public record CompleteRegistrationRequest(
    string PhoneNumber,
    string FullName,
    decimal InitialCredit,
    string TokenMedium,
    string? PaymentMethod = "Card",
    string? PaymentReference = null
);

public record AuthResponseDto(
    bool Success,
    string Message,
    string? Token,
    UserProfileDto? User,
    bool IsNewUser = false
);
