# Test Multiple SMTP Configurations
# This script helps test different email providers when Gmail app passwords aren't available

param(
    [Parameter(Mandatory=$true)]
    [string]$ToEmail,

    [Parameter(Mandatory=$false)]
    [ValidateSet("gmail", "outlook", "yahoo", "supabase")]
    [string]$Provider = "gmail",

    [string]$SmtpUsername,
    [string]$SmtpPassword,
    [switch]$UseSSL = $true
)

Write-Host "🧪 Testing $Provider SMTP Configuration" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Provider-specific configurations
switch ($Provider) {
    "gmail" {
        $smtpHost = "smtp.gmail.com"
        $smtpPort = 587
        if (-not $SmtpUsername) { $SmtpUsername = Read-Host "Enter Gmail address" }
        if (-not $SmtpPassword) { $SmtpPassword = Read-Host "Enter Gmail app password" -AsSecureString }
        $fromEmail = "noreply@yuktor.com"
    }
    "outlook" {
        $smtpHost = "smtp-mail.outlook.com"
        $smtpPort = 587
        if (-not $SmtpUsername) { $SmtpUsername = Read-Host "Enter Outlook/Hotmail address" }
        if (-not $SmtpPassword) { $SmtpPassword = Read-Host "Enter Outlook app password" -AsSecureString }
        $fromEmail = "noreply@yuktor.com"
    }
    "yahoo" {
        $smtpHost = "smtp.mail.yahoo.com"
        $smtpPort = 587
        if (-not $SmtpUsername) { $SmtpUsername = Read-Host "Enter Yahoo address" }
        if (-not $SmtpPassword) { $SmtpPassword = Read-Host "Enter Yahoo app password" -AsSecureString }
        $fromEmail = "noreply@yuktor.com"
    }
    "supabase" {
        Write-Host "For Supabase SMTP, get credentials from:" -ForegroundColor Yellow
        Write-Host "Supabase Dashboard → Authentication → Email" -ForegroundColor Yellow
        $smtpHost = Read-Host "Enter Supabase SMTP host"
        $smtpPort = 587
        if (-not $SmtpUsername) { $SmtpUsername = Read-Host "Enter Supabase SMTP username" }
        if (-not $SmtpPassword) { $SmtpPassword = Read-Host "Enter Supabase SMTP password" -AsSecureString }
        $fromEmail = "noreply@yuktor.com"
    }
}

# Convert secure string to plain text if needed
if ($SmtpPassword -is [System.Security.SecureString]) {
    $SmtpPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($SmtpPassword))
}

try {
    Write-Host "📧 Sending test email via $Provider..." -ForegroundColor Yellow

    # Create mail message
    $mailMessage = New-Object System.Net.Mail.MailMessage
    $mailMessage.From = $fromEmail
    $mailMessage.To.Add($ToEmail)
    $mailMessage.Subject = "Yuktor Email Test - $Provider SMTP ($(Get-Date -Format 'yyyy-MM-dd HH:mm:ss'))"
    $mailMessage.Body = @"
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Yuktor Email Test</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">✅ $Provider SMTP Test Successful!</h1>
    </div>

    <div style="background: white; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px; padding: 30px;">
        <p style="font-size: 16px; margin-bottom: 20px;">Hello!</p>

        <p style="margin-bottom: 20px;">Your $Provider SMTP configuration is working correctly! This email was sent using $Provider's SMTP servers.</p>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #495057;">Test Details:</h3>
            <ul style="margin: 0; padding-left: 20px;">
                <li><strong>Provider:</strong> $Provider</li>
                <li><strong>SMTP Host:</strong> $smtpHost</li>
                <li><strong>SMTP Port:</strong> $smtpPort</li>
                <li><strong>SSL Enabled:</strong> $UseSSL</li>
                <li><strong>Test Time:</strong> $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')</li>
            </ul>
        </div>

        <p style="margin-bottom: 30px;">Your email system is ready for production use! 🚀</p>

        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

        <div style="text-align: center; color: #6c757d; font-size: 14px;">
            <p>© 2024 Yuktor. This is an automated test email.</p>
        </div>
    </div>
</body>
</html>
"@

    $mailMessage.IsBodyHtml = $true

    # Create SMTP client
    $smtpClient = New-Object System.Net.Mail.SmtpClient
    $smtpClient.Host = $smtpHost
    $smtpClient.Port = $smtpPort
    $smtpClient.EnableSsl = $UseSSL
    $smtpClient.Credentials = New-Object System.Net.NetworkCredential($SmtpUsername, $SmtpPassword)

    # Send email
    $smtpClient.Send($mailMessage)

    Write-Host "✅ Email sent successfully via $Provider!" -ForegroundColor Green
    Write-Host "📬 Check your inbox at $ToEmail" -ForegroundColor Green

    # Provider-specific success messages
    switch ($Provider) {
        "gmail" {
            Write-Host "🎉 Gmail SMTP is working! You can now use this configuration in production." -ForegroundColor Green
        }
        "outlook" {
            Write-Host "🎉 Outlook SMTP is working! Consider using this as an alternative to Gmail." -ForegroundColor Green
        }
        "yahoo" {
            Write-Host "🎉 Yahoo SMTP is working! Consider using this as an alternative to Gmail." -ForegroundColor Green
        }
        "supabase" {
            Write-Host "🎉 Supabase SMTP is working! This is a great alternative if Gmail 2FA is an issue." -ForegroundColor Green
        }
    }

} catch {
    Write-Host "❌ Error sending email via $Provider SMTP: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔍 Troubleshooting for $Provider SMTP:" -ForegroundColor Yellow

    switch ($Provider) {
        "gmail" {
            Write-Host "   - Ensure 2-Factor Authentication is enabled on your Google account" -ForegroundColor Yellow
            Write-Host "   - Verify you're using an App Password (not your regular password)" -ForegroundColor Yellow
            Write-Host "   - Try creating a new Gmail account with 2FA enabled" -ForegroundColor Yellow
            Write-Host "   - Consider using Outlook or Supabase SMTP instead" -ForegroundColor Yellow
        }
        "outlook" {
            Write-Host "   - Ensure 2-Factor Authentication is enabled on your Microsoft account" -ForegroundColor Yellow
            Write-Host "   - Verify you're using an App Password (not your regular password)" -ForegroundColor Yellow
            Write-Host "   - Check if your account supports app passwords" -ForegroundColor Yellow
        }
        "yahoo" {
            Write-Host "   - Ensure you're using an App Password (not your regular password)" -ForegroundColor Yellow
            Write-Host "   - Verify Yahoo account settings allow SMTP access" -ForegroundColor Yellow
        }
        "supabase" {
            Write-Host "   - Double-check your SMTP credentials from Supabase Dashboard" -ForegroundColor Yellow
            Write-Host "   - Ensure you've enabled email in your Supabase project" -ForegroundColor Yellow
        }
    }

    Write-Host ""
    Write-Host "💡 Alternative providers to try:" -ForegroundColor Cyan
    Write-Host "   .\test-smtp-config.ps1 -Provider outlook -ToEmail $ToEmail" -ForegroundColor Cyan
    Write-Host "   .\test-smtp-config.ps1 -Provider yahoo -ToEmail $ToEmail" -ForegroundColor Cyan
    Write-Host "   .\test-smtp-config.ps1 -Provider supabase -ToEmail $ToEmail" -ForegroundColor Cyan

    exit 1
}

Write-Host ""
Write-Host "🎉 $Provider SMTP configuration test completed!" -ForegroundColor Cyan