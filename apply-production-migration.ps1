#!/usr/bin/env pwsh

# Apply latest migrations to production database
# This script updates the Railway production database with all pending migrations
# Including: SystemSettings, AddHoursWorkedAndCalculatedAmount, and other pending migrations

Write-Host "Applying all pending migrations to production database..." -ForegroundColor Green

# Change to backend directory
Set-Location "backend"

# Check if dotnet-ef is installed
try {
    dotnet ef --version
    Write-Host "Entity Framework Core tools found" -ForegroundColor Green
} catch {
    Write-Host "Entity Framework Core tools not found. Installing..." -ForegroundColor Red
    dotnet tool install --global dotnet-ef
}

# Get the Railway database connection string from environment or prompt
$connectionString = $env:DATABASE_URL
if (-not $connectionString) {
    Write-Host "DATABASE_URL environment variable not found." -ForegroundColor Yellow
    Write-Host "Please provide the Railway PostgreSQL connection string:"
    Write-Host "Format: postgresql://username:password@host:port/database" -ForegroundColor Cyan
    $connectionString = Read-Host "Connection String"
}

if (-not $connectionString) {
    Write-Host "No connection string provided. Exiting." -ForegroundColor Red
    exit 1
}

# Apply migrations to production database
Write-Host "Applying pending migrations..." -ForegroundColor Blue
try {
    dotnet ef database update --connection-string $connectionString --verbose
    Write-Host "Database migration completed successfully!" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "Database migrations applied successfully!" -ForegroundColor Green
    Write-Host "✓ SystemSettings table has been created/updated" -ForegroundColor Cyan
    Write-Host "✓ Orders table updated with HoursWorked, HourlyRate, and CalculatedAmount columns" -ForegroundColor Cyan
    Write-Host "✓ All other pending migrations have been applied" -ForegroundColor Cyan
    
} catch {
    Write-Host "Migration failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting tips:" -ForegroundColor Yellow
    Write-Host "1. Verify the connection string is correct" -ForegroundColor White
    Write-Host "2. Ensure the database is accessible" -ForegroundColor White
    Write-Host "3. Check if you have sufficient permissions" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Magenta
Write-Host "1. Test the SystemSettings API endpoints" -ForegroundColor White
Write-Host "2. Verify the consultant registration toggle in the admin dashboard" -ForegroundColor White
Write-Host "3. Test the new Work Summary functionality with hours tracking" -ForegroundColor White
Write-Host "4. Verify payment calculations are working correctly" -ForegroundColor White
Write-Host "5. Check that existing data is preserved and new columns are available" -ForegroundColor White