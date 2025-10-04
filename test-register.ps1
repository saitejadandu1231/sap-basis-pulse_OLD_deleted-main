# Test regular registration endpoint
$payload = @{
    email = "test@example.com"
    password = "testpassword123"
    firstName = "Test"
    lastName = "User"
    role = "Customer"
} | ConvertTo-Json

Write-Host "Testing registration endpoint..."
Write-Host "Payload: $payload"

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5274/api/auth/register" -Method POST -Body $payload -ContentType "application/json" -ErrorAction Stop
    Write-Host "Success Response:"
    Write-Host ($response | ConvertTo-Json -Depth 10)
} catch {
    Write-Host "Error Response:"
    Write-Host "Status Code: $($_.Exception.Response.StatusCode)"
    Write-Host "Status Description: $($_.Exception.Response.StatusDescription)"
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody"
    }
}