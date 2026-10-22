using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Ticketing_System_Backend.Models.Entities;

namespace Ticketing_System_Backend.Data;

/// <summary>
/// Seeds the Colombo demo bus network (routes, ordered stops, buses) used by the boarding reader.
/// Stop names match the report demo data so ridership-by-stop stays consistent.
/// Runs only when no routes exist.
/// </summary>
public static class TransitNetworkSeeder
{
    // Code, name, fare zone
    private static readonly (string Code, string Name, int Zone)[] StopData =
    {
        ("PET", "Pettah", 1),
        ("FOR", "Colombo Fort", 1),
        ("MRD", "Maradana", 1),
        ("KOL", "Kollupitiya", 1),
        ("BAM", "Bambalapitiya", 2),
        ("WEL", "Wellawatte", 2),
        ("DEH", "Dehiwala", 3),
        ("MTL", "Mount Lavinia", 3),
        ("BOR", "Borella", 2),
        ("NAR", "Narahenpita", 2),
        ("THU", "Thummulla", 2),
        ("KIR", "Kirulapone", 2),
        ("KOH", "Kohuwala", 3),
        ("NUG", "Nugegoda", 3),
        ("MAH", "Maharagama", 4),
        ("RAJ", "Rajagiriya", 2),
        ("BAT", "Battaramulla", 3),
        ("MAL", "Malabe", 4),
        ("KAD", "Kaduwela", 4),
    };

    // Route number, name, buses, ordered stops with distance from the first stop (km)
    private static readonly (string Number, string Name, string[] Buses, (string Code, decimal Km)[] Stops)[] RouteData =
    {
        ("100", "Pettah - Mount Lavinia", new[] { "NA-1188" }, new[]
        {
            ("PET", 0.0m), ("FOR", 1.2m), ("KOL", 4.0m), ("BAM", 5.5m), ("WEL", 7.5m), ("DEH", 9.5m), ("MTL", 12.0m)
        }),
        ("120", "Pettah - Kohuwala", new[] { "NC-4471" }, new[]
        {
            ("PET", 0.0m), ("MRD", 2.0m), ("BOR", 4.0m), ("NAR", 6.0m), ("KIR", 8.0m), ("KOH", 10.0m)
        }),
        ("138", "Pettah - Maharagama", new[] { "NB-5542", "NB-6120" }, new[]
        {
            ("PET", 0.0m), ("FOR", 1.2m), ("KOL", 4.0m), ("THU", 6.5m), ("KIR", 8.5m), ("NUG", 10.5m), ("MAH", 15.0m)
        }),
        ("177", "Kollupitiya - Kaduwela", new[] { "ND-2210" }, new[]
        {
            ("KOL", 0.0m), ("BOR", 3.5m), ("RAJ", 6.5m), ("BAT", 9.0m), ("MAL", 13.5m), ("KAD", 17.0m)
        }),
    };

    public static async Task SeedAsync(AppDbContext context)
    {
        if (await context.TransitRoutes.AnyAsync())
        {
            return;
        }

        var stops = StopData.ToDictionary(
            s => s.Code,
            s => new Stop { Code = s.Code, Name = s.Name, Zone = s.Zone });
        await context.Stops.AddRangeAsync(stops.Values);

        foreach (var routeData in RouteData)
        {
            var route = new TransitRoute { RouteNumber = routeData.Number, Name = routeData.Name };

            int sequence = 1;
            foreach (var (code, km) in routeData.Stops)
            {
                route.Stops.Add(new RouteStop
                {
                    StopId = stops[code].Id,
                    Sequence = sequence++,
                    DistanceFromStartKm = km
                });
            }

            foreach (var registration in routeData.Buses)
            {
                route.Buses.Add(new Bus { RegistrationNumber = registration });
            }

            await context.TransitRoutes.AddAsync(route);
        }

        await context.SaveChangesAsync();
    }
}
