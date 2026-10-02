using System;
using System.Threading.Tasks;
using Ticketing_System_Backend.Models.Entities;

namespace Ticketing_System_Backend.Repositories;

public interface IOtpRepository
{
    Task<OtpVerification> CreateAsync(OtpVerification otp);
    Task<OtpVerification?> GetLatestValidOtpAsync(string phoneNumber, string otpCode);
    Task MarkAsUsedAsync(OtpVerification otp);
    Task InvalidateOldOtpsAsync(string phoneNumber);
}
