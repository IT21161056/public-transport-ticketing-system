using System;
using System.Threading.Tasks;
using Ticketing_System_Backend.Models.Dtos;

namespace Ticketing_System_Backend.Services;

/// <summary>
/// Bus boarding reader (design: BoardingReader). One reader handles both taps:
/// no open journey means Tap In, an open journey on this bus means Tap Out.
/// </summary>
public interface ITapService
{
    Task<TapResponse> ProcessTapAsync(TapRequest request);

    Task<TransitNetworkDto> GetNetworkAsync();
}

/// <summary>
/// The reader itself is set up wrongly (unknown bus, stop not on its route), as opposed to a passenger problem.
/// </summary>
public class ReaderSetupException : Exception
{
    public ReaderSetupException(string message) : base(message)
    {
    }
}
