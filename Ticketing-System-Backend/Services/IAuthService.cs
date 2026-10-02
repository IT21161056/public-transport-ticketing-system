using System.Threading.Tasks;
using Ticketing_System_Backend.Models.Dtos;

namespace Ticketing_System_Backend.Services;

public interface IAuthService
{
    Task<RequestOtpResponse> RequestOtpAsync(RequestOtpRequest request);
    Task<AuthResponseDto> VerifyOtpAsync(VerifyOtpRequest request);
}
