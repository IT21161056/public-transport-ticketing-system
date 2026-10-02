namespace Ticketing_System_Backend.Models.Enums;

public enum TokenType
{
    LocalUser = 0,
    GuestPass = 1
}

public enum JourneyStatus
{
    InProgress = 0,
    Completed = 1,
    Cancelled = 2
}

public enum UserRole
{
    User = 0,
    Inspector = 1,
    Admin = 2
}
