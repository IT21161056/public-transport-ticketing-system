using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Ticketing_System_Backend.Data;
using Ticketing_System_Backend.Models.Entities;
using Ticketing_System_Backend.Models.Enums;

namespace Ticketing_System_Backend.Repositories;

public class ReportRepository : IReportRepository
{
    private readonly AppDbContext _context;

    public ReportRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<Journey>> GetJourneysTappedInBetweenAsync(DateTime fromUtc, DateTime toUtc)
    {
        return await _context.Journeys
            .AsNoTracking()
            .Where(j => j.TapInTimeUtc >= fromUtc && j.TapInTimeUtc < toUtc && j.Status != JourneyStatus.Cancelled)
            .ToListAsync();
    }

    public async Task<List<Journey>> GetCompletedJourneysTappedOutBetweenAsync(DateTime fromUtc, DateTime toUtc)
    {
        return await _context.Journeys
            .AsNoTracking()
            // Incomplete journeys were charged the maximum fare when closed, so they count as revenue too
            .Where(j => (j.Status == JourneyStatus.Completed || j.Status == JourneyStatus.Incomplete)
                && j.TapOutTimeUtc >= fromUtc && j.TapOutTimeUtc < toUtc)
            .ToListAsync();
    }

    public async Task<List<TicketInspection>> GetInspectionsBetweenAsync(DateTime fromUtc, DateTime toUtc)
    {
        return await _context.TicketInspections
            .AsNoTracking()
            .Where(i => i.InspectedAtUtc >= fromUtc && i.InspectedAtUtc < toUtc)
            .ToListAsync();
    }
}
