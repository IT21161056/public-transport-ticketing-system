using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Ticketing_System_Backend.Models.Entities;

namespace Ticketing_System_Backend.Repositories;

public interface IJourneyRepository
{
    Task<Journey> CreateAsync(Journey journey);
    Task<Journey?> GetActiveJourneyByUserIdAsync(Guid userId);
    Task<Journey?> GetActiveJourneyByDeviceUuidAsync(string deviceUuid);
    Task<IEnumerable<Journey>> GetHistoryByUserIdAsync(Guid userId, int limit = 50);
    Task UpdateAsync(Journey journey);
    Task SaveChangesAsync();
}
