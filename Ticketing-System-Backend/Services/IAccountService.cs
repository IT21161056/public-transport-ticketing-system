using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Ticketing_System_Backend.Models.Dtos;

namespace Ticketing_System_Backend.Services;

public interface IAccountService
{
    Task<UserProfileDto?> GetProfileAsync(Guid userId);
    Task<TopUpResponseDto> TopUpAsync(Guid userId, decimal amount, string? paymentReference);
    Task<IEnumerable<JourneyHistoryDto>> GetHistoryAsync(Guid userId);
}
