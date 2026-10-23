using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Ticketing_System_Backend.Data;
using Ticketing_System_Backend.Models.Entities;

namespace Ticketing_System_Backend.Repositories;

public class TransitRepository : ITransitRepository
{
    private readonly AppDbContext _context;

    public TransitRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Bus?> GetBusWithRouteAsync(Guid busId)
    {
        return await _context.Buses
            .AsNoTracking()
            .Include(b => b.Route)
                .ThenInclude(r => r!.Stops)
                    .ThenInclude(rs => rs.Stop)
            .FirstOrDefaultAsync(b => b.Id == busId);
    }

    public async Task<List<TransitRoute>> GetActiveRoutesAsync()
    {
        return await _context.TransitRoutes
            .AsNoTracking()
            .AsSplitQuery()
            .Where(r => r.IsActive)
            .Include(r => r.Stops)
                .ThenInclude(rs => rs.Stop)
            .Include(r => r.Buses.Where(b => b.IsActive))
            .OrderBy(r => r.RouteNumber)
            .ToListAsync();
    }
}
