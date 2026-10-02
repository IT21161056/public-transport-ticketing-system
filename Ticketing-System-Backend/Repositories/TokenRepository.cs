using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Ticketing_System_Backend.Data;
using Ticketing_System_Backend.Models.Entities;
using Ticketing_System_Backend.Models.Enums;

namespace Ticketing_System_Backend.Repositories;

public class TokenRepository : ITokenRepository
{
    private readonly AppDbContext _context;

    public TokenRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<TransportToken> CreateAsync(TransportToken token)
    {
        await _context.TransportTokens.AddAsync(token);
        await _context.SaveChangesAsync();
        return token;
    }

    public async Task<TransportToken?> GetActiveTokenByUserIdAsync(Guid userId)
    {
        return await _context.TransportTokens
            .Where(t => t.UserId == userId && t.IsActive && t.TokenType == TokenType.LocalUser)
            .OrderByDescending(t => t.CreatedAtUtc)
            .FirstOrDefaultAsync();
    }

    public async Task<TransportToken?> GetActiveTokenByDeviceUuidAsync(string deviceUuid)
    {
        var now = DateTime.UtcNow;
        return await _context.TransportTokens
            .Where(t => t.DeviceUuid == deviceUuid &&
                        t.IsActive &&
                        t.TokenType == TokenType.GuestPass &&
                        (t.ExpiresAtUtc == null || t.ExpiresAtUtc > now))
            .OrderByDescending(t => t.CreatedAtUtc)
            .FirstOrDefaultAsync();
    }

    public async Task<TransportToken?> GetBySignedTokenAsync(string signedToken)
    {
        return await _context.TransportTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.SignedToken == signedToken);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}
