using System;
using System.Threading.Tasks;
using Ticketing_System_Backend.Models.Entities;

namespace Ticketing_System_Backend.Repositories;

public interface ITokenRepository
{
    Task<TransportToken> CreateAsync(TransportToken token);
    Task<TransportToken?> GetActiveTokenByUserIdAsync(Guid userId);
    Task<TransportToken?> GetActiveTokenByDeviceUuidAsync(string deviceUuid);
    Task<TransportToken?> GetBySignedTokenAsync(string signedToken);
    Task SaveChangesAsync();
}
