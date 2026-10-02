using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Ticketing_System_Backend.Data;
using Ticketing_System_Backend.Repositories;
using Ticketing_System_Backend.Services;
using Ticketing_System_Backend.Services.Fare;

namespace Ticketing_System_Backend.Extensions;

/// <summary>
/// Modular extension methods for configuring application services and dependencies.
/// </summary>
public static class ServiceExtensions
{
    /// <summary>
    /// Configures Entity Framework Core with PostgreSQL connection.
    /// </summary>
    public static IServiceCollection AddDatabase(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

        return services;
    }

    /// <summary>
    /// Registers repository implementations for database access.
    /// </summary>
    public static IServiceCollection AddRepositories(this IServiceCollection services)
    {
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IOtpRepository, OtpRepository>();
        services.AddScoped<ITokenRepository, TokenRepository>();
        services.AddScoped<IJourneyRepository, JourneyRepository>();

        return services;
    }

    /// <summary>
    /// Registers core domain services and fare calculation strategies.
    /// </summary>
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IAccountService, AccountService>();
        services.AddScoped<ITokenService, TokenService>();
        services.AddSingleton<DistanceBasedFareStrategy>();
        services.AddSingleton<FlatRateFareStrategy>();

        return services;
    }

    /// <summary>
    /// Configures JWT Bearer token authentication and authorization.
    /// </summary>
    public static IServiceCollection AddJwtAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        var jwtKey = configuration["Jwt:Key"] ?? "TicketingSystemSecretKeyForQrAndTokens2026!#PostgresJwtSecretLongKey";
        var jwtIssuer = configuration["Jwt:Issuer"] ?? "TicketingSystem";
        var jwtAudience = configuration["Jwt:Audience"] ?? "TicketingSystemUsers";

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.RequireHttpsMetadata = false;
            options.SaveToken = true;
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
                ValidateIssuer = true,
                ValidIssuer = jwtIssuer,
                ValidateAudience = true,
                ValidAudience = jwtAudience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromMinutes(1)
            };
        });

        services.AddAuthorization();

        return services;
    }

    /// <summary>
    /// Configures Cross-Origin Resource Sharing (CORS) policy for the frontend.
    /// </summary>
    public static IServiceCollection AddCorsPolicy(this IServiceCollection services)
    {
        services.AddCors(options =>
        {
            options.AddPolicy("AllowAll", policy =>
            {
                policy.AllowAnyOrigin()
                      .AllowAnyMethod()
                      .AllowAnyHeader();
            });
        });

        return services;
    }
}
