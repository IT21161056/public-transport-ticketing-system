using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Ticketing_System_Backend.Data;
using Ticketing_System_Backend.Models.Entities;
using Ticketing_System_Backend.Models.Enums;

namespace Ticketing_System_Backend.Repositories;

public class JourneyRepository : IJourneyRepository
{
    private readonly AppDbContext _context;

    public JourneyRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Journey> CreateAsync(Journey journey)
    {
        await _context.Journeys.AddAsync(journey);
        await _context.SaveChangesAsync();
        return journey;
    }

    public async Task<Journey?> GetActiveJourneyByUserIdAsync(Guid userId)
    {
        return await _context.Journeys
            .Where(j => j.UserId == userId && j.Status == JourneyStatus.InProgress)
            .OrderByDescending(j => j.TapInTimeUtc)
            .FirstOrDefaultAsync();
    }

    public async Task<Journey?> GetActiveJourneyByDeviceUuidAsync(string deviceUuid)
    {
        return await _context.Journeys
            .Where(j => j.DeviceUuid == deviceUuid && j.Status == JourneyStatus.InProgress)
            .OrderByDescending(j => j.TapInTimeUtc)
            .FirstOrDefaultAsync();
    }

    public async Task<IEnumerable<Journey>> GetHistoryByUserIdAsync(Guid userId, int limit = 50)
    {
        return await _context.Journeys
            .Where(j => j.UserId == userId)
            .OrderByDescending(j => j.TapInTimeUtc)
            .Take(limit)
            .ToListAsync();
    }

    public async Task<Journey?> GetLatestJourneyAsync(Guid? userId, string? deviceUuid)
    {
        if (userId == null && string.IsNullOrEmpty(deviceUuid))
        {
            return null;
        }

        var query = userId != null
            ? _context.Journeys.Where(j => j.UserId == userId)
            : _context.Journeys.Where(j => j.DeviceUuid == deviceUuid);

        return await query
            .OrderByDescending(j => j.TapInTimeUtc)
            .FirstOrDefaultAsync();
    }

    public async Task<(bool Closed, decimal? BalanceAfter)> CloseJourneyAsync(Journey journey, Guid? chargeUserId)
    {
        await using var transaction = await _context.Database.BeginTransactionAsync();

        // Only an in-progress journey can be closed, so two taps at the same moment cannot charge twice
        int updated = await _context.Journeys
            .Where(j => j.Id == journey.Id && j.Status == JourneyStatus.InProgress)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(j => j.Status, journey.Status)
                .SetProperty(j => j.TapOutStation, journey.TapOutStation)
                .SetProperty(j => j.TapOutTimeUtc, journey.TapOutTimeUtc)
                .SetProperty(j => j.AlightingStopId, journey.AlightingStopId)
                .SetProperty(j => j.StopsTravelled, journey.StopsTravelled)
                .SetProperty(j => j.FareAmount, journey.FareAmount)
                .SetProperty(j => j.FarePolicy, journey.FarePolicy));

        var entry = _context.Entry(journey);
        if (updated == 0)
        {
            await transaction.RollbackAsync();
            if (entry.State != EntityState.Detached)
            {
                await entry.ReloadAsync();
            }
            return (false, null);
        }

        decimal? balanceAfter = null;
        if (chargeUserId != null)
        {
            decimal fare = journey.FareAmount;
            if (fare > 0)
            {
                // Atomic decrement in SQL instead of read-modify-write on the tracked user
                await _context.Users
                    .Where(u => u.Id == chargeUserId)
                    .ExecuteUpdateAsync(setters => setters
                        .SetProperty(u => u.CreditBalance, u => u.CreditBalance - fare)
                        .SetProperty(u => u.UpdatedAtUtc, DateTime.UtcNow));
            }

            balanceAfter = await _context.Users
                .Where(u => u.Id == chargeUserId)
                .Select(u => u.CreditBalance)
                .SingleAsync();
        }

        await transaction.CommitAsync();

        // The database now matches the in-memory journey: accept its values so a later SaveChanges does not write it again.
        // (Setting State = Unchanged alone would roll the in-memory values back to the old ones.)
        if (entry.State != EntityState.Detached)
        {
            entry.OriginalValues.SetValues(entry.CurrentValues);
            entry.State = EntityState.Unchanged;
        }

        return (true, balanceAfter);
    }

    public Task UpdateAsync(Journey journey)
    {
        _context.Journeys.Update(journey);
        return Task.CompletedTask;
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}
