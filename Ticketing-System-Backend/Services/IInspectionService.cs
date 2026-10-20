using System;
using System.Threading.Tasks;
using Ticketing_System_Backend.Models.Dtos;

namespace Ticketing_System_Backend.Services;

public interface IInspectionService
{
    Task<InspectionResponse> InspectTicketAsync(InspectTicketRequest request, Guid? inspectorId);
}
