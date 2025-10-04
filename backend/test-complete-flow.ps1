# Complete Email Verification Test
# This test verifies that email verification is working end-to-end

$apiUrl = "http://localhost:5274/api"

Write-Host "========================================" -ForegroundColor Green
Write-Host "Complete Email Verification Flow Test" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Step 1: Test registration with email verification enabled
Write-Host "`n1. Testing user registration with email verification ENABLED..." -ForegroundColor Yellow
$randomNum = Get-Random
$testEmail = "testuser$randomNum@example.com"
$registrationData = @{
    Email = $testEmail
    Password = "TestPassword123!"
    ConfirmPassword = "TestPassword123!"
    FirstName = "Test"
    LastName = "User$randomNum"
    Role = "Customer"
} | ConvertTo-Json -Depth 10

Write-Host "  Attempting to register user: $testEmail" -ForegroundColor Gray

try {
    $registrationResponse = Invoke-RestMethod -Uri "$apiUrl/auth/register" -Method POST -Body $registrationData -ContentType "application/json"
    
    Write-Host "  ✅ Registration API call successful" -ForegroundColor Green
    Write-Host "  Token received: $($registrationResponse.token -ne $null)" -ForegroundColor Gray
    Write-Host "  User role: $($registrationResponse.role)" -ForegroundColor Gray
    Write-Host "  First name: $($registrationResponse.firstName)" -ForegroundColor Gray
    
    # Step 2: Test login with unverified user (should fail)
    Write-Host "`n2. Testing login with unverified user (should fail)..." -ForegroundColor Yellow
    $loginData = @{
        Email = $testEmail
        Password = "TestPassword123!"
    } | ConvertTo-Json -Depth 10
    
    try {
        $loginResponse = Invoke-RestMethod -Uri "$apiUrl/auth/login" -Method POST -Body $loginData -ContentType "application/json"
        Write-Host "  ❌ ERROR: Login should have failed for unverified user!" -ForegroundColor Red
        Write-Host "  This indicates email verification is NOT working properly." -ForegroundColor Red
    } catch {
        $errorDetails = $_.Exception.Message
        if ($errorDetails -like "*verify your email*" -or $errorDetails -like "*PendingVerification*") {
            Write-Host "  ✅ Login correctly blocked for unverified user" -ForegroundColor Green
            Write-Host "  Response: $errorDetails" -ForegroundColor Gray
        } else {
            Write-Host "  ⚠️  Login failed but for unexpected reason: $errorDetails" -ForegroundColor Yellow
        }
    }
    
} catch {
    Write-Host "  ❌ Registration failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  This could indicate API server is not running or configuration issues." -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Test Results Summary:" -ForegroundColor Green
Write-Host "- If registration succeeds AND login fails with 'verify email' message:" -ForegroundColor Gray
Write-Host "  ✅ Email verification is working correctly" -ForegroundColor Green
Write-Host "- If registration succeeds AND login also succeeds:" -ForegroundColor Gray
Write-Host "  ❌ Email verification is NOT working (users auto-activated)" -ForegroundColor Red
Write-Host "- If registration fails:" -ForegroundColor Gray
Write-Host "  ❌ API server may not be running or has configuration issues" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Green

Write-Host "`nIMPORTANT: Check your email inbox for verification email!" -ForegroundColor Cyan
Write-Host "Email should be sent to: $testEmail" -ForegroundColor Cyan