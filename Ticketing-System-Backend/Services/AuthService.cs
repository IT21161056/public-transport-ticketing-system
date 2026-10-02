using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using Ticketing_System_Backend.Models.Dtos;
using Ticketing_System_Backend.Models.Entities;
using Ticketing_System_Backend.Repositories;

namespace Ticketing_System_Backend.Services;

public class AuthService : IAuthService
{
    private readonly IOtpRepository _otpRepository;
    private readonly IUserRepository _userRepository;
    private readonly ITokenService _tokenService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        IOtpRepository otpRepository,
        IUserRepository userRepository,
        ITokenService tokenService,
        IConfiguration configuration,
        ILogger<AuthService> logger)
    {
        _otpRepository = otpRepository;
        _userRepository = userRepository;
        _tokenService = tokenService;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<RequestOtpResponse> RequestOtpAsync(RequestOtpRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.PhoneNumber))
        {
            return new RequestOtpResponse(false, "Phone number is required.");
        }

        string cleanPhone = request.PhoneNumber.Trim().Replace(" ", "").Replace("-", "");

        // Invalidate older unused OTPs for this phone
        await _otpRepository.InvalidateOldOtpsAsync(cleanPhone);

        // Generate 6-digit cryptographic OTP
        string otpCode = RandomNumberGenerator.GetInt32(100000, 999999).ToString();
        var now = DateTime.UtcNow;
        var expiresAt = now.AddMinutes(2); // 2-minute expiration per design spec

        var otpRecord = new OtpVerification
        {
            PhoneNumber = cleanPhone,
            OtpCode = otpCode,
            FullName = request.FullName?.Trim(),
            Purpose = "login_or_register",
            Attempts = 0,
            IsUsed = false,
            CreatedAtUtc = now,
            ExpiresAtUtc = expiresAt
        };

        await _otpRepository.CreateAsync(otpRecord);
        _logger.LogInformation("Generated OTP for {PhoneNumber}: {OtpCode} (Expires: {ExpiresAt})", cleanPhone, otpCode, expiresAt);

        // Include DebugOtp in response for local development / testing
        return new RequestOtpResponse(
            Success: true,
            Message: "Verification OTP has been sent. Valid for 2 minutes.",
            DebugOtp: otpCode
        );
    }

    public async Task<AuthResponseDto> VerifyOtpAsync(VerifyOtpRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.PhoneNumber) || string.IsNullOrWhiteSpace(request.OtpCode))
        {
            return new AuthResponseDto(false, "Phone number and OTP code are required.", null, null);
        }

        string cleanPhone = request.PhoneNumber.Trim().Replace(" ", "").Replace("-", "");
        var validOtp = await _otpRepository.GetLatestValidOtpAsync(cleanPhone, request.OtpCode.Trim());

        if (validOtp == null)
        {
            return new AuthResponseDto(false, "Invalid or expired OTP. Please request a new code.", null, null);
        }

        // Mark OTP as consumed
        await _otpRepository.MarkAsUsedAsync(validOtp);

        // Find or create local user
        var user = await _userRepository.GetByPhoneNumberAsync(cleanPhone);
        if (user == null)
        {
            string fullName = !string.IsNullOrWhiteSpace(request.FullName)
                ? request.FullName.Trim()
                : (!string.IsNullOrWhiteSpace(validOtp.FullName) ? validOtp.FullName : $"Commuter {cleanPhone[^4..]}");

            user = new User
            {
                PhoneNumber = cleanPhone,
                FullName = fullName,
                IsPhoneVerified = true,
                CreditBalance = 1250.00m,
                CreatedAtUtc = DateTime.UtcNow,
                LastLoginAtUtc = DateTime.UtcNow
            };

            await _userRepository.CreateAsync(user);
        }
        else
        {
            user.IsPhoneVerified = true;
            user.LastLoginAtUtc = DateTime.UtcNow;
            if (!string.IsNullOrWhiteSpace(request.FullName) && string.IsNullOrWhiteSpace(user.FullName))
            {
                user.FullName = request.FullName.Trim();
            }
            await _userRepository.UpdateAsync(user);
            await _userRepository.SaveChangesAsync();
        }

        // Ensure user has a persistent token generated
        if (string.IsNullOrWhiteSpace(user.PersistentQrToken))
        {
            await _tokenService.GetOrCreateLocalTokenAsync(user.Id);
        }

        // Generate JWT
        string jwtToken = GenerateJwtToken(user);

        var profile = new UserProfileDto(
            Id: user.Id,
            FullName: user.FullName,
            PhoneNumber: user.PhoneNumber,
            CreditBalance: user.CreditBalance,
            PersistentQrToken: user.PersistentQrToken,
            IsPhoneVerified: user.IsPhoneVerified
        );

        return new AuthResponseDto(
            Success: true,
            Message: "Authentication successful.",
            Token: jwtToken,
            User: profile
        );
    }

    private string GenerateJwtToken(User user)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_configuration["Jwt:Key"] ?? "TicketingSystemSecretKeyForQrAndTokens2026!#")
        );
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.FullName),
            new Claim(ClaimTypes.MobilePhone, user.PhoneNumber ?? string.Empty),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim("UserType", "LocalUser"),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"] ?? "TicketingSystem",
            audience: _configuration["Jwt:Audience"] ?? "TicketingSystemUsers",
            claims: claims,
            expires: DateTime.UtcNow.AddHours(double.TryParse(_configuration["Jwt:ExpiryHours"], out var hours) ? hours : 72),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
