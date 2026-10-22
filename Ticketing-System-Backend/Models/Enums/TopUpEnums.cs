namespace Ticketing_System_Backend.Models.Enums;

/// <summary>
/// Supported top-up channels resolved by TopUpChannelFactory.
/// </summary>
public enum TopUpMethod
{
    Online = 0,
    Mobile = 1,
    PayStation = 2
}

/// <summary>
/// Execution status of a TopUpTransaction.
/// </summary>
public enum TopUpStatus
{
    Pending = 0,
    Success = 1,
    Failed = 2
}

