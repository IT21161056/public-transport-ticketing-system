using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Ticketing_System_Backend.Models.Dtos;
using Ticketing_System_Backend.Models.Entities;
using Ticketing_System_Backend.Models.Enums;
using Ticketing_System_Backend.Repositories;
using Ticketing_System_Backend.Services.Fare;
using Ticketing_System_Backend.Services.Inspection;
using Ticketing_System_Backend.Services.Tap;

namespace Ticketing_System_Backend.Services;

/// <summary>
/// Tap In / Tap Out with fare calculation (design: Scenario 1, sequence diagram 7.1).
/// </summary>
public class TapService : ITapService
{
    private const string MaximumFarePolicy = "Maximum fare (no tap-out)";
    private const string SameStopCancelPolicy = "Cancelled (same stop)";

    private readonly ITokenService _tokenService;
    private readonly ITokenRepository _tokenRepository;
    private readonly IJourneyRepository _journeyRepository;
    private readonly ITransitRepository _transitRepository;
    private readonly IFareStrategyFactory _fareStrategyFactory;
    private readonly TapOptions _tapOptions;
    private readonly InspectionOptions _inspectionOptions;
    private readonly ILogger<TapService> _logger;

    public TapService(
        ITokenService tokenService,
        ITokenRepository tokenRepository,
        IJourneyRepository journeyRepository,
        ITransitRepository transitRepository,
        IFareStrategyFactory fareStrategyFactory,
        IOptions<TapOptions> tapOptions,
        IOptions<InspectionOptions> inspectionOptions,
        ILogger<TapService> logger)
    {
        _tokenService = tokenService;
        _tokenRepository = tokenRepository;
        _journeyRepository = journeyRepository;
        _transitRepository = transitRepository;
        _fareStrategyFactory = fareStrategyFactory;
        _tapOptions = tapOptions.Value;
        _inspectionOptions = inspectionOptions.Value;
        _logger = logger;
    }

    public async Task<TapResponse> ProcessTapAsync(TapRequest request)
    {
        var nowUtc = DateTime.UtcNow;
        var (bus, currentStop) = await GetReaderPositionAsync(request.BusId, request.StopId);

        // 1. Who is tapping: authentic ticket, known token, account or pass
        var passenger = await ResolvePassengerAsync(request.QrPayload.Trim(), nowUtc);
        if (passenger == null)
        {
            return Reject(TapResult.InvalidToken, "Unknown", balance: null, passExpiresAtUtc: null, autoClosed: null);
        }

        // 2. Same ticket tapped again straight away: repeat the last result instead of acting twice
        var latest = await _journeyRepository.GetLatestJourneyAsync(passenger.UserId, passenger.DeviceUuid);
        if (latest != null && IsRepeatTap(latest, bus.Id, nowUtc))
        {
            return RepeatResponse(latest, passenger);
        }

        // 3. Open journey on this bus means Tap Out
        var openJourney = passenger.User != null
            ? await _journeyRepository.GetActiveJourneyByUserIdAsync(passenger.User.Id)
            : await _journeyRepository.GetActiveJourneyByDeviceUuidAsync(passenger.DeviceUuid!);

        decimal? balance = passenger.User?.CreditBalance;
        TapJourneyDto? autoClosed = null;

        if (openJourney != null)
        {
            bool isStale = nowUtc - openJourney.TapInTimeUtc > TimeSpan.FromHours(_inspectionOptions.ActiveJourneyMaxHours);
            bool isOtherBus = openJourney.BusId != bus.Id;

            if (!isStale && !isOtherBus)
            {
                return await TapOutAsync(openJourney, bus, currentStop, passenger, nowUtc);
            }

            // Passenger never tapped out of the earlier journey: close it with the maximum fare, then board
            var (closed, balanceAfter) = await AutoCloseAsync(openJourney, passenger, nowUtc);
            if (closed)
            {
                autoClosed = ToDto(openJourney);
                balance = balanceAfter ?? balance;
            }
        }

        // 4. No open journey means Tap In
        return await TapInAsync(bus, currentStop, passenger, nowUtc, balance, autoClosed);
    }

    public async Task<TransitNetworkDto> GetNetworkAsync()
    {
        var routes = await _transitRepository.GetActiveRoutesAsync();

        var routeDtos = routes.Select(route => new TransitRouteDto(
            Id: route.Id,
            RouteNumber: route.RouteNumber,
            Name: route.Name,
            Stops: route.Stops
                .OrderBy(rs => rs.Sequence)
                .Select(rs => new TransitStopDto(
                    rs.StopId,
                    rs.Stop!.Code,
                    rs.Stop.Name,
                    rs.Stop.Zone,
                    rs.Sequence,
                    rs.DistanceFromStartKm))
                .ToList(),
            Buses: route.Buses
                .OrderBy(b => b.RegistrationNumber)
                .Select(b => new TransitBusDto(b.Id, b.RegistrationNumber))
                .ToList()))
            .ToList();

        return new TransitNetworkDto(
            Routes: routeDtos,
            FarePolicy: _fareStrategyFactory.GetStrategy(TokenType.LocalUser).StrategyName,
            MinimumBalance: _tapOptions.MinimumBalance);
    }

    private async Task<(Bus Bus, RouteStop CurrentStop)> GetReaderPositionAsync(Guid busId, Guid stopId)
    {
        var bus = await _transitRepository.GetBusWithRouteAsync(busId);
        if (bus == null || !bus.IsActive || bus.Route == null)
        {
            throw new ReaderSetupException("Reader bus not found or not in service.");
        }

        var currentStop = bus.Route.Stops.FirstOrDefault(rs => rs.StopId == stopId);
        if (currentStop?.Stop == null)
        {
            throw new ReaderSetupException($"The selected stop is not on route {bus.Route.RouteNumber}.");
        }

        return (bus, currentStop);
    }

    private async Task<Passenger?> ResolvePassengerAsync(string qrPayload, DateTime nowUtc)
    {
        // Signature check first; an expired guest pass is still authentic and may tap out
        var validation = _tokenService.ValidateTokenPayload(qrPayload);
        bool isExpiredPass = !validation.IsValid && validation.Message.Contains("expired", StringComparison.OrdinalIgnoreCase);
        if (!validation.IsValid && !isExpiredPass)
        {
            return null;
        }

        // The token must also be one the system issued and has not withdrawn
        var token = await _tokenRepository.GetBySignedTokenAsync(qrPayload);
        if (token == null || !token.IsActive)
        {
            return null;
        }

        if (token.TokenType == TokenType.LocalUser)
        {
            if (token.User == null || token.User.Id.ToString() != validation.HolderIdentifier)
            {
                return null;
            }

            return new Passenger(token, token.User, DeviceUuid: null, PassExpired: false);
        }

        if (string.IsNullOrEmpty(token.DeviceUuid) || token.DeviceUuid != validation.HolderIdentifier)
        {
            return null;
        }

        bool expired = isExpiredPass || (token.ExpiresAtUtc != null && token.ExpiresAtUtc <= nowUtc);
        return new Passenger(token, User: null, token.DeviceUuid, expired);
    }

    private bool IsRepeatTap(Journey latest, Guid busId, DateTime nowUtc)
    {
        // A journey the system closed by itself was not a tap, so it never counts as a repeat
        if (latest.BusId != busId || latest.Status == JourneyStatus.Incomplete)
        {
            return false;
        }

        var lastTapUtc = latest.TapOutTimeUtc ?? latest.TapInTimeUtc;
        return nowUtc - lastTapUtc <= TimeSpan.FromSeconds(_tapOptions.DuplicateTapSeconds);
    }

    private async Task<TapResponse> TapInAsync(
        Bus bus,
        RouteStop currentStop,
        Passenger passenger,
        DateTime nowUtc,
        decimal? balance,
        TapJourneyDto? autoClosed)
    {
        if (passenger.PassExpired)
        {
            return Reject(TapResult.PassExpired, passenger.TokenTypeCode, balance, passenger.Token.ExpiresAtUtc, autoClosed);
        }

        if (passenger.User != null && !passenger.User.IsActive)
        {
            return Reject(TapResult.AccountSuspended, passenger.TokenTypeCode, balance, null, autoClosed);
        }

        if (passenger.User != null && balance < _tapOptions.MinimumBalance)
        {
            return Reject(TapResult.InsufficientBalance, passenger.TokenTypeCode, balance, null, autoClosed);
        }

        var journey = new Journey
        {
            UserId = passenger.User?.Id,
            DeviceUuid = passenger.DeviceUuid,
            TokenId = passenger.Token.Id,
            RouteId = bus.RouteId,
            BusId = bus.Id,
            BoardingStopId = currentStop.StopId,
            TapInStation = currentStop.Stop!.Name,
            TapInTimeUtc = nowUtc,
            Status = JourneyStatus.InProgress,
            CreatedAtUtc = nowUtc
        };

        await _journeyRepository.CreateAsync(journey);

        _logger.LogInformation("Tap in: {TokenType} {Holder} boarded bus {Bus} at {Stop}.",
            passenger.TokenTypeCode, passenger.HolderId, bus.RegistrationNumber, journey.TapInStation);

        return new TapResponse(
            Action: TapAction.TapIn.ToString(),
            Result: TapResult.TapInAccepted.ToString(),
            Accepted: true,
            Message: GetMessage(TapResult.TapInAccepted, passenger.IsGuest, fare: 0m),
            TokenType: passenger.TokenTypeCode,
            IsRepeatTap: false,
            Journey: ToDto(journey),
            BalanceAfter: balance,
            MinimumBalance: _tapOptions.MinimumBalance,
            PassExpiresAtUtc: passenger.Token.ExpiresAtUtc,
            AutoClosedJourney: autoClosed);
    }

    private async Task<TapResponse> TapOutAsync(
        Journey journey,
        Bus bus,
        RouteStop currentStop,
        Passenger passenger,
        DateTime nowUtc)
    {
        var boardingStop = bus.Route!.Stops.FirstOrDefault(rs => rs.StopId == journey.BoardingStopId) ?? currentStop;

        journey.AlightingStopId = currentStop.StopId;
        journey.TapOutStation = currentStop.Stop!.Name;
        journey.TapOutTimeUtc = nowUtc;

        bool isSameStop = boardingStop.StopId == currentStop.StopId;
        bool withinCancelWindow = nowUtc - journey.TapInTimeUtc <= TimeSpan.FromMinutes(_tapOptions.SameStopCancelMinutes);
        TapResult result;

        if (isSameStop && withinCancelWindow)
        {
            // Got on and off at the same stop straight away: no journey was made
            journey.Status = JourneyStatus.Cancelled;
            journey.StopsTravelled = 0;
            journey.FareAmount = 0m;
            journey.FarePolicy = SameStopCancelPolicy;
            result = TapResult.JourneyCancelled;
        }
        else
        {
            // Buses run both ways, so the distance is the gap between the two stop positions
            var fareContext = new FareContext(
                StopsTravelled: Math.Abs(currentStop.Sequence - boardingStop.Sequence),
                DistanceKm: Math.Abs(currentStop.DistanceFromStartKm - boardingStop.DistanceFromStartKm),
                BoardingZone: boardingStop.Stop?.Zone ?? currentStop.Stop.Zone,
                AlightingZone: currentStop.Stop.Zone,
                TapInTimeUtc: journey.TapInTimeUtc,
                TapOutTimeUtc: nowUtc);

            var strategy = _fareStrategyFactory.GetStrategy(passenger.Token.TokenType);

            journey.Status = JourneyStatus.Completed;
            journey.StopsTravelled = fareContext.StopsTravelled;
            journey.FareAmount = strategy.CalculateFare(fareContext);
            journey.FarePolicy = strategy.StrategyName;
            result = TapResult.TapOutCompleted;
        }

        var (closed, balanceAfter) = await _journeyRepository.CloseJourneyAsync(journey, passenger.User?.Id);
        if (!closed)
        {
            // Another tap closed this journey a moment ago; show that outcome instead of charging again
            var latest = await _journeyRepository.GetLatestJourneyAsync(passenger.UserId, passenger.DeviceUuid);
            return RepeatResponse(latest ?? journey, passenger);
        }

        _logger.LogInformation("Tap out: {TokenType} {Holder} left bus {Bus} at {Stop}, {Stops} stops, fare {Fare} ({Policy}).",
            passenger.TokenTypeCode, passenger.HolderId, bus.RegistrationNumber, journey.TapOutStation,
            journey.StopsTravelled, journey.FareAmount, journey.FarePolicy);

        return new TapResponse(
            Action: TapAction.TapOut.ToString(),
            Result: result.ToString(),
            Accepted: true,
            Message: GetMessage(result, passenger.IsGuest, journey.FareAmount),
            TokenType: passenger.TokenTypeCode,
            IsRepeatTap: false,
            Journey: ToDto(journey),
            BalanceAfter: balanceAfter,
            MinimumBalance: _tapOptions.MinimumBalance,
            PassExpiresAtUtc: passenger.Token.ExpiresAtUtc,
            AutoClosedJourney: null);
    }

    private async Task<(bool Closed, decimal? BalanceAfter)> AutoCloseAsync(Journey journey, Passenger passenger, DateTime nowUtc)
    {
        var strategy = _fareStrategyFactory.GetStrategy(passenger.Token.TokenType);

        journey.Status = JourneyStatus.Incomplete;
        journey.TapOutTimeUtc = nowUtc;
        journey.FareAmount = strategy.MaximumFare;
        journey.FarePolicy = MaximumFarePolicy;

        var result = await _journeyRepository.CloseJourneyAsync(journey, passenger.User?.Id);

        if (result.Closed)
        {
            _logger.LogInformation("Journey {JourneyId} from {Stop} closed without tap-out; charged maximum fare {Fare}.",
                journey.Id, journey.TapInStation, journey.FareAmount);
        }

        return result;
    }

    private TapResponse RepeatResponse(Journey journey, Passenger passenger)
    {
        var result = journey.Status switch
        {
            JourneyStatus.InProgress => TapResult.TapInAccepted,
            JourneyStatus.Cancelled => TapResult.JourneyCancelled,
            _ => TapResult.TapOutCompleted
        };
        var action = journey.Status == JourneyStatus.InProgress ? TapAction.TapIn : TapAction.TapOut;

        return new TapResponse(
            Action: action.ToString(),
            Result: result.ToString(),
            Accepted: true,
            Message: GetMessage(result, passenger.IsGuest, journey.FareAmount),
            TokenType: passenger.TokenTypeCode,
            IsRepeatTap: true,
            Journey: ToDto(journey),
            BalanceAfter: passenger.User?.CreditBalance,
            MinimumBalance: _tapOptions.MinimumBalance,
            PassExpiresAtUtc: passenger.Token.ExpiresAtUtc,
            AutoClosedJourney: null);
    }

    private TapResponse Reject(
        TapResult result,
        string tokenType,
        decimal? balance,
        DateTime? passExpiresAtUtc,
        TapJourneyDto? autoClosed)
    {
        return new TapResponse(
            Action: TapAction.Rejected.ToString(),
            Result: result.ToString(),
            Accepted: false,
            Message: GetMessage(result, isGuest: tokenType == "GUEST", fare: 0m),
            TokenType: tokenType,
            IsRepeatTap: false,
            Journey: null,
            BalanceAfter: balance,
            MinimumBalance: _tapOptions.MinimumBalance,
            PassExpiresAtUtc: passExpiresAtUtc,
            AutoClosedJourney: autoClosed);
    }

    private string GetMessage(TapResult result, bool isGuest, decimal fare) => result switch
    {
        TapResult.TapInAccepted => "Tap in successful. Have a safe journey.",
        TapResult.TapOutCompleted when isGuest => "Tap out successful. Journey covered by your pass.",
        TapResult.TapOutCompleted => $"Tap out successful. Fare charged: {fare:0.00}.",
        TapResult.JourneyCancelled => "Tapped out at the boarding stop. Journey cancelled, no fare charged.",
        TapResult.InvalidToken => "Ticket not recognised. Please use a valid QR ticket.",
        TapResult.PassExpired => "Your pass has expired. Please buy a new pass.",
        TapResult.AccountSuspended => "Account suspended. Please contact customer service.",
        TapResult.InsufficientBalance => $"Insufficient balance. At least {_tapOptions.MinimumBalance:0.00} credits needed to board. Please top up.",
        _ => "Tap not processed."
    };

    private static TapJourneyDto ToDto(Journey journey) => new(
        Id: journey.Id,
        Status: journey.Status.ToString(),
        BoardingStop: journey.TapInStation,
        TapInTimeUtc: journey.TapInTimeUtc,
        AlightingStop: journey.TapOutStation,
        TapOutTimeUtc: journey.TapOutTimeUtc,
        StopsTravelled: journey.StopsTravelled,
        FareCharged: journey.FareAmount,
        FarePolicy: journey.FarePolicy);

    /// <summary>
    /// The resolved ticket holder: an account passenger (User set) or a visitor pass (DeviceUuid set).
    /// </summary>
    private sealed record Passenger(TransportToken Token, User? User, string? DeviceUuid, bool PassExpired)
    {
        public bool IsGuest => User == null;
        public Guid? UserId => User?.Id;
        public string TokenTypeCode => IsGuest ? "GUEST" : "LOCAL";
        public string HolderId => User?.Id.ToString() ?? DeviceUuid ?? string.Empty;
    }
}
