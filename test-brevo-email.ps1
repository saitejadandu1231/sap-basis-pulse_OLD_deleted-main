# Brevo Email Test Script
# This script tests the Brevo email functionality

param(
    [Parameter(Mandatory=$true)]
    [string]$BrevoApiKey,
    
    [Parameter(Mandatory=$true)]
    [string]$ToEmail,
    
    [string]$FromEmail = "noreply@yuktor.com",
    [string]$FromName = "Yuktor SAP BASIS Support",
    [string]$Subject = "Brevo Email Test - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
)

Write-Host "🔧 Brevo Email Configuration Test" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""

# Validate inputs
if ([string]::IsNullOrWhiteSpace($BrevoApiKey)) {
    Write-Host "❌ Brevo API Key is required" -ForegroundColor Red
    exit 1
}

if ([string]::IsNullOrWhiteSpace($ToEmail)) {
    Write-Host "❌ Recipient email is required" -ForegroundColor Red
    exit 1
}

try {
    Write-Host "📧 Sending test email via Brevo API..." -ForegroundColor Yellow
    Write-Host "   From: $FromName <$FromEmail>" -ForegroundColor Gray
    Write-Host "   To: $ToEmail" -ForegroundColor Gray
    Write-Host "   Subject: $Subject" -ForegroundColor Gray
    Write-Host ""

    # Create the email payload
    $emailPayload = @{
        sender = @{
            name = $FromName
            email = $FromEmail
        }
        to = @(
            @{
                email = $ToEmail
                name = ($ToEmail -split '@')[0]
            }
        )
        subject = $Subject
        htmlContent = @"
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Brevo Email Test</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">🎉 Brevo Integration Successful!</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your email service is now powered by Brevo</p>
    </div>

    <div style="background: white; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px; padding: 30px;">
        <p style="font-size: 16px; margin-bottom: 20px;">Hello!</p>

        <p style="margin-bottom: 20px;">Congratulations! Your Brevo email configuration is working perfectly. This email confirms that your application can now send emails reliably through Brevo's professional email service.</p>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #495057;">✅ Test Results:</h3>
            <ul style="margin: 0; padding-left: 20px;">
                <li><strong>Email Service:</strong> Brevo (formerly SendinBlue)</li>
                <li><strong>API Status:</strong> Working</li>
                <li><strong>From Email:</strong> $FromEmail</li>
                <li><strong>Test Time:</strong> $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')</li>
                <li><strong>Environment:</strong> Production Ready ✅</li>
            </ul>
        </div>

        <div style="background: #e7f3ff; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #1976D2;">🚀 What's Next?</h4>
            <p style="margin-bottom: 0;">Your email system is ready for production use! Users can now receive:</p>
            <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                <li>Email verification links</li>
                <li>Password reset emails</li>
                <li>System notifications</li>
                <li>Account confirmations</li>
            </ul>
        </div>

        <p style="margin-bottom: 30px;">No more Gmail SMTP issues or authentication problems. Brevo provides reliable, scalable email delivery for your application.</p>

        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

        <div style="text-align: center; color: #6c757d; font-size: 14px;">
            <p>© 2024 Yuktor. This is an automated test email sent via Brevo.</p>
            <p>If you received this email unexpectedly, please contact support.</p>
        </div>
    </div>
</body>
</html>
"@
    } | ConvertTo-Json -Depth 10

    # Set up headers
    $headers = @{
        'api-key' = $BrevoApiKey
        'Content-Type' = 'application/json'
        'accept' = 'application/json'
    }

    # Send the email via Brevo API
    Write-Host "📡 Making API request to Brevo..." -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri "https://api.brevo.com/v3/smtp/email" -Method POST -Headers $headers -Body $emailPayload

    Write-Host "✅ Email sent successfully!" -ForegroundColor Green
    Write-Host "   Message ID: $($response.messageId)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📋 Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Check your inbox at $ToEmail" -ForegroundColor Gray
    Write-Host "2. Look for the test email (check spam folder if needed)" -ForegroundColor Gray
    Write-Host "3. If successful, your Brevo integration is ready for production!" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🎊 Brevo email service is working perfectly!" -ForegroundColor Green

} catch {
    Write-Host ""
    Write-Host "❌ Email sending failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "HTTP Status Code: $statusCode" -ForegroundColor Red
        
        try {
            $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
            Write-Host "Error Details: $($errorDetails.message)" -ForegroundColor Red
        } catch {
            Write-Host "Raw Error Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "🔍 Troubleshooting Tips:" -ForegroundColor Yellow
    Write-Host "1. Verify your Brevo API key is correct" -ForegroundColor Gray
    Write-Host "2. Check that your sender email is verified in Brevo" -ForegroundColor Gray
    Write-Host "3. Ensure your Brevo account is active and not suspended" -ForegroundColor Gray
    Write-Host "4. Check your internet connection" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📖 For more help, see: BREVO_SETUP_GUIDE.md" -ForegroundColor Cyan
    
    exit 1
}

Write-Host ""
Write-Host "🔗 Useful Links:" -ForegroundColor Cyan
Write-Host "• Brevo Dashboard: https://app.brevo.com/" -ForegroundColor Gray
Write-Host "• API Documentation: https://developers.brevo.com/" -ForegroundColor Gray
Write-Host "• Setup Guide: BREVO_SETUP_GUIDE.md" -ForegroundColor Gray