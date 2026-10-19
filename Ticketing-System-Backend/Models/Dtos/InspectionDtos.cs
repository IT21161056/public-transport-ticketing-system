using System;

namespace Ticketing_System_Backend.Models.Dtos;

public record InspectTicketRequest(
    string QrPayload,
    string? Location
);

public record InspectionJourneyDto(
    Guid Id,
    string TapInStation,
    DateTime TapInTimeUtc,
    int MinutesSinceTapIn
);

public record InspectionResponse(
    Guid InspectionId,
    bool IsValid,
    string Result,
    string Message,
    string TokenType,
    string TokenIdentifier,
    DateTime InspectedAtUtc,
    bool IsRepeatScan,
    InspectionJourneyDto? Journey
);
