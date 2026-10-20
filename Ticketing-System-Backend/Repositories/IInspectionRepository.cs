using System;
using System.Threading.Tasks;
using Ticketing_System_Backend.Models.Entities;

namespace Ticketing_System_Backend.Repositories;

public interface IInspectionRepository
{
    Task<TicketInspection> CreateAsync(TicketInspection inspection);
    Task<TicketInspection?> GetLatestByTokenIdentifierSinceAsync(string tokenIdentifier, DateTime sinceUtc);
}
