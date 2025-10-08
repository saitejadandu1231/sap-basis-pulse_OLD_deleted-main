#!/usr/bin/env pwsh

# Manual Database Migration Script
# This script applies the SystemSettings migration with a provided connection string

param(
    [Parameter(Mandatory=$true)]
    [string]$ConnectionString
)

Write-Host "Applying SystemSettings migration to production database..." -ForegroundColor Green
Write-Host "Connection: $($ConnectionString.Substring(0, 20))..." -ForegroundColor Gray

# Change to backend directory
Set-Location "backend"

# Check if dotnet-ef is installed
try {
    dotnet ef --version | Out-Null
    Write-Host "Entity Framework Core tools found" -ForegroundColor Green
} catch {
    Write-Host "Installing Entity Framework Core tools..." -ForegroundColor Yellow
    dotnet tool install --global dotnet-ef
}

# Apply migrations to production database
Write-Host "Applying pending migrations..." -ForegroundColor Blue
try {
    dotnet ef database update --connection-string $ConnectionString --verbose
    Write-Host "Database migration completed successfully!" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "SystemSettings table has been created in production database" -ForegroundColor Green
    Write-Host "The ConsultantRegistrationEnabled setting has been initialized with value 'true'" -ForegroundColor Cyan
    
} catch {
    Write-Host "Migration failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "You can try the manual SQL script instead:" -ForegroundColor Yellow
    Write-Host "1. Go to Railway dashboard" -ForegroundColor White
    Write-Host "2. Open your PostgreSQL database" -ForegroundColor White
    Write-Host "3. Run the SQL from manual-create-systemsettings.sql" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Magenta
Write-Host "1. The SystemSettings API endpoints should now work" -ForegroundColor White
Write-Host "2. Test the consultant registration toggle in the admin dashboard" -ForegroundColor White
Write-Host "3. Verify the settings are persisted correctly" -ForegroundColor White

# Return to root directory
Set-Location ".."