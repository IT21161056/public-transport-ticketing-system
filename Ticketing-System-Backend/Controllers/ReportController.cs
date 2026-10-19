using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Ticketing_System_Backend.Services;

namespace Ticketing_System_Backend.Controllers;

/// <summary>
/// Transport Manager statistical reports. Query dates are inclusive, in the city's local time (yyyy-MM-dd).
/// </summary>
[Authorize(Roles = "Admin,2")]
[ApiController]
[Route("api/[controller]")]
public class ReportController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportController(IReportService reportService)
    {
        _reportService = reportService;
    }

    /// <summary>
    /// Passenger journeys by station, hour of day and day of week.
    /// </summary>
    [HttpGet("ridership")]
    public async Task<IActionResult> GetRidershipReport([FromQuery] DateOnly? from, [FromQuery] DateOnly? to)
    {
        try
        {
            return Ok(await _reportService.GenerateRidershipReportAsync(from, to));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Fares collected from completed journeys, by day and station.
    /// </summary>
    [HttpGet("revenue")]
    public async Task<IActionResult> GetRevenueReport([FromQuery] DateOnly? from, [FromQuery] DateOnly? to)
    {
        try
        {
            return Ok(await _reportService.GenerateRevenueReportAsync(from, to));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Inspection outcomes and fare-evasion rate, by reason, location, ticket type and hour.
    /// </summary>
    [HttpGet("fare-evasion")]
    public async Task<IActionResult> GetFareEvasionReport([FromQuery] DateOnly? from, [FromQuery] DateOnly? to)
    {
        try
        {
            return Ok(await _reportService.GenerateFareEvasionReportAsync(from, to));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
