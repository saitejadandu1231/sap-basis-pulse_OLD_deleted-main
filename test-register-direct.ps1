# Test registration endpoint directly
$headers = @{
    'Content-Type' = 'application/json'
}

$body = @{
    email = "test@example.com"
    password = "Password123!"
    firstName = "Test"
    lastName = "User"
    confirmPassword = "Password123!"
    role = "Customer"
} | ConvertTo-Json

Write-Host "Testing registration endpoint..."
Write-Host "URL: http://localhost:5274/api/auth/register"
Write-Host "Body: $body"

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5274/api/auth/register" -Method POST -Headers $headers -Body $body -UseBasicParsing
    Write-Host "Status Code: $($response.StatusCode)"
    Write-Host "Content Type: $($response.Headers['Content-Type'])"
    Write-Host "Response Body: $($response.Content)"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode)"
        $responseBody = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($responseBody)
        $responseText = $reader.ReadToEnd()
        Write-Host "Error Response Body: $responseText"
    }
}