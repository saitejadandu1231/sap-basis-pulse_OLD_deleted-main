# Railway Specific Database Update Script
# Use this for Railway PostgreSQL deployments

Write-Host "=== Railway Production Database Update ===" -ForegroundColor Green

# Install Railway CLI if not present
if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Railway CLI..." -ForegroundColor Yellow
    npm install -g @railway/cli
}

# Login to Railway (if not already logged in)
Write-Host "Logging into Railway..." -ForegroundColor Yellow
railway login

# Link to your project (if not already linked)
Write-Host "Linking to Railway project..." -ForegroundColor Yellow
Write-Host "If prompted, select your SAP Basis Pulse project" -ForegroundColor Cyan
railway link

# Get database connection string from Railway
Write-Host "Getting production database URL from Railway..." -ForegroundColor Yellow
try {
    $DatabaseUrl = railway variables get DATABASE_URL
    if (-not $DatabaseUrl) {
        Write-Host "❌ Could not get DATABASE_URL from Railway" -ForegroundColor Red
        Write-Host "Please ensure you have a PostgreSQL service attached to your Railway project" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "✅ Database URL retrieved from Railway" -ForegroundColor Green
}
catch {
    Write-Host "❌ Error connecting to Railway: $_" -ForegroundColor Red
    exit 1
}

# Set environment variables
$env:DATABASE_URL = $DatabaseUrl
$env:ASPNETCORE_ENVIRONMENT = "Production"
$env:ConnectionStrings__DefaultConnection = $DatabaseUrl

# Navigate to backend and apply migrations
Set-Location -Path "backend"

Write-Host "Applying EF Core migrations to Railway PostgreSQL..." -ForegroundColor Yellow
try {
    dotnet ef database update --verbose
    Write-Host "✅ Railway database updated successfully!" -ForegroundColor Green
}
catch {
    Write-Host "❌ Error updating Railway database: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "=== Alternative: Railway Console Method ===" -ForegroundColor Blue
    Write-Host "1. Run: railway run dotnet ef database update" -ForegroundColor White
    Write-Host "2. Or connect directly: railway connect" -ForegroundColor White
    exit 1
}

# Verify using Railway
Write-Host "`n=== Verifying SSO Configuration ===" -ForegroundColor Green
Write-Host "Checking SSO configuration in Railway database..." -ForegroundColor Yellow

# You can also connect directly to run SQL queries
Write-Host "To verify manually, run: railway connect" -ForegroundColor Cyan
Write-Host "Then execute: SELECT * FROM \"SSOConfigurations\";" -ForegroundColor Cyan

Write-Host "`n=== Railway Deployment Update ===" -ForegroundColor Green
Write-Host "Redeploying your Railway service to pick up changes..." -ForegroundColor Yellow

try {
    railway redeploy
    Write-Host "✅ Railway service redeployed!" -ForegroundColor Green
}
catch {
    Write-Host "⚠️ Could not redeploy automatically. Please redeploy manually in Railway dashboard." -ForegroundColor Yellow
}

Write-Host "`n=== Next Steps ===" -ForegroundColor Green
Write-Host "1. Check Railway logs: railway logs" -ForegroundColor White
Write-Host "2. Verify your application is running: railway status" -ForegroundColor White
Write-Host "3. Test SSO login on your live application" -ForegroundColor White
Write-Host "4. Configure SSO settings in admin panel" -ForegroundColor White

Write-Host "`n🚀 Railway database update completed!" -ForegroundColor Green