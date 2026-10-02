using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Ticketing_System_Backend.Models.Dtos;
using Ticketing_System_Backend.Services;

namespace Ticketing_System_Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    /// <summary>
    /// Step 1: Request an OTP to be sent to a phone number.
    /// In demo/dev mode, debug OTP is returned in the response payload.
    /// </summary>
    [HttpPost("request-otp")]
    public async Task<IActionResult> RequestOtp([FromBody] RequestOtpRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.PhoneNumber))
        {
            return BadRequest(new RequestOtpResponse(false, "Phone number is required."));
        }

        var result = await _authService.RequestOtpAsync(request);
        return Ok(result);
    }

    /// <summary>
    /// Step 2: Verify the 6-digit OTP code and retrieve JWT token + user profile.
    /// </summary>
    [HttpPost("verify-otp")]
    public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.PhoneNumber) || string.IsNullOrWhiteSpace(request.OtpCode))
        {
            return BadRequest(new AuthResponseDto(false, "Phone number and OTP code are required.", null, null));
        }

        var result = await _authService.VerifyOtpAsync(request);
        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }
}
