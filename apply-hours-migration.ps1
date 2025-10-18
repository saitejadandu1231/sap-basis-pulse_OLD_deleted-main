#!/usr/bin/env pwsh

# Production Migration Script - Apply AddHoursWorkedAndCalculatedAmount Migration
# This script applies the latest migration that adds HoursWorked, HourlyRate, and CalculatedAmount to Orders table

param(
    [string]$ConnectionString = $env:DATABASE_URL,
    [switch]$Verify = $false
)

Write-Host "🚀 Production Migration: AddHoursWorkedAndCalculatedAmount" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

if (-not $ConnectionString) {
    Write-Host "❌ ERROR: No database connection string provided!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please provide connection string using one of these methods:" -ForegroundColor Yellow
    Write-Host "1. Set DATABASE_URL environment variable" -ForegroundColor White
    Write-Host "2. Pass as parameter: -ConnectionString 'your_connection_string'" -ForegroundColor White
    Write-Host ""
    Write-Host "Railway PostgreSQL format:" -ForegroundColor Cyan
    Write-Host "postgresql://username:password@hostname:port/database" -ForegroundColor Gray
    exit 1
}

# Change to backend directory
$backendPath = Join-Path $PSScriptRoot "backend"
if (-not (Test-Path $backendPath)) {
    Write-Host "❌ ERROR: Backend directory not found at: $backendPath" -ForegroundColor Red
    exit 1
}

Set-Location $backendPath

# Verify EF Core tools are available
Write-Host "🔧 Checking Entity Framework Core tools..." -ForegroundColor Blue
try {
    $efVersion = dotnet ef --version 2>&1
    Write-Host "✅ EF Core tools found: $($efVersion -split "`n" | Select-Object -First 1)" -ForegroundColor Green
} catch {
    Write-Host "❌ EF Core tools not found. Installing..." -ForegroundColor Red
    dotnet tool install --global dotnet-ef
    Write-Host "✅ EF Core tools installed" -ForegroundColor Green
}

if ($Verify) {
    # Verification mode - just check what migrations are pending
    Write-Host ""
    Write-Host "🔍 Checking pending migrations..." -ForegroundColor Blue
    
    try {
        # List pending migrations
        $pendingMigrations = dotnet ef migrations list --connection $ConnectionString 2>&1
        Write-Host "Pending migrations:" -ForegroundColor Yellow
        Write-Host $pendingMigrations -ForegroundColor White
        
        # Check if AddHoursWorkedAndCalculatedAmount is in the list
        if ($pendingMigrations -match "AddHoursWorkedAndCalculatedAmount") {
            Write-Host "✅ AddHoursWorkedAndCalculatedAmount migration is pending and will be applied" -ForegroundColor Green
        } else {
            Write-Host "ℹ️  AddHoursWorkedAndCalculatedAmount migration may already be applied" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ Error checking migrations: $_" -ForegroundColor Red
    }
} else {
    # Apply migrations
    Write-Host ""
    Write-Host "📊 Applying migrations to production database..." -ForegroundColor Blue
    Write-Host "This will add the following columns to the Orders table:" -ForegroundColor Yellow
    Write-Host "  • HoursWorked (decimal)" -ForegroundColor White
    Write-Host "  • HourlyRate (decimal)" -ForegroundColor White
    Write-Host "  • CalculatedAmount (decimal)" -ForegroundColor White
    Write-Host ""
    
    try {
        # Apply all pending migrations
        dotnet ef database update --connection-string $ConnectionString --verbose
        
        Write-Host ""
        Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 Summary of changes applied:" -ForegroundColor Cyan
        Write-Host "  ✓ Orders table updated with work hours tracking columns" -ForegroundColor White
        Write-Host "  ✓ New columns allow for accurate time and cost tracking" -ForegroundColor White
        Write-Host "  ✓ Supports the enhanced Work Summary feature" -ForegroundColor White
        Write-Host ""
        Write-Host "🔍 Next steps:" -ForegroundColor Magenta
        Write-Host "  1. Test the Work Summary functionality in tickets" -ForegroundColor White
        Write-Host "  2. Verify payment calculations are working correctly" -ForegroundColor White
        Write-Host "  3. Check that consultant hourly rates can be set" -ForegroundColor White
        Write-Host "  4. Ensure existing ticket data is preserved" -ForegroundColor White
        
    } catch {
        Write-Host ""
        Write-Host "❌ Migration failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
        Write-Host "🔧 Troubleshooting tips:" -ForegroundColor Yellow
        Write-Host "  1. Verify the connection string is correct" -ForegroundColor White
        Write-Host "  2. Ensure the database is accessible from your location" -ForegroundColor White
        Write-Host "  3. Check if you have sufficient database permissions" -ForegroundColor White
        Write-Host "  4. Try running with --verify flag first to check pending migrations" -ForegroundColor White
        Write-Host ""
        Write-Host "🚨 If the error persists, you can run the SQL script manually:" -ForegroundColor Red
        Write-Host "   scripts/update-production-database.sql" -ForegroundColor White
        exit 1
    }
}

Write-Host ""
Write-Host "=================================================" -ForegroundColor Green
Write-Host "🎉 Production migration process completed!" -ForegroundColor Green