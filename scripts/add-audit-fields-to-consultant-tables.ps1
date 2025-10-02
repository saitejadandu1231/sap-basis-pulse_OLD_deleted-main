# Production Database Update Script for Consultant Tables Audit Fields
# Use this script to add audit fields to ConsultantSkill and ConsultantAvailabilitySlots tables

param(
    [string]$DatabaseUrl = $env:DATABASE_URL
)

Write-Host "=== Adding Audit Fields to Consultant Tables ===" -ForegroundColor Green

# Check if DATABASE_URL is provided
if (-not $DatabaseUrl) {
    Write-Host "ERROR: DATABASE_URL environment variable not set!" -ForegroundColor Red
    Write-Host "Please provide the database URL or set the DATABASE_URL environment variable." -ForegroundColor Yellow
    Write-Host "Example: .\add-audit-fields-to-consultant-tables.ps1 -DatabaseUrl 'postgresql://user:pass@host:5432/db'" -ForegroundColor Yellow
    exit 1
}

# Option 1: Using psql command line (if available)
Write-Host "Option 1: Using psql command line tool..." -ForegroundColor Yellow
try {
    # Convert connection string to psql format if needed
    if ($DatabaseUrl -match "^postgresql://") {
        # Already in URL format, psql can handle it
        $psqlConn = $DatabaseUrl
    } else {
        # Assume it's a connection string
        Write-Host "Note: Using connection string format. Make sure psql can connect." -ForegroundColor Cyan
        $psqlConn = $DatabaseUrl
    }

    # Execute the SQL script
    Write-Host "Executing audit fields migration script..." -ForegroundColor Yellow
    psql $psqlConn -f "scripts/add-audit-fields-to-consultant-tables.sql"

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Audit fields added successfully using psql!" -ForegroundColor Green
    } else {
        throw "psql command failed with exit code $LASTEXITCODE"
    }
}
catch {
    Write-Host "❌ psql command failed: $_" -ForegroundColor Red
    Write-Host "Falling back to manual execution instructions..." -ForegroundColor Yellow
}

# Option 2: Manual SQL Execution Instructions
Write-Host "`n=== Manual SQL Execution Instructions ===" -ForegroundColor Blue
Write-Host "If the automated script fails, execute the SQL script manually:" -ForegroundColor Cyan
Write-Host "1. Connect to your production PostgreSQL database" -ForegroundColor White
Write-Host "2. Run the following command:" -ForegroundColor White
Write-Host "   psql '$DatabaseUrl' -f scripts/add-audit-fields-to-consultant-tables.sql" -ForegroundColor White
Write-Host "3. Or copy and paste the contents of scripts/add-audit-fields-to-consultant-tables.sql" -ForegroundColor White

# Verification
Write-Host "`n=== Verification ===" -ForegroundColor Green
Write-Host "After running the script, verify the changes:" -ForegroundColor Cyan
Write-Host "1. Check that new columns exist in ConsultantSkill table:" -ForegroundColor White
Write-Host "   - CreatedBy (text, nullable)" -ForegroundColor Gray
Write-Host "   - IsDeleted (boolean, not null, default false)" -ForegroundColor Gray
Write-Host "   - UpdatedAt (timestamp with time zone, nullable)" -ForegroundColor Gray
Write-Host "   - UpdatedBy (text, nullable)" -ForegroundColor Gray

Write-Host "2. Check that new columns exist in ConsultantAvailabilitySlots table:" -ForegroundColor White
Write-Host "   - CreatedAt (timestamp with time zone, not null)" -ForegroundColor Gray
Write-Host "   - CreatedBy (text, nullable)" -ForegroundColor Gray
Write-Host "   - IsDeleted (boolean, not null, default false)" -ForegroundColor Gray
Write-Host "   - UpdatedAt (timestamp with time zone, nullable)" -ForegroundColor Gray
Write-Host "   - UpdatedBy (text, nullable)" -ForegroundColor Gray

Write-Host "`n✅ Audit fields migration completed!" -ForegroundColor Green