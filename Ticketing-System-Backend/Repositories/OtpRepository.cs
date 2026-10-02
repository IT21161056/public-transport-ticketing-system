using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Ticketing_System_Backend.Data;
using Ticketing_System_Backend.Models.Entities;

namespace Ticketing_System_Backend.Repositories;

public class OtpRepository : IOtpRepository
{
    private readonly AppDbContext _context;

    public OtpRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<OtpVerification> CreateAsync(OtpVerification otp)
    {
        await _context.OtpVerifications.AddAsync(otp);
        await _context.SaveChangesAsync();
        return otp;
    }

    public async Task<OtpVerification?> GetLatestValidOtpAsync(string phoneNumber, string otpCode)
    {
        var cleaned = phoneNumber.Trim().Replace(" ", "").Replace("-", "");
        var now = DateTime.UtcNow;

        return await _context.OtpVerifications
            .Where(o => (o.PhoneNumber == cleaned || o.PhoneNumber == phoneNumber) &&
                        o.OtpCode == otpCode &&
                        !o.IsUsed &&
                        o.ExpiresAtUtc > now)
            .OrderByDescending(o => o.CreatedAtUtc)
            .FirstOrDefaultAsync();
    }

    public async Task MarkAsUsedAsync(OtpVerification otp)
    {
        otp.IsUsed = true;
        _context.OtpVerifications.Update(otp);
        await _context.SaveChangesAsync();
    }

    public async Task InvalidateOldOtpsAsync(string phoneNumber)
    {
        var cleaned = phoneNumber.Trim().Replace(" ", "").Replace("-", "");
        var unexpired = await _context.OtpVerifications
            .Where(o => (o.PhoneNumber == cleaned || o.PhoneNumber == phoneNumber) && !o.IsUsed)
            .ToListAsync();

        foreach (var item in unexpired)
        {
            item.IsUsed = true;
        }

        if (unexpired.Any())
        {
            await _context.SaveChangesAsync();
        }
    }
}
