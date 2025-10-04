# Test email verification during login
$headers = @{
    'Content-Type' = 'application/json'
}

# First, create a user that will require email verification
$registerBody = @{
    email = "testverify@example.com"
    password = "Password123!"
    firstName = "Test"
    lastName = "Verify"
    confirmPassword = "Password123!"
    role = "Customer"
} | ConvertTo-Json

Write-Host "=== Creating test user that requires email verification ==="
Write-Host "POST http://localhost:5274/api/auth/register"

try {
    $registerResponse = Invoke-WebRequest -Uri "http://localhost:5274/api/auth/register" -Method POST -Headers $headers -Body $registerBody -UseBasicParsing
    Write-Host "Registration Status Code: $($registerResponse.StatusCode)"
    if ($registerResponse.StatusCode -eq 204) {
        Write-Host "✓ User created successfully, email verification required"
    }
} catch {
    Write-Host "Registration Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $responseBody = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($responseBody)
        $responseText = $reader.ReadToEnd()
        Write-Host "Error Response: $responseText"
    }
}

Write-Host ""
Write-Host "=== Now trying to login with unverified email ==="

# Now try to login with the unverified user
$loginBody = @{
    email = "testverify@example.com"
    password = "Password123!"
} | ConvertTo-Json

Write-Host "POST http://localhost:5274/api/auth/login"

try {
    $loginResponse = Invoke-WebRequest -Uri "http://localhost:5274/api/auth/login" -Method POST -Headers $headers -Body $loginBody -UseBasicParsing
    Write-Host "Login Status Code: $($loginResponse.StatusCode)"
    Write-Host "Login Response: $($loginResponse.Content)"
} catch {
    Write-Host "Login Status Code: $($_.Exception.Response.StatusCode)"
    if ($_.Exception.Response) {
        $responseBody = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($responseBody)
        $responseText = $reader.ReadToEnd()
        Write-Host "Login Error Response: $responseText"
    }
}