using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Ticketing_System_Backend.Models.Dtos;
using Ticketing_System_Backend.Services;

namespace Ticketing_System_Backend.Controllers;

/// <summary>
/// Ticket Inspector handheld reader endpoints (design: InspectorReader).
/// </summary>
[Authorize(Roles = "1,Admin,2")]
[ApiController]
[Route("api/[controller]")]
public class InspectionController : ControllerBase
{
    private readonly IInspectionService _inspectionService;

    public InspectionController(IInspectionService inspectionService)
    {
        _inspectionService = inspectionService;
    }

    private Guid? GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
        if (claim != null && Guid.TryParse(claim.Value, out var userId))
        {
            return userId;
        }
        return null;
    }

    /// <summary>
    /// Scans a passenger's QR token and records the inspection.
    /// An invalid ticket is still a successful inspection, so both outcomes return 200 with the result in the body.
    /// </summary>
    [HttpPost("scan")]
    public async Task<IActionResult> Scan([FromBody] InspectTicketRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.QrPayload))
        {
            return BadRequest(new { message = "QR payload is required." });
        }

        var result = await _inspectionService.InspectTicketAsync(request, GetCurrentUserId());
        return Ok(result);
    }
}
