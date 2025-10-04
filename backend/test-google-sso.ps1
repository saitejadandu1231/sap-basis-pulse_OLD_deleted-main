# Test Google SSO Endpoint
# This tests the Google SSO endpoint directly

$apiUrl = "http://localhost:5274/api"

Write-Host "========================================" -ForegroundColor Green
Write-Host "Testing Google SSO Email Verification" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Write-Host "`nNOTE: This test requires a valid Google ID token." -ForegroundColor Yellow
Write-Host "To get a real token, you need to authenticate with Google first." -ForegroundColor Yellow
Write-Host "`nWhat you should do instead:" -ForegroundColor Cyan
Write-Host "1. Use your frontend UI to sign up with Google SSO" -ForegroundColor Gray
Write-Host "2. Watch the API server terminal for debug messages:" -ForegroundColor Gray
Write-Host "   - [DEBUG] EmailSettings EnableEmailVerification parsed to: True" -ForegroundColor Gray
Write-Host "   - [DEBUG] Google SSO User Creation - EmailVerificationEnabled: True" -ForegroundColor Gray
Write-Host "   - [DEBUG] Sending verification email to: your-email@gmail.com" -ForegroundColor Gray
Write-Host "`n3. Check if login is blocked after signup" -ForegroundColor Gray
Write-Host "4. Check your email for verification message" -ForegroundColor Gray

Write-Host "`nIf you DON'T see debug messages in the API terminal:" -ForegroundColor Red
Write-Host "- The frontend might be using a different authentication endpoint" -ForegroundColor Red
Write-Host "- Or there might be caching issues with the old code" -ForegroundColor Red

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Try Google SSO signup now and watch the API terminal!" -ForegroundColor Green
Write-Host "API Server: http://localhost:5274" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Green