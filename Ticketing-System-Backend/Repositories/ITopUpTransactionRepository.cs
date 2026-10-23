using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Ticketing_System_Backend.Models.Entities;

namespace Ticketing_System_Backend.Repositories;

public interface ITopUpTransactionRepository
{
    Task<TopUpTransaction> CreateAsync(TopUpTransaction transaction);
    Task<IEnumerable<TopUpTransaction>> GetByUserIdAsync(Guid userId);
}

