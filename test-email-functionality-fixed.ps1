# Test Email Functionality
# This script tests the email sending functionality using the configured SMTP settings

param(
    [string]$SmtpHost = "smtp.gmail.com",
    [int]$SmtpPort = 587,
    [string]$SmtpUsername,
    [string]$SmtpPassword,
    [string]$FromEmail = "noreply@yuktor.com",
    [string]$ToEmail,
    [switch]$UseSSL = $true
)

Write-Host "Testing Email Functionality" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Check if required parameters are provided
if (-not $SmtpUsername -or -not $SmtpPassword -or -not $ToEmail) {
    Write-Host "Error: Missing required parameters" -ForegroundColor Red
    Write-Host "Usage: .\test-email.ps1 -SmtpUsername 'your-email@gmail.com' -SmtpPassword 'your-app-password' -ToEmail 'test@example.com'" -ForegroundColor Yellow
    exit 1
}

try {
    Write-Host "Sending test email..." -ForegroundColor Yellow

    # Create mail message
    $mailMessage = New-Object System.Net.Mail.MailMessage
    $mailMessage.From = $FromEmail
    $mailMessage.To.Add($ToEmail)
    $mailMessage.Subject = "Yuktor Email Test - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    $mailMessage.Body = @"
Hello!

This is a test email from your Yuktor application.

If you are receiving this, your SMTP configuration is working correctly!

Test Details:
- SMTP Host: $SmtpHost
- SMTP Port: $SmtpPort
- SSL Enabled: $UseSSL
- Test Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

Your email system is ready for production use!

© 2024 Yuktor. This is an automated test email.
"@

    $mailMessage.IsBodyHtml = $false

    # Create SMTP client
    $smtpClient = New-Object System.Net.Mail.SmtpClient
    $smtpClient.Host = $SmtpHost
    $smtpClient.Port = $SmtpPort
    $smtpClient.EnableSsl = $UseSSL
    $smtpClient.Credentials = New-Object System.Net.NetworkCredential($SmtpUsername, $SmtpPassword)

    # Send email
    $smtpClient.Send($mailMessage)

    Write-Host "Email sent successfully!" -ForegroundColor Green
    Write-Host "Check your inbox at $ToEmail" -ForegroundColor Green

} catch {
    Write-Host "Error sending email: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Troubleshooting tips:" -ForegroundColor Yellow
    Write-Host "   - Verify your Gmail App Password is correct" -ForegroundColor Yellow
    Write-Host "   - Check that 2FA is enabled on your Google account" -ForegroundColor Yellow
    Write-Host "   - Ensure SMTP settings match your email provider" -ForegroundColor Yellow
    Write-Host "   - Try using port 465 with SSL instead of 587 with TLS" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Email functionality test completed!" -ForegroundColor Cyan