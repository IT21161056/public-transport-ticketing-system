using System;
using System.Threading.Tasks;
using Ticketing_System_Backend.Models.Dtos;

namespace Ticketing_System_Backend.Services;

/// <summary>
/// Statistical reports for the Transport Manager (design class: ReportService).
/// Dates are inclusive and in the city's local time; when omitted the last 30 days are used.
/// </summary>
public interface IReportService
{
    Task<RidershipReportDto> GenerateRidershipReportAsync(DateOnly? from, DateOnly? to);
    Task<RevenueReportDto> GenerateRevenueReportAsync(DateOnly? from, DateOnly? to);
    Task<FareEvasionReportDto> GenerateFareEvasionReportAsync(DateOnly? from, DateOnly? to);
}
