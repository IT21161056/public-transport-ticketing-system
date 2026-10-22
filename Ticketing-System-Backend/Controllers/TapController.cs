using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Ticketing_System_Backend.Models.Dtos;
using Ticketing_System_Backend.Services;

namespace Ticketing_System_Backend.Controllers;

/// <summary>
/// Bus boarding reader endpoints (design: BoardingReader). The reader simulator runs in the operations console,
/// so it uses the same staff roles as the inspector reader.
/// </summary>
[Authorize(Roles = "1,Admin,2")]
[ApiController]
[Route("api/[controller]")]
public class TapController : ControllerBase
{
    private readonly ITapService _tapService;

    public TapController(ITapService tapService)
    {
        _tapService = tapService;
    }

    /// <summary>
    /// A passenger taps their QR ticket. The reader decides Tap In or Tap Out.
    /// A refused tap (e.g. low balance) is still a handled tap, so it returns 200 with Accepted = false.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Tap([FromBody] TapRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.QrPayload))
        {
            return BadRequest(new { message = "QR payload is required." });
        }

        try
        {
            var result = await _tapService.ProcessTapAsync(request);
            return Ok(result);
        }
        catch (ReaderSetupException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Routes, stops and buses for setting up a reader, with the fare policy in force.
    /// </summary>
    [HttpGet("network")]
    public async Task<IActionResult> GetNetwork()
    {
        var network = await _tapService.GetNetworkAsync();
        return Ok(network);
    }
}
