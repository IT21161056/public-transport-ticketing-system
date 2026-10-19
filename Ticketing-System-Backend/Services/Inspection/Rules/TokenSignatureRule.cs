using System;
using System.Threading.Tasks;
using Ticketing_System_Backend.Models.Enums;

namespace Ticketing_System_Backend.Services.Inspection.Rules;

/// <summary>
/// Rule 1: the QR token must be authentic (HMAC signature) and not expired.
/// Reuses the existing TokenService validation, as the design states the inspector reader
/// "verifies the token in the same manner as the boarding reader does".
/// </summary>
public class TokenSignatureRule : InspectionRule
{
    private readonly ITokenService _tokenService;

    public TokenSignatureRule(ITokenService tokenService)
    {
        _tokenService = tokenService;
    }

    protected override Task<InspectionResult?> CheckAsync(InspectionContext context)
    {
        var validation = _tokenService.ValidateTokenPayload(context.QrPayload);

        context.TokenType = validation.TokenType;
        context.TokenIdentifier = validation.HolderIdentifier;

        if (validation.IsValid)
        {
            return Task.FromResult<InspectionResult?>(null);
        }

        // TokenService checks the signature before expiry, so an "expired" message means an authentic but expired pass
        var result = validation.Message.Contains("expired", StringComparison.OrdinalIgnoreCase)
            ? InspectionResult.Expired
            : InspectionResult.InvalidToken;

        return Task.FromResult<InspectionResult?>(result);
    }
}
