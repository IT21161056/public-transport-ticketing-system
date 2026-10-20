using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Ticketing_System_Backend.Data;
using Ticketing_System_Backend.Models.Entities;

namespace Ticketing_System_Backend.Repositories;

public class InspectionRepository : IInspectionRepository
{
    private readonly AppDbContext _context;

    public InspectionRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<TicketInspection> CreateAsync(TicketInspection inspection)
    {
        await _context.TicketInspections.AddAsync(inspection);
        await _context.SaveChangesAsync();
        return inspection;
    }

    /// <summary>
    /// Returns the most recent inspection of a token at or after the given time.
    /// Used to avoid recording duplicate scans of the same passenger.
    /// </summary>
    public async Task<TicketInspection?> GetLatestByTokenIdentifierSinceAsync(string tokenIdentifier, DateTime sinceUtc)
    {
        return await _context.TicketInspections
            .Include(i => i.Journey)
            .Where(i => i.TokenIdentifier == tokenIdentifier && i.InspectedAtUtc >= sinceUtc)
            .OrderByDescending(i => i.InspectedAtUtc)
            .FirstOrDefaultAsync();
    }
}
