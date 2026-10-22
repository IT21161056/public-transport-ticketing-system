using System;
using System.Collections.Generic;

namespace Ticketing_System_Backend.Models.Entities;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string? UserName { get; set; }
    public string? Email { get; set; }
    public string? PasswordHash { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public short Role { get; set; } = 0;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAtUtc { get; set; }
    public DateTime? LastLoginAtUtc { get; set; }
    public string? UserCode { get; set; }
    public decimal CreditBalance { get; set; } = 1250.00m;
    public string? PersistentQrToken { get; set; }
    public bool IsPhoneVerified { get; set; } = false;

    // Navigation properties
    public ICollection<Journey> Journeys { get; set; } = new List<Journey>();
    public ICollection<TransportToken> Tokens { get; set; } = new List<TransportToken>();
    public ICollection<TopUpTransaction> TopUpTransactions { get; set; } = new List<TopUpTransaction>();

    /// <summary>
    /// Sequence Diagram Step 12-13: account.topUp(amount) -> balanceUpdated
    /// </summary>
    public decimal TopUp(decimal amount)
    {
        CreditBalance += amount;
        UpdatedAtUtc = DateTime.UtcNow;
        return CreditBalance;
    }

    /// <summary>
    /// Sequence Diagram Steps 14-15 & 19-20: account.addTransaction(tx) -> transactionRecorded / failedAttemptRecorded
    /// </summary>
    public void AddTransaction(TopUpTransaction tx)
    {
        tx.UserId = Id;
        TopUpTransactions.Add(tx);
    }
}
