using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Ticketing_System_Backend.Models.Entities;

namespace Ticketing_System_Backend.Repositories;

public interface ITransitRepository
{
    /// <summary>
    /// Bus with its route and the route's ordered stops (read-only).
    /// </summary>
    Task<Bus?> GetBusWithRouteAsync(Guid busId);

    /// <summary>
    /// Active routes with their stops and active buses (read-only).
    /// </summary>
    Task<List<TransitRoute>> GetActiveRoutesAsync();
}
