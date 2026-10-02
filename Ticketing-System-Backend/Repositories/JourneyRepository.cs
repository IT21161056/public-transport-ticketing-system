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
