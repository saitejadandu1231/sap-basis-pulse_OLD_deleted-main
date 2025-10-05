# Quick Brevo Email Test
# This will test sending an email using a Brevo verified sender address

param(
    [string]$ToEmail = "saitejadandu9999@gmail.com"
)

$BrevoApiKey = "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"

Write-Host "🔧 Testing Brevo Email with Different Sender Addresses" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

# Test with Brevo's default sending domain first
$testSenders = @(
    @{ Email = "test@brevo.com"; Name = "Brevo Test" },
    @{ Email = "noreply@brevo.com"; Name = "Brevo NoReply" },
    @{ Email = "contact@brevo.com"; Name = "Brevo Contact" }
)

foreach ($sender in $testSenders) {
    Write-Host ""
    Write-Host "📧 Testing with sender: $($sender.Name) <$($sender.Email)>" -ForegroundColor Yellow
    
    try {
        $emailPayload = @{
            sender = @{
                name = $sender.Name
                email = $sender.Email
            }
            to = @(
                @{
                    email = $ToEmail
                    name = ($ToEmail -split '@')[0]
                }
            )
            subject = "Test Email from $($sender.Name) - $(Get-Date -Format 'HH:mm:ss')"
            htmlContent = @"
<html>
<body style="font-family: Arial, sans-serif; padding: 20px;">
    <h2>🎉 Brevo Email Test Successful!</h2>
    <p>This email was sent from: <strong>$($sender.Name) &lt;$($sender.Email)&gt;</strong></p>
    <p>If you received this, your Brevo integration is working!</p>
    <p>Time: $(Get-Date)</p>
</body>
</html>
"@
        } | ConvertTo-Json -Depth 10

        $headers = @{
            'api-key' = $BrevoApiKey
            'Content-Type' = 'application/json'
            'accept' = 'application/json'
        }

        $response = Invoke-RestMethod -Uri "https://api.brevo.com/v3/smtp/email" -Method POST -Headers $headers -Body $emailPayload
        
        Write-Host "✅ Success! Message ID: $($response.messageId)" -ForegroundColor Green
        Write-Host "   Check your inbox for email from $($sender.Email)" -ForegroundColor Gray
        
        # Break after first successful send
        break
        
    } catch {
        Write-Host "❌ Failed with $($sender.Email): $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🔍 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Check your email inbox (and spam folder)" -ForegroundColor Gray
Write-Host "2. If you received the test email, the issue is with your sender domain" -ForegroundColor Gray
Write-Host "3. If no email received, check your Brevo account status" -ForegroundColor Gray