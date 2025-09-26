// Add needed namespaces
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using Microsoft.AspNetCore.Identity;
using SapBasisPulse.Api.Data;
using SapBasisPulse.Api.Entities;
using SapBasisPulse.Api.Services;
using SapBasisPulse.Api.Services.Payments;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using SapBasisPulse.Api.Utilities;
using Microsoft.AspNetCore.HttpOverrides;
using System.Linq;

var builder = WebApplication.CreateBuilder(args);

// Configure for Railway production environment
if (builder.Environment.IsProduction())
{
    // Trust Railway proxy headers
    builder.Services.Configure<ForwardedHeadersOptions>(options =>
    {
        options.ForwardedHeaders = Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedFor 
                                 | Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedProto;
        options.KnownNetworks.Clear();
        options.KnownProxies.Clear();
    });
}

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
// Payments: HttpClient and payment service
builder.Services.AddHttpClient();
builder.Services.AddScoped<IPaymentService, RazorpayPaymentService>();
// CORS configuration for development and production
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowLocalDev", policy =>
    {
        policy.WithOrigins("http://localhost:8080", "http://localhost:8081", "http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
    
    options.AddPolicy("AllowProduction", policy =>
    {
        // Get allowed origins from environment variable (Vercel URL)
        var corsOrigins = builder.Configuration["CORS_ORIGINS"]?.Split(',') ?? new[] { "http://localhost:8080" };
        policy.WithOrigins(corsOrigins)
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
builder.Services.AddScoped<IMessagingService, MessagingService>();
builder.Services.AddScoped<IFileUploadService, FileUploadService>();
builder.Services.AddScoped<IServiceRequestValidationService, ServiceRequestValidationService>();
builder.Services.AddScoped<ISupabaseAuthService, SupabaseAuthService>();

// Add HttpClient for Supabase API calls (already added above)

// Add development helper service
builder.Services.AddScoped<DevHelperService>();

// Add DbContext, Identity, and custom services
builder.Services.AddDbContext<AppDbContext>(options =>
{
    // Use Railway's DATABASE_URL if available, otherwise fallback to DefaultConnection
    var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
    string connectionString;

    if (!string.IsNullOrWhiteSpace(databaseUrl))
    {
        // Some platforms or manual copy/paste may prepend labels like "DATABASE_URL:" or "DATABASE_URL="
        // Normalize by stripping everything before the first occurrence of "postgres" or "postgresql"
        var markerIndex = databaseUrl.IndexOf("postgresql://", StringComparison.OrdinalIgnoreCase);
        if (markerIndex < 0)
            markerIndex = databaseUrl.IndexOf("postgres://", StringComparison.OrdinalIgnoreCase);
        if (markerIndex > 0)
        {
            databaseUrl = databaseUrl.Substring(markerIndex);
        }

        // Handle both already-formatted Npgsql connection strings and URL style
        if (databaseUrl.Contains("Host=") && databaseUrl.Contains("Database="))
        {
            connectionString = databaseUrl; // Already in Npgsql format
        }
        else
        {
            try
            {
                var uri = new Uri(databaseUrl);
                var userInfo = uri.UserInfo.Split(':');
                var user = Uri.UnescapeDataString(userInfo[0]);
                var pass = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "";
                var host = uri.Host;
                var port = uri.Port > 0 ? uri.Port : 5432;
                var db = uri.AbsolutePath.TrimStart('/');
                var sslMode = Environment.GetEnvironmentVariable("DB_SSLMODE") ?? "Require";
                var trustServer = Environment.GetEnvironmentVariable("DB_TRUST_SERVER_CERTIFICATE") ?? "true";
                
                // Try to resolve IPv4 address for Supabase if possible
                var resolvedHost = host;
                try 
                {
                    Console.WriteLine($"[Startup] Attempting DNS resolution for host: {host}");
                    var addresses = System.Net.Dns.GetHostAddresses(host);
                    Console.WriteLine($"[Startup] Found {addresses.Length} addresses for {host}");
                    
                    foreach (var addr in addresses)
                    {
                        Console.WriteLine($"[Startup] Address: {addr} (Family: {addr.AddressFamily})");
                    }
                    
                    var ipv4Address = addresses.FirstOrDefault(addr => addr.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork);
                    if (ipv4Address != null)
                    {
                        resolvedHost = ipv4Address.ToString();
                        Console.WriteLine($"[Startup] Successfully resolved {host} to IPv4: {resolvedHost}");
                    }
                    else
                    {
                        Console.WriteLine($"[Startup] No IPv4 address found for {host}, using hostname (this may cause IPv6 connection issues)");
                    }
                }
                catch (Exception dnsEx)
                {
                    Console.WriteLine($"[Startup] DNS resolution failed for {host}: {dnsEx.Message}");
                    Console.WriteLine($"[Startup] Using original hostname: {host}");
                }
                
                connectionString = $"Host={resolvedHost};Port={port};Database={db};Username={user};Password={pass};Ssl Mode={sslMode};Trust Server Certificate={trustServer};Include Error Detail=true;Timeout=30;Command Timeout=30";
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Startup] Failed to parse DATABASE_URL. Raw value: '{databaseUrl}'. Error: {ex.Message}");
                connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
                    ?? "Host=localhost;Port=5432;Database=sap_basis_pulse;Username=postgres;Password=postgres";
            }
        }
    }
    else
    {
        connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
            ?? "Host=localhost;Port=5432;Database=sap_basis_pulse;Username=postgres;Password=postgres";
    }
    // Final logging with masking
    string safeLogConn = connectionString;
    try
    {
        var parts = connectionString.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        for (int i = 0; i < parts.Length; i++)
        {
            if (parts[i].StartsWith("Password=", StringComparison.OrdinalIgnoreCase))
            {
                parts[i] = "Password=****";
            }
        }
        safeLogConn = string.Join(';', parts);
    }
    catch { }
    Console.WriteLine($"[Startup] Using PostgreSQL connection: {safeLogConn}");
    
    options.UseNpgsql(connectionString);
});
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

// Configure forwarded headers for production (Railway proxy)
if (app.Environment.IsProduction())
{
    app.UseForwardedHeaders();
}

// Optionally apply EF Core migrations automatically (useful for Railway)
try
{
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        // Auto-migrate in production by default; can be disabled via env/config AutoMigrate=false
        var autoMigrate = app.Configuration.GetValue<bool>("AutoMigrate", app.Environment.IsProduction());
        if (autoMigrate)
        {
            db.Database.Migrate();
            Console.WriteLine("[Startup] Applied pending EF Core migrations");
        }
    }
}
catch (Exception ex)
{
    Console.WriteLine($"[Startup] Migration apply failed: {ex.Message}");
}

// TEMPORARY: Bypass custom error handling to show raw exceptions for debugging
// Comment out custom error handler to get exact stack traces
/*
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        context.Response.ContentType = "application/json";
        var feature = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>();
        var ex = feature?.Error;
        
        object result;
        
        // In development or when debugging, provide detailed error information
        if (app.Environment.IsDevelopment() || app.Configuration.GetValue<bool>("EnableDetailedErrors", false))
        {
            result = new 
            { 
                error = "Unhandled Exception Occurred",
                message = ex?.Message,
                stackTrace = ex?.StackTrace,
                innerException = ex?.InnerException?.Message,
                type = ex?.GetType().Name,
                timestamp = DateTime.UtcNow,
                source = ex?.Source
            };
        }
        else
        {
            result = new { error = "An unexpected error occurred. Please try again later." };
        }
        
        var jsonResult = JsonSerializer.Serialize(result);
        context.Response.StatusCode = 500;
        await context.Response.WriteAsync(jsonResult);
    });
});
*/

// TEMPORARY: Enable developer exception page in production for debugging
app.UseDeveloperExceptionPage();

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

// Disable HTTPS redirection in production (Railway handles TLS termination)
if (!app.Environment.IsProduction())
{
    app.UseHttpsRedirection();
}

// Enable CORS based on environment
var corsPolicy = app.Environment.IsDevelopment() ? "AllowLocalDev" : "AllowProduction";
app.UseCors(corsPolicy);

// Add simple health check endpoint for Railway
app.MapGet("/health", () => Results.Ok(new { 
    status = "healthy", 
    timestamp = DateTime.UtcNow,
    version = "1.0.0",
    environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development"
}));

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
        await devHelper.EnsureAdminUserExistsAsync();

        // Seed the database with support taxonomy data
        try
        {
            await SapBasisPulse.Api.Utilities.SeedData.Initialize(scope.ServiceProvider);
            
            // Update RequiresSrIdentifier flags
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await SapBasisPulse.Api.Utilities.UpdateSrIdentifierFlag.UpdateRequiresSrIdentifierFlagsAsync(dbContext);
            
            // Add or update Service Request Identifiers
            SapBasisPulse.Api.Utilities.ServiceRequestIdentifierManager.AddOrUpdateServiceRequestIdentifiers(scope.ServiceProvider);
            
            // Initialize default SSO configuration
            await InitializeDefaultSSOConfigurationAsync(scope.ServiceProvider);
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

static async Task InitializeDefaultSSOConfigurationAsync(IServiceProvider serviceProvider)
{
    using var scope = serviceProvider.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    
    try
    {
        var existingConfig = await context.SSOConfigurations.FirstOrDefaultAsync();
        if (existingConfig == null)
        {
            var defaultConfig = new SSOConfiguration
            {
                SupabaseEnabled = true,
                GoogleEnabled = true,
                AppleEnabled = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            
            context.SSOConfigurations.Add(defaultConfig);
            await context.SaveChangesAsync();
            logger.LogInformation("Default SSO configuration created with all providers enabled.");
        }
        else
        {
            logger.LogInformation("SSO configuration already exists. Current state: Supabase={SupabaseEnabled}, Google={GoogleEnabled}, Apple={AppleEnabled}", 
                existingConfig.SupabaseEnabled, existingConfig.GoogleEnabled, existingConfig.AppleEnabled);
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Failed to initialize default SSO configuration.");
    }
}

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
