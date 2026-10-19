using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Options;
using Ticketing_System_Backend.Models.Dtos;
using Ticketing_System_Backend.Models.Entities;
using Ticketing_System_Backend.Models.Enums;
using Ticketing_System_Backend.Repositories;
using Ticketing_System_Backend.Services.Inspection;
using Ticketing_System_Backend.Services.Inspection.Rules;

namespace Ticketing_System_Backend.Services;

/// <summary>
/// Ticket inspection (design: InspectorReader.inspectTicket).
/// Runs the inspection rule chain and records a TicketInspection for every scan.
/// </summary>
public class InspectionService : IInspectionService
{
    private readonly IInspectionRule _ruleChain;
    private readonly IInspectionRepository _inspectionRepository;
    private readonly InspectionOptions _options;

    public InspectionService(
        TokenSignatureRule tokenSignatureRule,
        AccountStatusRule accountStatusRule,
        ActiveJourneyRule activeJourneyRule,
        StaleJourneyRule staleJourneyRule,
        IInspectionRepository inspectionRepository,
        IOptions<InspectionOptions> options)
    {
        // Order matters: each rule relies on details filled in by the rules before it
        tokenSignatureRule
            .SetNext(accountStatusRule)
            .SetNext(activeJourneyRule)
            .SetNext(staleJourneyRule);

        _ruleChain = tokenSignatureRule;
        _inspectionRepository = inspectionRepository;
        _options = options.Value;
    }

    public async Task<InspectionResponse> InspectTicketAsync(InspectTicketRequest request, Guid? inspectorId)
    {
        var context = new InspectionContext(request.QrPayload?.Trim() ?? string.Empty, DateTime.UtcNow);
        var result = await _ruleChain.HandleAsync(context);

        // Same passenger scanned again with the same outcome: reuse the record so reports are not double counted
        if (!string.IsNullOrEmpty(context.TokenIdentifier))
        {
            var windowStartUtc = context.NowUtc.AddMinutes(-_options.DuplicateScanWindowMinutes);
            var previous = await _inspectionRepository.GetLatestByTokenIdentifierSinceAsync(context.TokenIdentifier, windowStartUtc);
            if (previous != null && previous.Result == result)
            {
                return ToResponse(previous, previous.Journey, context.NowUtc, isRepeatScan: true);
            }
        }

        var inspection = new TicketInspection
        {
            TokenIdentifier = context.TokenIdentifier,
            TokenType = context.TokenType,
            UserId = context.User?.Id,
            DeviceUuid = context.IsGuest ? context.TokenIdentifier : null,
            JourneyId = context.ActiveJourney?.Id,
            Result = result,
            Location = request.Location?.Trim(),
            InspectorId = inspectorId,
            InspectedAtUtc = context.NowUtc
        };

        await _inspectionRepository.CreateAsync(inspection);

        return ToResponse(inspection, context.ActiveJourney, context.NowUtc, isRepeatScan: false);
    }

    private InspectionResponse ToResponse(TicketInspection inspection, Journey? journey, DateTime nowUtc, bool isRepeatScan)
    {
        var journeyDto = journey == null
            ? null
            : new InspectionJourneyDto(
                Id: journey.Id,
                TapInStation: journey.TapInStation,
                TapInTimeUtc: journey.TapInTimeUtc,
                MinutesSinceTapIn: (int)(nowUtc - journey.TapInTimeUtc).TotalMinutes);

        return new InspectionResponse(
            InspectionId: inspection.Id,
            IsValid: inspection.IsValid,
            Result: inspection.Result.ToString(),
            Message: GetMessage(inspection.Result),
            TokenType: inspection.TokenType,
            TokenIdentifier: inspection.TokenIdentifier,
            InspectedAtUtc: inspection.InspectedAtUtc,
            IsRepeatScan: isRepeatScan,
            Journey: journeyDto);
    }

    private string GetMessage(InspectionResult result) => result switch
    {
        InspectionResult.Valid => "Valid ticket. Journey in progress.",
        InspectionResult.NoActiveJourney => "No active journey found. Passenger has not tapped in.",
        InspectionResult.StaleJourney => $"Last tap-in is older than {_options.ActiveJourneyMaxHours} hours. Passenger has not tapped in for this journey.",
        InspectionResult.InvalidToken => "Token is not authentic.",
        InspectionResult.Expired => "Pass has expired.",
        InspectionResult.AccountSuspended => "Account is suspended.",
        _ => "Unknown inspection result."
    };
}
