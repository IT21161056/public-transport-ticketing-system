using Ticketing_System_Backend.Extensions;

var builder = WebApplication.CreateBuilder(args);

// 1. Controller & OpenAPI Endpoints
builder.Services.AddControllers();
builder.Services.AddOpenApi();

// 2. Modular Service Registrations (Decoupled by Concern)
builder.Services.AddDatabase(builder.Configuration);
builder.Services.AddRepositories();
builder.Services.AddApplicationServices();
builder.Services.AddJwtAuthentication(builder.Configuration);
builder.Services.AddCorsPolicy();

var app = builder.Build();

// 3. HTTP Request Middleware Pipeline
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowAll");
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();

