# Simple Brevo Email Test
param(
    [string]$ToEmail = "saitejadandu9999@gmail.com"
)

$BrevoApiKey = "YOUR_BREVO_API_KEY_HERE"

Write-Host "🔧 Testing Brevo Email Delivery" -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Green
Write-Host ""

try {
    $emailPayload = @{
        sender = @{
            name = "Yuktor Test"
            email = "saitejadandu1231@gmail.com"
        }
        to = @(
            @{
                email = $ToEmail
                name = ($ToEmail -split '@')[0]
            }
        )
        subject = "🎉 Brevo Email Test - $(Get-Date -Format 'HH:mm:ss')"
        htmlContent = @"
<html>
<body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #4CAF50; text-align: center;">🎉 Email Test Successful!</h2>
        <p>Hello <strong>$($ToEmail)</strong>!</p>
        <p>If you received this email, your Brevo integration is working perfectly!</p>
        
        <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #2e7d32; margin-top: 0;">✅ Test Details:</h3>
            <ul>
                <li><strong>Service:</strong> Brevo Email API</li>
                <li><strong>Sender:</strong> noreply@brevo.com</li>
                <li><strong>Time:</strong> $(Get-Date)</li>
                <li><strong>Status:</strong> Successfully Delivered</li>
            </ul>
        </div>
        
        <p>Your email verification system is now ready for production use!</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #666; font-size: 14px; text-align: center;">
            This is a test email from your Yuktor application using Brevo.
        </p>
    </div>
</body>
</html>
"@
    } | ConvertTo-Json -Depth 10

    $headers = @{
        'api-key' = $BrevoApiKey
        'Content-Type' = 'application/json'
        'accept' = 'application/json'
    }

    Write-Host "📧 Sending test email to: $ToEmail" -ForegroundColor Yellow
    Write-Host "   Using sender: noreply@brevo.com" -ForegroundColor Gray
    Write-Host ""

    $response = Invoke-RestMethod -Uri "https://api.brevo.com/v3/smtp/email" -Method POST -Headers $headers -Body $emailPayload
    
    Write-Host "✅ SUCCESS! Email sent successfully!" -ForegroundColor Green
    Write-Host "   Message ID: $($response.messageId)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📬 Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Check your inbox at: $ToEmail" -ForegroundColor Gray
    Write-Host "2. Look in spam/junk folder if not in inbox" -ForegroundColor Gray
    Write-Host "3. Search for 'Brevo Email Test' or 'Yuktor'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🎊 If you received the email, your Brevo setup is working!" -ForegroundColor Green
    
} catch {
    Write-Host "❌ EMAIL TEST FAILED!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "HTTP Status: $statusCode" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "🔍 Possible Issues:" -ForegroundColor Yellow
    Write-Host "1. Invalid API key" -ForegroundColor Gray
    Write-Host "2. Brevo account suspended or limited" -ForegroundColor Gray
    Write-Host "3. Network connectivity issues" -ForegroundColor Gray
}