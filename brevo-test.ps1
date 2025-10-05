# Simple Brevo Test
$BrevoApiKey = "YOUR_BREVO_API_KEY_HERE"
$ToEmail = "saitejadandu9999@gmail.com"

Write-Host "Testing Brevo Email..." -ForegroundColor Green

$emailPayload = @{
    sender = @{
        name = "Yuktor Test"
        email = "saitejadandu1231@gmail.com"
    }
    to = @(
        @{
            email = $ToEmail
            name = "TestUser"
        }
    )
    subject = "Brevo Test Email"
    htmlContent = "<h2>Email Test Successful!</h2><p>Your Brevo integration is working!</p><p>Time: $((Get-Date).ToString())</p>"
} | ConvertTo-Json -Depth 10

$headers = @{
    'api-key' = $BrevoApiKey
    'Content-Type' = 'application/json'
    'accept' = 'application/json'
}

try {
    $response = Invoke-RestMethod -Uri "https://api.brevo.com/v3/smtp/email" -Method POST -Headers $headers -Body $emailPayload
    Write-Host "SUCCESS! Message ID: $($response.messageId)" -ForegroundColor Green
    Write-Host "Check your email inbox at: $ToEmail" -ForegroundColor Yellow
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
}