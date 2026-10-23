using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using System.Collections.Generic;
using Ticketing_System_Backend.Models.Dtos;
using Ticketing_System_Backend.Models.Entities;
using Ticketing_System_Backend.Models.Enums;
using Ticketing_System_Backend.Repositories;
using Ticketing_System_Backend.Utils;

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

        // Find local user
        var user = await _userRepository.GetByPhoneNumberAsync(cleanPhone);
        bool isNewUser = (user == null);

        if (user == null)
        {
            string fullName = !string.IsNullOrWhiteSpace(request.FullName)
                ? request.FullName.Trim()
                : (!string.IsNullOrWhiteSpace(validOtp.FullName) ? validOtp.FullName : $"Commuter {cleanPhone[^4..]}");

            decimal initialCredit = request.InitialCredit.HasValue && request.InitialCredit.Value >= 500.00m
                ? request.InitialCredit.Value
                : 500.00m; // Default initial credit 500.00 per Flow 1 specification
            string medium = !string.IsNullOrWhiteSpace(request.TokenMedium) ? request.TokenMedium.Trim() : "Digital QR";

            user = new User
            {
                PhoneNumber = cleanPhone,
                FullName = fullName,
                IsPhoneVerified = true,
                CreditBalance = initialCredit,
                TokenMedium = medium,
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
            if (request.InitialCredit.HasValue && request.InitialCredit.Value > 0)
            {
                user.CreditBalance = request.InitialCredit.Value;
            }
            if (!string.IsNullOrWhiteSpace(request.TokenMedium))
            {
                user.TokenMedium = request.TokenMedium.Trim();
            }
            await _userRepository.UpdateAsync(user);
            await _userRepository.SaveChangesAsync();
        }

        // Ensure user has a persistent token generated
        if (string.IsNullOrWhiteSpace(user.PersistentQrToken))
        {
            await _tokenService.GetOrCreateLocalTokenAsync(user.Id, user.TokenMedium);
        }

        // Generate JWT
        string jwtToken = GenerateJwtToken(user);

        var profile = new UserProfileDto(
            Id: user.Id,
            FullName: user.FullName,
            PhoneNumber: user.PhoneNumber,
            CreditBalance: user.CreditBalance,
            PersistentQrToken: user.PersistentQrToken,
            IsPhoneVerified: user.IsPhoneVerified,
            Role: user.Role,
            Email: user.Email,
            UserName: user.UserName,
            TokenMedium: user.TokenMedium
        );

        return new AuthResponseDto(
            Success: true,
            Message: "Authentication successful.",
            Token: jwtToken,
            User: profile,
            IsNewUser: isNewUser
        );
    }

    public async Task<AuthResponseDto> CompleteRegistrationAsync(CompleteRegistrationRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.PhoneNumber))
        {
            return new AuthResponseDto(false, "Phone number is required.", null, null);
        }

        if (request.InitialCredit < 500.00m)
        {
            return new AuthResponseDto(false, "Initial credit must be at least LKR 500.00.", null, null);
        }

        string cleanPhone = request.PhoneNumber.Trim().Replace(" ", "").Replace("-", "");
        var user = await _userRepository.GetByPhoneNumberAsync(cleanPhone);

        string medium = !string.IsNullOrWhiteSpace(request.TokenMedium) ? request.TokenMedium.Trim() : "Digital QR";
        string fullName = !string.IsNullOrWhiteSpace(request.FullName) ? request.FullName.Trim() : (user?.FullName ?? $"Commuter {cleanPhone[^4..]}");

        if (user == null)
        {
            user = new User
            {
                PhoneNumber = cleanPhone,
                FullName = fullName,
                IsPhoneVerified = true,
                CreditBalance = request.InitialCredit,
                TokenMedium = medium,
                CreatedAtUtc = DateTime.UtcNow,
                LastLoginAtUtc = DateTime.UtcNow
            };
            await _userRepository.CreateAsync(user);
        }
        else
        {
            user.FullName = fullName;
            user.IsPhoneVerified = true;
            user.CreditBalance = request.InitialCredit;
            user.TokenMedium = medium;
            user.LastLoginAtUtc = DateTime.UtcNow;
            await _userRepository.UpdateAsync(user);
            await _userRepository.SaveChangesAsync();
        }

        // Generate active AccountLinkedToken for this commuter
        var tokenRes = await _tokenService.GetOrCreateLocalTokenAsync(user.Id, medium);

        // Generate JWT
        string jwtToken = GenerateJwtToken(user);

        var profile = new UserProfileDto(
            Id: user.Id,
            FullName: user.FullName,
            PhoneNumber: user.PhoneNumber,
            CreditBalance: user.CreditBalance,
            PersistentQrToken: user.PersistentQrToken ?? tokenRes.Token,
            IsPhoneVerified: user.IsPhoneVerified,
            Role: user.Role,
            Email: user.Email,
            UserName: user.UserName,
            TokenMedium: user.TokenMedium
        );

        return new AuthResponseDto(
            Success: true,
            Message: "Registration and initial credit activation successful.",
            Token: jwtToken,
            User: profile,
            IsNewUser: false
        );
    }

    public async Task<AdminAuthResponse> AdminLoginAsync(AdminLoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.UsernameOrEmail) || string.IsNullOrWhiteSpace(request.Password))
        {
            return new AdminAuthResponse(false, "Username/Email and password are required.", null, null);
        }

        var user = await _userRepository.GetByUsernameOrEmailAsync(request.UsernameOrEmail);
        if (user == null)
        {
            _logger.LogWarning("Admin login failed: User '{Identifier}' not found in database.", request.UsernameOrEmail);
            return new AdminAuthResponse(false, "Invalid administrator credentials.", null, null);
        }

        // Verify role
        if (user.Role != (short)UserRole.Admin)
        {
            _logger.LogWarning("Admin login failed: User '{Identifier}' has role {Role}, required {Required}.", request.UsernameOrEmail, user.Role, (short)UserRole.Admin);
            return new AdminAuthResponse(false, "Access denied. Account does not have administrator privileges.", null, null);
        }

        // Verify active status
        if (!user.IsActive)
        {
            _logger.LogWarning("Admin login failed: User '{Identifier}' is inactive.", request.UsernameOrEmail);
            return new AdminAuthResponse(false, "Administrator account has been suspended.", null, null);
        }

        // Verify password
        bool pwdMatch = !string.IsNullOrEmpty(user.PasswordHash) && PasswordHelper.VerifyPassword(request.Password, user.PasswordHash);
        if (!pwdMatch)
        {
            _logger.LogWarning("Admin login failed: Password mismatch for user '{Identifier}'.", request.UsernameOrEmail);
            return new AdminAuthResponse(false, "Invalid administrator credentials.", null, null);
        }

        user.LastLoginAtUtc = DateTime.UtcNow;
        await _userRepository.UpdateAsync(user);
        await _userRepository.SaveChangesAsync();

        string jwt = GenerateJwtToken(user);

        var profile = new UserProfileDto(
            Id: user.Id,
            FullName: user.FullName,
            PhoneNumber: user.PhoneNumber,
            CreditBalance: user.CreditBalance,
            PersistentQrToken: user.PersistentQrToken,
            IsPhoneVerified: user.IsPhoneVerified,
            Role: user.Role,
            Email: user.Email,
            UserName: user.UserName
        );

        return new AdminAuthResponse(
            Success: true,
            Message: "Administrator login successful.",
            Token: jwt,
            User: profile
        );
    }

    private string GenerateJwtToken(User user)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_configuration["Jwt:Key"] ?? "TicketingSystemSecretKeyForQrAndTokens2026!#")
        );
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.FullName),
            new Claim(ClaimTypes.MobilePhone, user.PhoneNumber ?? string.Empty),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim("UserType", user.Role == (short)UserRole.Admin ? "Administrator" : "LocalUser"),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        if (user.Role == (short)UserRole.Admin)
        {
            claims.Add(new Claim(ClaimTypes.Role, "Admin"));
            claims.Add(new Claim("IsAdmin", "true"));
        }

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
