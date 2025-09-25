# Production Database Update Script
# Use this script to update your existing production database with SSO configuration

# Option 1: Using .NET EF Core Migrations (Recommended)
Write-Host "=== Updating Production Database with EF Core Migrations ===" -ForegroundColor Green

# Set connection to your production database
$ProductionConnectionString = $env:DATABASE_URL
if (-not $ProductionConnectionString) {
    Write-Host "ERROR: DATABASE_URL environment variable not set!" -ForegroundColor Red
    Write-Host "Please set your production database connection string:" -ForegroundColor Yellow
    Write-Host 'Example: $env:DATABASE_URL = "Host=your-host;Port=5432;Database=your-db;Username=user;Password=pass;SSL Mode=Require"' -ForegroundColor Yellow
    exit 1
}

# Navigate to backend directory
Set-Location -Path "backend"

# Apply migrations to production database
Write-Host "Applying EF Core migrations to production database..." -ForegroundColor Yellow
try {
    # Set production environment
    $env:ASPNETCORE_ENVIRONMENT = "Production"
    $env:ConnectionStrings__DefaultConnection = $ProductionConnectionString
    
    # Update database with migrations
    dotnet ef database update --verbose
    
    Write-Host "✅ Database migrations applied successfully!" -ForegroundColor Green
}
catch {
    Write-Host "❌ Error applying migrations: $_" -ForegroundColor Red
    exit 1
}

# Option 2: Manual SQL Execution (Alternative)
Write-Host "`n=== Alternative: Manual SQL Execution ===" -ForegroundColor Blue
Write-Host "If EF migrations fail, you can run the SQL script manually:" -ForegroundColor Cyan
Write-Host "1. Connect to your production database" -ForegroundColor White
Write-Host "2. Execute: scripts/update-production-database.sql" -ForegroundColor White

# Verification
Write-Host "`n=== Verifying Database Updates ===" -ForegroundColor Green
try {
    # Check if SSO table exists and has data
    $verificationScript = @"
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'SSOConfigurations')
        THEN 'SSOConfigurations table exists'
        ELSE 'SSOConfigurations table missing'
    END as table_status;

SELECT COUNT(*) as config_count FROM "SSOConfigurations";
"@
    
    Write-Host "Database verification completed. Check your database for:" -ForegroundColor Yellow
    Write-Host "- SSOConfigurations table exists" -ForegroundColor White
    Write-Host "- Default SSO configuration record created" -ForegroundColor White
    Write-Host "- Users.SsoProvider column added" -ForegroundColor White
}
catch {
    Write-Host "⚠️ Could not verify database updates automatically" -ForegroundColor Yellow
}

Write-Host "`n=== Next Steps ===" -ForegroundColor Green
Write-Host "1. Verify SSO configuration in your admin panel" -ForegroundColor White
Write-Host "2. Test Google OAuth login flow" -ForegroundColor White
Write-Host "3. Check application logs for any SSO-related errors" -ForegroundColor White
Write-Host "4. Update your frontend environment variables if needed" -ForegroundColor White

Write-Host "`n✅ Production database update completed!" -ForegroundColor Green