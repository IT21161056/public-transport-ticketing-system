using System;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Ticketing_System_Backend.Models.Dtos;
using Ticketing_System_Backend.Models.Entities;
using Ticketing_System_Backend.Models.Enums;
using Ticketing_System_Backend.Repositories;

namespace Ticketing_System_Backend.Services;

public class TokenService : ITokenService
{
    private readonly ITokenRepository _tokenRepository;
    private readonly IUserRepository _userRepository;
    private readonly string _signingSecret;

    public TokenService(
        ITokenRepository tokenRepository,
        IUserRepository userRepository,
        IConfiguration configuration)
    {
        _tokenRepository = tokenRepository;
        _userRepository = userRepository;
        _signingSecret = configuration["Jwt:Key"] ?? "TicketingSystemSecretKeyForQrAndTokens2026!#";
    }

    public async Task<GenerateTokenResponse> GetOrCreateLocalTokenAsync(Guid userId)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            throw new ArgumentException("User not found.");
        }

        var existing = await _tokenRepository.GetActiveTokenByUserIdAsync(userId);
        if (existing != null)
        {
            return new GenerateTokenResponse(
                Token: existing.SignedToken,
                TokenType: "LocalUser",
                ExpiresAtUtc: existing.ExpiresAtUtc,
                Nonce: existing.Nonce,
                QrPayload: existing.SignedToken
            );
        }

        string nonce = Guid.NewGuid().ToString("N")[..8];
        long expiryEpoch = 0; // Permanent account token
        string signedString = SignPayload("LOCAL", userId.ToString(), expiryEpoch, nonce);

        var token = new TransportToken
        {
            UserId = userId,
            TokenType = TokenType.LocalUser,
            SignedToken = signedString,
            Nonce = nonce,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow,
            ExpiresAtUtc = null
        };

        await _tokenRepository.CreateAsync(token);

        // Update user's persistent token reference
        user.PersistentQrToken = signedString;
        await _userRepository.UpdateAsync(user);
        await _userRepository.SaveChangesAsync();

        return new GenerateTokenResponse(
            Token: signedString,
            TokenType: "LocalUser",
            ExpiresAtUtc: null,
            Nonce: nonce,
            QrPayload: signedString
        );
    }

    public async Task<GenerateTokenResponse> IssueGuestPassAsync(string deviceUuid, string passTier, decimal amount)
    {
        if (string.IsNullOrWhiteSpace(deviceUuid))
        {
            throw new ArgumentException("Device UUID is required.");
        }

        TimeSpan duration = passTier?.Trim().ToLowerInvariant() switch
        {
            "3-day" or "3day" => TimeSpan.FromDays(3),
            "7-day" or "7day" or "1-week" => TimeSpan.FromDays(7),
            _ => TimeSpan.FromDays(1) // Default: 1-Day (24h)
        };

        var now = DateTime.UtcNow;
        var expiresAtUtc = now.Add(duration);
        long expiryEpoch = new DateTimeOffset(expiresAtUtc).ToUnixTimeSeconds();
        string nonce = Guid.NewGuid().ToString("N")[..8];

        string signedString = SignPayload("GUEST", deviceUuid.Trim(), expiryEpoch, nonce);

        var token = new TransportToken
        {
            DeviceUuid = deviceUuid.Trim(),
            TokenType = TokenType.GuestPass,
            PassTier = passTier?.Trim() ?? "1-Day",
            SignedToken = signedString,
            Nonce = nonce,
            IsActive = true,
            CreatedAtUtc = now,
            ExpiresAtUtc = expiresAtUtc
        };

        await _tokenRepository.CreateAsync(token);

        return new GenerateTokenResponse(
            Token: signedString,
            TokenType: "GuestPass",
            ExpiresAtUtc: expiresAtUtc,
            Nonce: nonce,
            QrPayload: signedString
        );
    }

    public async Task<GuestPassDto?> GetActiveGuestPassAsync(string deviceUuid)
    {
        var pass = await _tokenRepository.GetActiveTokenByDeviceUuidAsync(deviceUuid);
        if (pass == null || pass.ExpiresAtUtc == null)
        {
            return null;
        }

        return new GuestPassDto(
            Id: pass.Id,
            DeviceUuid: pass.DeviceUuid ?? deviceUuid,
            PassTier: pass.PassTier ?? "1-Day",
            SignedToken: pass.SignedToken,
            ExpiresAtUtc: pass.ExpiresAtUtc.Value,
            IsActive: pass.IsActive
        );
    }

    public ScanValidationResult ValidateTokenPayload(string qrPayload)
    {
        if (string.IsNullOrWhiteSpace(qrPayload))
        {
            return new ScanValidationResult(false, "Empty token.", "Unknown", "");
        }

        var parts = qrPayload.Split('|');
        if (parts.Length != 6 || parts[0] != "TK1")
        {
            return new ScanValidationResult(false, "Invalid token format.", "Unknown", "");
        }

        string type = parts[1];
        string identifier = parts[2];
        if (!long.TryParse(parts[3], out long expiryEpoch))
        {
            return new ScanValidationResult(false, "Invalid expiry format.", type, identifier);
        }
        string nonce = parts[4];
        string signature = parts[5];

        // Verify cryptographic signature
        string expectedSignature = ComputeHmacSignature($"TK1:{type}:{identifier}:{expiryEpoch}:{nonce}");
        if (!CryptographicOperations.FixedTimeEquals(
                Encoding.UTF8.GetBytes(signature),
                Encoding.UTF8.GetBytes(expectedSignature)))
        {
            return new ScanValidationResult(false, "Cryptographic signature verification failed.", type, identifier);
        }

        // Verify expiration for guest passes
        if (expiryEpoch > 0)
        {
            var expiry = DateTimeOffset.FromUnixTimeSeconds(expiryEpoch);
            if (DateTimeOffset.UtcNow > expiry)
            {
                return new ScanValidationResult(false, "Pass has expired.", type, identifier);
            }
        }

        return new ScanValidationResult(true, "Token is authentic and active.", type, identifier);
    }

    private string SignPayload(string type, string identifier, long expiryEpoch, string nonce)
    {
        string raw = $"TK1:{type}:{identifier}:{expiryEpoch}:{nonce}";
        string sig = ComputeHmacSignature(raw);
        return $"TK1|{type}|{identifier}|{expiryEpoch}|{nonce}|{sig}";
    }

    private string ComputeHmacSignature(string message)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(_signingSecret));
        byte[] hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(message));
        return Convert.ToBase64String(hash).Replace("+", "-").Replace("/", "_").TrimEnd('=');
    }
}
