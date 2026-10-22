using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Ticketing_System_Backend.Models.Dtos;

namespace Ticketing_System_Backend.Services;

public interface IAccountService
{
    Task<UserProfileDto?> GetProfileAsync(Guid userId);

    /// <summary>
    /// Sequence Diagram Step 1: topUpAccount(amount, method, paymentDetails)
    /// </summary>
    Task<TopUpResponseDto> TopUpAccountAsync(Guid userId, TopUpRequest request);

    /// <summary>
    /// Compatibility overload for simple top-up calls.
    /// </summary>
    Task<TopUpResponseDto> TopUpAsync(Guid userId, decimal amount, string? paymentReference);

    Task<IEnumerable<TopUpTransactionDto>> GetTopUpHistoryAsync(Guid userId);

    Task<IEnumerable<JourneyHistoryDto>> GetHistoryAsync(Guid userId);
}
