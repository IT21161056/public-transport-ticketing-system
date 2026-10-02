using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Ticketing_System_Backend.Models.Dtos;
using Ticketing_System_Backend.Services;

namespace Ticketing_System_Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TokenController : ControllerBase
{
    private readonly ITokenService _tokenService;

    public TokenController(ITokenService tokenService)
    {
        _tokenService = tokenService;
    }

    private Guid? GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
        if (claim != null && Guid.TryParse(claim.Value, out var userId))
        {
            return userId;
        }
        return null;
    }

    /// <summary>
    /// Generates or retrieves signed QR token.
    /// - For Local Users: Identified via JWT Bearer authorization.
    /// - For Guest Users: Identified via query parameter ?deviceUuid=...&passTier=...
    /// </summary>
    [HttpGet("generate")]
    public async Task<IActionResult> GenerateToken([FromQuery] string? deviceUuid, [FromQuery] string? passTier)
    {
        var userId = GetCurrentUserId();

        if (userId.HasValue)
        {
            // Local user
            var localToken = await _tokenService.GetOrCreateLocalTokenAsync(userId.Value);
            return Ok(localToken);
        }

        if (!string.IsNullOrWhiteSpace(deviceUuid))
        {
            // Check if active guest pass already exists for device
            var existingPass = await _tokenService.GetActiveGuestPassAsync(deviceUuid);
            if (existingPass != null)
            {
                return Ok(new GenerateTokenResponse(
                    Token: existingPass.SignedToken,
                    TokenType: "GuestPass",
                    ExpiresAtUtc: existingPass.ExpiresAtUtc,
                    Nonce: "",
                    QrPayload: existingPass.SignedToken
                ));
            }

            // Issue new pass if requested
            var newPass = await _tokenService.IssueGuestPassAsync(
                deviceUuid,
                string.IsNullOrWhiteSpace(passTier) ? "1-Day" : passTier,
                0m
            );
            return Ok(newPass);
        }

        return BadRequest(new { message = "Authentication token or deviceUuid query parameter is required." });
    }

    /// <summary>
    /// Checkout / issue a paid time-bound Guest Pass for a specific device UUID.
    /// Pass tiers: '1-Day' (24h), '3-Day' (72h), '7-Day' (168h).
    /// </summary>
    [HttpPost("guest-pass")]
    public async Task<IActionResult> PurchaseGuestPass([FromBody] GuestPassPurchaseRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.DeviceUuid))
        {
            return BadRequest(new { message = "Device UUID is required." });
        }

        var result = await _tokenService.IssueGuestPassAsync(
            request.DeviceUuid,
            request.PassTier,
            request.Amount
        );

        return Ok(result);
    }

    /// <summary>
    /// Fetches the currently active Guest Pass for a given device UUID.
    /// </summary>
    [HttpGet("guest-pass/{deviceUuid}")]
    public async Task<IActionResult> GetGuestPass(string deviceUuid)
    {
        var pass = await _tokenService.GetActiveGuestPassAsync(deviceUuid);
        if (pass == null)
        {
            return NotFound(new { message = "No active guest pass found for this device." });
        }

        return Ok(pass);
    }

    /// <summary>
    /// Validates a scanned QR payload (cryptographic HMAC-SHA256 signature and expiry).
    /// Used by transit gates, turnstiles, and ticket inspectors.
    /// </summary>
    [HttpPost("validate")]
    public IActionResult ValidateToken([FromBody] string qrPayload)
    {
        var result = _tokenService.ValidateTokenPayload(qrPayload);
        if (!result.IsValid)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }
}
