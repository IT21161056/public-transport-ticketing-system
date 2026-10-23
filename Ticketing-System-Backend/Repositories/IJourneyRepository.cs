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

    /// <summary>
    /// Most recent journey of a passenger (any status), by tap-in time.
    /// </summary>
    Task<Journey?> GetLatestJourneyAsync(Guid? userId, string? deviceUuid);

    /// <summary>
    /// Saves the closing details of an in-progress journey and deducts its fare from the account
    /// in one database transaction. Returns Closed = false if the journey was already closed by another tap.
    /// BalanceAfter is the account balance after the charge (null for guests).
    /// </summary>
    Task<(bool Closed, decimal? BalanceAfter)> CloseJourneyAsync(Journey journey, Guid? chargeUserId);
    Task SaveChangesAsync();
}
