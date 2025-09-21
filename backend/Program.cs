// Add needed namespaces
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using Microsoft.AspNetCore.Identity;
using SapBasisPulse.Api.Data;
using SapBasisPulse.Api.Entities;
using SapBasisPulse.Api.Services;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using SapBasisPulse.Api.Utilities;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
// CORS for local development
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowLocalDev", policy =>
    {
        policy.WithOrigins("http://localhost:8080", "http://localhost:8081", "http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});
builder.Services.AddScoped<IAuditLogService, AuditLogService>();
builder.Services.AddScoped<ISupportRequestService, SupportRequestService>();
builder.Services.AddScoped<IEmailSender, SmtpEmailSender>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ITicketRatingService, TicketRatingService>();
builder.Services.AddScoped<ISupportTaxonomyService, SupportTaxonomyService>();
builder.Services.AddScoped<IConsultantAvailabilityService, ConsultantAvailabilityService>();

// Add development helper service
builder.Services.AddScoped<DevHelperService>();

// Add DbContext, Identity, and custom services
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddIdentity<User, IdentityRole<Guid>>()
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

// Configure JWT Authentication
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    var jwtSettings = builder.Configuration.GetSection("JwtSettings");
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Secret"]))
    };
    // Allow redirects from API to be intercepted and handled by the frontend
    options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
    {
        OnChallenge = context =>
        {
            // Prevent default behavior (redirect) for API endpoints
            context.HandleResponse();
            context.Response.StatusCode = 401;
            context.Response.ContentType = "application/json";
            return context.Response.WriteAsync(JsonSerializer.Serialize(new { error = "Unauthorized" }));
        }
    };
});

// Register UserService
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();

var app = builder.Build();

// Global exception handler that returns JSON instead of stack traces
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        context.Response.ContentType = "application/json";
        var feature = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>();
        var ex = feature?.Error;
        var result = JsonSerializer.Serialize(new { error = "An unexpected error occurred. Please try again later." });
        context.Response.StatusCode = 500;
        await context.Response.WriteAsync(result);
    });
});

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Configure HTTPS redirection based on environment
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
else
{
    // In development, we'll skip HTTPS redirection to avoid the warning
    // Comment this out if you want to enforce HTTPS in development as well
}

// Authentication & Authorization middleware
app.UseAuthentication();
app.UseAuthorization();

// Enable CORS
app.UseCors("AllowLocalDev");

// Map attribute-routed controllers
app.MapControllers();

// In development, activate all users if configured
if (app.Environment.IsDevelopment())
{
    // Run this in a separate non-blocking task to avoid slowing down startup
    Task.Run(async () =>
    {
        using var scope = app.Services.CreateScope();
        var devHelper = scope.ServiceProvider.GetRequiredService<DevHelperService>();
        await devHelper.EnsureAllUsersActiveInDevelopmentAsync();

        // Seed the database with support taxonomy data
        try
        {
            await SapBasisPulse.Api.Utilities.SeedData.Initialize(scope.ServiceProvider);
            
            // Update RequiresSrIdentifier flags
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await SapBasisPulse.Api.Utilities.UpdateSrIdentifierFlag.UpdateRequiresSrIdentifierFlagsAsync(dbContext);
            
            // Add or update Service Request Identifiers
            SapBasisPulse.Api.Utilities.ServiceRequestIdentifierManager.AddOrUpdateServiceRequestIdentifiers(scope.ServiceProvider);
        }
        catch (Exception ex)
        {
            var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
            logger.LogError(ex, "An error occurred while seeding the database.");
        }
    });
}

var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/weatherforecast", () =>
{
    var forecast =  Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast
        (
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();
    return forecast;
})
.WithName("GetWeatherForecast")
.WithOpenApi();

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
