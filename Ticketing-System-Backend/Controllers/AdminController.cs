using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Ticketing_System_Backend.Data;
using Ticketing_System_Backend.Models.Dtos;
using Ticketing_System_Backend.Models.Entities;
using Ticketing_System_Backend.Models.Enums;

namespace Ticketing_System_Backend.Controllers;

[Authorize(Roles = "Admin,2")]
[ApiController]
[Route("api/[controller]")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _context;

    public AdminController(AppDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Returns high-level network operational statistics for the Admin Dashboard.
    /// </summary>
    [HttpGet("stats")]
    public async Task<IActionResult> GetDashboardStats()
    {
        var totalUsers = await _context.Users.CountAsync(u => u.Role == (short)UserRole.User);
        var totalWalletCredits = await _context.Users
            .Where(u => u.Role == (short)UserRole.User)
            .SumAsync(u => (decimal?)u.CreditBalance) ?? 0m;

        var now = DateTime.UtcNow;
        var activeGuestPasses = await _context.TransportTokens
            .CountAsync(t => t.TokenType == TokenType.GuestPass && t.IsActive && t.ExpiresAtUtc > now);

        var totalJourneys = await _context.Journeys.CountAsync();
        var totalFareCollected = await _context.Journeys.SumAsync(j => (decimal?)j.FareAmount) ?? 0m;

        var stats = new AdminDashboardStatsDto(
            TotalUsers: totalUsers,
            TotalWalletCredits: totalWalletCredits,
            ActiveGuestPasses: activeGuestPasses,
            TotalJourneys: totalJourneys,
            TotalFareCollected: totalFareCollected
        );

        return Ok(stats);
    }

    /// <summary>
    /// Returns a list of commuters and system users with optional search filtering.
    /// </summary>
    [HttpGet("users")]
    public async Task<IActionResult> GetUsers(
        [FromQuery] string? search = null,
        [FromQuery] short? role = null,
        [FromQuery] bool? isActive = null)
    {
        var query = _context.Users.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var clean = search.Trim().ToLower();
            query = query.Where(u =>
                (u.FullName != null && u.FullName.ToLower().Contains(clean)) ||
                (u.PhoneNumber != null && u.PhoneNumber.Contains(clean)) ||
                (u.Email != null && u.Email.ToLower().Contains(clean)) ||
                (u.UserName != null && u.UserName.ToLower().Contains(clean))
            );
        }

        if (role.HasValue)
        {
            query = query.Where(u => u.Role == role.Value);
        }

        if (isActive.HasValue)
        {
            query = query.Where(u => u.IsActive == isActive.Value);
        }

        var list = await query
            .OrderByDescending(u => u.CreatedAtUtc)
            .Take(100)
            .Select(u => new AdminUserItemDto(
                u.Id,
                u.UserName,
                u.Email,
                u.FullName,
                u.PhoneNumber,
                u.Role,
                u.Role == (short)UserRole.Admin ? "Administrator" : (u.Role == (short)UserRole.Inspector ? "Inspector" : "Commuter"),
                u.IsActive,
                u.CreditBalance,
                u.PersistentQrToken,
                u.CreatedAtUtc,
                u.LastLoginAtUtc
            ))
            .ToListAsync();

        return Ok(list);
    }

    /// <summary>
    /// Suspends or activates a commuter account.
    /// </summary>
    [HttpPut("users/{id}/status")]
    public async Task<IActionResult> UpdateUserStatus(Guid id, [FromBody] UpdateUserStatusRequest request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
        if (user == null)
        {
            return NotFound(new { message = "User not found." });
        }

        user.IsActive = request.IsActive;
        user.UpdatedAtUtc = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = $"Account {(request.IsActive ? "activated" : "suspended")} successfully.", isActive = user.IsActive });
    }

    /// <summary>
    /// Adjusts (adds or deducts) credit balance on a commuter's digital wallet.
    /// </summary>
    [HttpPost("users/{id}/balance")]
    public async Task<IActionResult> AdjustUserBalance(Guid id, [FromBody] AdjustUserBalanceRequest request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
        if (user == null)
        {
            return NotFound(new { message = "User not found." });
        }

        user.CreditBalance = Math.Max(0m, user.CreditBalance + request.Amount);
        user.UpdatedAtUtc = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { 
            success = true, 
            message = $"Adjusted balance by {request.Amount:+0.00;-0.00;0.00} credits. Reason: {request.Reason}",
            newBalance = user.CreditBalance 
        });
    }

    /// <summary>
    /// Returns recent transit network turnstile journeys and fare tap events.
    /// </summary>
    [HttpGet("journeys")]
    public async Task<IActionResult> GetJourneys([FromQuery] int limit = 50)
    {
        var journeys = await _context.Journeys
            .Include(j => j.User)
            .OrderByDescending(j => j.TapInTimeUtc)
            .Take(Math.Min(100, Math.Max(10, limit)))
            .Select(j => new AdminJourneyItemDto(
                j.Id,
                j.User != null ? j.User.FullName : null,
                j.User != null ? j.User.PhoneNumber : null,
                j.DeviceUuid,
                j.TapInStation,
                j.TapInTimeUtc,
                j.TapOutStation,
                j.TapOutTimeUtc,
                j.FareAmount,
                j.Status.ToString()
            ))
            .ToListAsync();

        return Ok(journeys);
    }

    /// <summary>
    /// Returns all issued and active guest passes across the network.
    /// </summary>
    [HttpGet("guest-passes")]
    public async Task<IActionResult> GetGuestPasses([FromQuery] int limit = 50)
    {
        var passes = await _context.TransportTokens
            .Where(t => t.TokenType == TokenType.GuestPass)
            .OrderByDescending(t => t.CreatedAtUtc)
            .Take(Math.Min(100, Math.Max(10, limit)))
            .Select(t => new AdminGuestPassItemDto(
                t.Id,
                t.DeviceUuid ?? "Unknown Device",
                t.PassTier ?? "1-Day",
                t.SignedToken,
                t.IsActive && (t.ExpiresAtUtc == null || t.ExpiresAtUtc > DateTime.UtcNow),
                t.CreatedAtUtc,
                t.ExpiresAtUtc
            ))
            .ToListAsync();

        return Ok(passes);
    }
}
