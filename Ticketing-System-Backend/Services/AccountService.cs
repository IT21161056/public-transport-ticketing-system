using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Ticketing_System_Backend.Models.Dtos;
using Ticketing_System_Backend.Repositories;

namespace Ticketing_System_Backend.Services;

public class AccountService : IAccountService
{
    private readonly IUserRepository _userRepository;
    private readonly IJourneyRepository _journeyRepository;

    public AccountService(
        IUserRepository userRepository,
        IJourneyRepository journeyRepository)
    {
        _userRepository = userRepository;
        _journeyRepository = journeyRepository;
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
            IsPhoneVerified: user.IsPhoneVerified
        );
    }

    public async Task<TopUpResponseDto> TopUpAsync(Guid userId, decimal amount, string? paymentReference)
    {
        if (amount <= 0)
        {
            return new TopUpResponseDto(false, "Top-up amount must be greater than zero.", 0);
        }

        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            return new TopUpResponseDto(false, "User account not found.", 0);
        }

        user.CreditBalance += amount;
        await _userRepository.UpdateAsync(user);
        await _userRepository.SaveChangesAsync();

        return new TopUpResponseDto(
            Success: true,
            Message: $"Successfully topped up {amount:C}. New balance: {user.CreditBalance:C}",
            NewBalance: user.CreditBalance
        );
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
}
