using System;
using System.Threading.Tasks;
using Ticketing_System_Backend.Models.Dtos;

namespace Ticketing_System_Backend.Services;

public interface ITokenService
{
    Task<GenerateTokenResponse> GetOrCreateLocalTokenAsync(Guid userId);
    Task<GenerateTokenResponse> IssueGuestPassAsync(string deviceUuid, string passTier, decimal amount);
    Task<GuestPassDto?> GetActiveGuestPassAsync(string deviceUuid);
    ScanValidationResult ValidateTokenPayload(string qrPayload);
}
