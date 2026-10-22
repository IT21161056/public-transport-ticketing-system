using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Ticketing_System_Backend.Models.Dtos;
using Ticketing_System_Backend.Services;

namespace Ticketing_System_Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AccountController : ControllerBase
{
    private readonly IAccountService _accountService;

    public AccountController(IAccountService accountService)
    {
        _accountService = accountService;
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
    /// Returns the profile, current wallet balance, and permanent QR token for the logged-in user.
    /// </summary>
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized(new { message = "Invalid token claims." });
        }

        var profile = await _accountService.GetProfileAsync(userId.Value);
        if (profile == null)
        {
            return NotFound(new { message = "User not found." });
        }

        return Ok(profile);
    }

    /// <summary>
    /// Sequence Diagram: RegisteredPassenger.topUpAccount(amount, method, paymentDetails)
    /// Creates a TopUpTransaction, resolves the TopUpChannel via TopUpChannelFactory,
    /// processes payment via PaymentGateway, and updates Account balance & transaction ledger.
    /// </summary>
    [HttpPost("topup")]
    [AllowAnonymous]
    public async Task<IActionResult> TopUp([FromBody] TopUpRequest request)
    {
        var userId = GetCurrentUserId() ?? request.UserId ?? Guid.Empty;

        var result = await _accountService.TopUpAccountAsync(userId, request);
        if (!result.Success && result.Transaction == null)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Returns the commuter's top-up transaction ledger (including both SUCCESS and FAILED attempts).
    /// </summary>
    [HttpGet("topup-history")]
    [AllowAnonymous]
    public async Task<IActionResult> GetTopUpHistory([FromQuery] Guid? userId = null)
    {
        var resolvedUserId = GetCurrentUserId() ?? userId;
        if (resolvedUserId == null || resolvedUserId == Guid.Empty)
        {
            return Ok(Array.Empty<TopUpTransactionDto>());
        }

        var transactions = await _accountService.GetTopUpHistoryAsync(resolvedUserId.Value);
        return Ok(transactions);
    }

    /// <summary>
    /// Returns previous travel journeys and fares for expense tracking / claims.
    /// </summary>
    [HttpGet("history")]
    public async Task<IActionResult> GetHistory()
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized(new { message = "Invalid token claims." });
        }

        var history = await _accountService.GetHistoryAsync(userId.Value);
        return Ok(history);
    }
}
