# Test Email Configuration Script
# This script verifies that email verification is properly configured

Write-Host "========================================" -ForegroundColor Green
Write-Host "Email Configuration Test" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Read the appsettings file directly
$appSettingsPath = "e:\sap\sap-basis-pulse_OLD_deleted-main\backend\appsettings.Development.json"
Write-Host "`nReading appsettings.Development.json..." -ForegroundColor Yellow

try {
    $appSettings = Get-Content $appSettingsPath | ConvertFrom-Json
    
    Write-Host "`nCurrent Configuration:" -ForegroundColor Cyan
    Write-Host "  EnableEmailVerification: $($appSettings.EmailSettings.EnableEmailVerification) (Type: $($appSettings.EmailSettings.EnableEmailVerification.GetType().Name))" -ForegroundColor Gray
    Write-Host "  RequireEmailVerification: $($appSettings.EmailSettings.RequireEmailVerification) (Type: $($appSettings.EmailSettings.RequireEmailVerification.GetType().Name))" -ForegroundColor Gray
    Write-Host "  EmailVerificationTokenExpiryHours: $($appSettings.EmailSettings.EmailVerificationTokenExpiryHours) (Type: $($appSettings.EmailSettings.EmailVerificationTokenExpiryHours.GetType().Name))" -ForegroundColor Gray
    
    Write-Host "`nSMTP Configuration:" -ForegroundColor Cyan
    Write-Host "  Host: $($appSettings.Smtp.Host)" -ForegroundColor Gray
    Write-Host "  Port: $($appSettings.Smtp.Port)" -ForegroundColor Gray
    Write-Host "  Username: $($appSettings.Smtp.Username)" -ForegroundColor Gray
    Write-Host "  From: $($appSettings.Smtp.From)" -ForegroundColor Gray
    Write-Host "  EnableSsl: $($appSettings.Smtp.EnableSsl)" -ForegroundColor Gray
    
    Write-Host "`nOld Auth Settings (should not interfere):" -ForegroundColor Cyan
    if ($appSettings.Auth.AutoActivateInDevelopment) {
        Write-Host "  ❌ AutoActivateInDevelopment: $($appSettings.Auth.AutoActivateInDevelopment) - THIS WILL OVERRIDE EMAIL VERIFICATION!" -ForegroundColor Red
    } else {
        Write-Host "  ✅ AutoActivateInDevelopment: Not set (Good!)" -ForegroundColor Green
    }
    
    if ($appSettings.Auth.BypassStatusCheckInDevelopment) {
        Write-Host "  ❌ BypassStatusCheckInDevelopment: $($appSettings.Auth.BypassStatusCheckInDevelopment) - THIS WILL OVERRIDE EMAIL VERIFICATION!" -ForegroundColor Red
    } else {
        Write-Host "  ✅ BypassStatusCheckInDevelopment: Not set (Good!)" -ForegroundColor Green
    }
    
} catch {
    Write-Host "Error reading configuration: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Configuration Analysis Complete" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green