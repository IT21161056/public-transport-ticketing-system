using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Ticketing_System_Backend.Data;
using Ticketing_System_Backend.Models.Entities;

namespace Ticketing_System_Backend.Repositories;

public class TopUpTransactionRepository : ITopUpTransactionRepository
{
    private readonly AppDbContext _context;

    public TopUpTransactionRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<TopUpTransaction> CreateAsync(TopUpTransaction transaction)
    {
        await _context.TopUpTransactions.AddAsync(transaction);
        await _context.SaveChangesAsync();
        return transaction;
    }

    public async Task<IEnumerable<TopUpTransaction>> GetByUserIdAsync(Guid userId)
    {
        return await _context.TopUpTransactions
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.CreatedAtUtc)
            .ToListAsync();
    }
}

