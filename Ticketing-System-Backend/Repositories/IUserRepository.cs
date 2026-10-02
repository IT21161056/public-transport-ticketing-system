using System;
using System.Threading.Tasks;
using Ticketing_System_Backend.Models.Entities;

namespace Ticketing_System_Backend.Repositories;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(Guid id);
    Task<User?> GetByPhoneNumberAsync(string phoneNumber);
    Task<User> CreateAsync(User user);
    Task UpdateAsync(User user);
    Task SaveChangesAsync();
}
