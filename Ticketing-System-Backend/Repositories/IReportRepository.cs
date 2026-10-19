using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Ticketing_System_Backend.Models.Entities;

namespace Ticketing_System_Backend.Repositories;

/// <summary>
/// Read-only queries over operational records for management reports.
/// All ranges are [fromUtc, toUtc).
/// </summary>
public interface IReportRepository
{
    Task<List<Journey>> GetJourneysTappedInBetweenAsync(DateTime fromUtc, DateTime toUtc);
    Task<List<Journey>> GetCompletedJourneysTappedOutBetweenAsync(DateTime fromUtc, DateTime toUtc);
    Task<List<TicketInspection>> GetInspectionsBetweenAsync(DateTime fromUtc, DateTime toUtc);
}
