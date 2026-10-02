using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Ticketing_System_Backend.Data;
using Ticketing_System_Backend.Models.Entities;

namespace Ticketing_System_Backend.Repositories;

public class UserRepository : IUserRepository
{
    private readonly AppDbContext _context;

    public UserRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<User?> GetByIdAsync(Guid id)
    {
        return await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
    }

    public async Task<User?> GetByPhoneNumberAsync(string phoneNumber)
    {
        var cleaned = phoneNumber.Trim().Replace(" ", "").Replace("-", "");
        return await _context.Users.FirstOrDefaultAsync(u => 
            u.PhoneNumber != null && 
            (u.PhoneNumber == cleaned || u.PhoneNumber == phoneNumber));
    }

    public async Task<User> CreateAsync(User user)
    {
        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();
        return user;
    }

    public Task UpdateAsync(User user)
    {
        user.UpdatedAtUtc = DateTime.UtcNow;
        _context.Users.Update(user);
        return Task.CompletedTask;
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}
