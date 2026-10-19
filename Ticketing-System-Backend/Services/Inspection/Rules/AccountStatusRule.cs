using System;
using System.Threading.Tasks;
using Ticketing_System_Backend.Models.Enums;
using Ticketing_System_Backend.Repositories;

namespace Ticketing_System_Backend.Services.Inspection.Rules;

/// <summary>
/// Rule 2: a local user's account must exist and must not be suspended.
/// Guest passes have no account, so they pass straight through.
/// </summary>
public class AccountStatusRule : InspectionRule
{
    private readonly IUserRepository _userRepository;

    public AccountStatusRule(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    protected override async Task<InspectionResult?> CheckAsync(InspectionContext context)
    {
        if (!context.IsLocalUser)
        {
            return null;
        }

        if (!Guid.TryParse(context.TokenIdentifier, out var userId))
        {
            return InspectionResult.InvalidToken;
        }

        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            return InspectionResult.InvalidToken;
        }

        context.User = user;

        return user.IsActive ? null : InspectionResult.AccountSuspended;
    }
}
