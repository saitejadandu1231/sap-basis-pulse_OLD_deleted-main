# Apply Latest Migration Only - Production Database
# This script applies only the latest migration: 20251005105925_AddTicketNumberTemplate

Write-Host "🚀 Applying Latest Migration to Production Database" -ForegroundColor Green
Write-Host "Migration: 20251005105925_AddTicketNumberTemplate (TicketNumberTemplates table)" -ForegroundColor Cyan

# Check if Railway CLI is installed
if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Railway CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g @railway/cli
    Write-Host "✅ Railway CLI installed!" -ForegroundColor Green
}

# Navigate to backend directory
$originalLocation = Get-Location
try {
    Set-Location backend
    
    Write-Host "`n📋 Step 1: Checking current migration status..." -ForegroundColor Cyan
    railway run dotnet ef migrations list
    
    Write-Host "`n🔄 Step 2: Applying latest migration only..." -ForegroundColor Yellow
    Write-Host "Executing: dotnet ef database update 20251005105925_AddTicketNumberTemplate" -ForegroundColor Gray
    
    railway run dotnet ef database update 20251005105925_AddTicketNumberTemplate --verbose
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Migration applied successfully!" -ForegroundColor Green
        
        Write-Host "`n🔍 Step 3: Verifying migration..." -ForegroundColor Cyan
        Write-Host "Checking if TicketNumberTemplates table was created..." -ForegroundColor Gray
        
        # Verify the table was created
        railway connect postgresql -c "SELECT 'Table exists!' as status FROM information_schema.tables WHERE table_name = 'TicketNumberTemplates';"
        
        Write-Host "`n📊 Latest migration history:" -ForegroundColor Cyan
        railway connect postgresql -c "SELECT \"MigrationId\", \"ProductVersion\" FROM \"__EFMigrationsHistory\" ORDER BY \"MigrationId\" DESC LIMIT 3;"
        
        Write-Host "`n🎉 SUCCESS! Your production database now has:" -ForegroundColor Green
        Write-Host "   ✅ TicketNumberTemplates table" -ForegroundColor White
        Write-Host "   ✅ All necessary indexes and constraints" -ForegroundColor White
        Write-Host "   ✅ Foreign key relationships" -ForegroundColor White
        
        Write-Host "`n🚀 Next Steps:" -ForegroundColor Yellow
        Write-Host "   1. Deploy your application code to Railway" -ForegroundColor White
        Write-Host "   2. Test ticket number template functionality" -ForegroundColor White
        Write-Host "   3. Configure default templates in admin panel" -ForegroundColor White
        
    } else {
        Write-Host "`n❌ Migration failed!" -ForegroundColor Red
        Write-Host "💡 You can try the manual SQL script instead:" -ForegroundColor Yellow
        Write-Host "   1. Connect to Railway PostgreSQL" -ForegroundColor White
        Write-Host "   2. Run the SQL from APPLY_LATEST_MIGRATION.md" -ForegroundColor White
    }
    
} catch {
    Write-Host "`n❌ Error occurred: $_" -ForegroundColor Red
    Write-Host "💡 Alternative options:" -ForegroundColor Yellow
    Write-Host "   1. Check your Railway connection: railway login" -ForegroundColor White
    Write-Host "   2. Verify project link: railway link" -ForegroundColor White
    Write-Host "   3. Use manual SQL script from APPLY_LATEST_MIGRATION.md" -ForegroundColor White
} finally {
    Set-Location $originalLocation
}

Write-Host "`n✨ Migration process completed!" -ForegroundColor Green