# Database User Status Check
# This script checks the database to see user statuses

Write-Host "========================================" -ForegroundColor Green
Write-Host "Database User Status Check" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Write-Host "`nTo manually check database user statuses, run this SQL query:" -ForegroundColor Yellow
Write-Host @"
SELECT 
    "Email", 
    "FirstName", 
    "LastName", 
    "Status", 
    "EmailConfirmed", 
    "CreatedAt"
FROM "Users" 
WHERE "Email" LIKE '%testuser%@example.com'
ORDER BY "CreatedAt" DESC
LIMIT 10;
"@ -ForegroundColor Cyan

Write-Host "`nUser Status Values:" -ForegroundColor Yellow
Write-Host "  0 = Active (user can login)" -ForegroundColor Gray
Write-Host "  1 = PendingVerification (user must verify email to login)" -ForegroundColor Gray
Write-Host "  2 = Disabled" -ForegroundColor Gray

Write-Host "`nEmailConfirmed Values:" -ForegroundColor Yellow
Write-Host "  true = Email is confirmed" -ForegroundColor Gray
Write-Host "  false = Email needs to be confirmed" -ForegroundColor Gray

Write-Host "`nExpected behavior when email verification is enabled:" -ForegroundColor Cyan
Write-Host "  - New users should have Status = 1 (PendingVerification)" -ForegroundColor Green
Write-Host "  - New users should have EmailConfirmed = false" -ForegroundColor Green
Write-Host "  - Users should NOT be able to login until verified" -ForegroundColor Green

Write-Host "`nIf you see Status = 0 (Active) for new users:" -ForegroundColor Red
Write-Host "  - Email verification is not working properly" -ForegroundColor Red
Write-Host "  - Check the AuthService implementation" -ForegroundColor Red