# Gmail SMTP Test with Proper STARTTLS Support
# This script properly handles Gmail's STARTTLS requirement for port 587

param(
    [string]$SmtpHost = "smtp.gmail.com",
    [int]$SmtpPort = 587,
    [string]$SmtpUsername,
    [string]$SmtpPassword,
    [string]$FromEmail = "noreply@yuktor.com",
    [string]$ToEmail,
    [switch]$UsePort465 = $false
)

Write-Host "Testing Gmail SMTP with Proper STARTTLS Support" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

# Check if required parameters are provided
if (-not $SmtpUsername -or -not $SmtpPassword -or -not $ToEmail) {
    Write-Host "Error: Missing required parameters" -ForegroundColor Red
    Write-Host "Usage: .\test-gmail-smtp.ps1 -SmtpUsername 'your-email@gmail.com' -SmtpPassword 'your-app-password' -ToEmail 'test@example.com'" -ForegroundColor Yellow
    exit 1
}

# Configure based on port choice
if ($UsePort465) {
    $SmtpPort = 465
    $EnableSsl = $true
    Write-Host "Using Port 465 (SSL)" -ForegroundColor Yellow
} else {
    $SmtpPort = 587
    $EnableSsl = $false  # Will use STARTTLS
    Write-Host "Using Port 587 (STARTTLS)" -ForegroundColor Yellow
}

try {
    Write-Host "Sending test email..." -ForegroundColor Yellow

    # Create mail message  
    $mailMessage = New-Object System.Net.Mail.MailMessage
    $mailMessage.From = $FromEmail
    $mailMessage.To.Add($ToEmail)
    $mailMessage.Subject = "Yuktor Gmail SMTP Test - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    $mailMessage.Body = @"
Hello!

This is a test email from your Yuktor application using Gmail SMTP.

Configuration Details:
- SMTP Host: $SmtpHost
- SMTP Port: $SmtpPort
- SSL Mode: $(if($EnableSsl){'SSL (465)'}else{'STARTTLS (587)'})
- Test Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

If you're receiving this, your Gmail SMTP configuration is working correctly!

© 2024 Yuktor. This is an automated test email.
"@

    $mailMessage.IsBodyHtml = $false

    # Create SMTP client with proper configuration
    $smtpClient = New-Object System.Net.Mail.SmtpClient
    $smtpClient.Host = $SmtpHost
    $smtpClient.Port = $SmtpPort
    $smtpClient.EnableSsl = $EnableSsl
    $smtpClient.UseDefaultCredentials = $false
    $smtpClient.Credentials = New-Object System.Net.NetworkCredential($SmtpUsername, $SmtpPassword)

    # For port 587, we need to enable STARTTLS
    if ($SmtpPort -eq 587) {
        # .NET SmtpClient automatically handles STARTTLS when EnableSsl = true for port 587
        $smtpClient.EnableSsl = $true  # This enables STARTTLS for port 587
        Write-Host "Enabled STARTTLS for port 587" -ForegroundColor Green
    }

    # Send email
    Write-Host "Attempting to send email..." -ForegroundColor Yellow
    $smtpClient.Send($mailMessage)

    Write-Host "SUCCESS: Email sent successfully!" -ForegroundColor Green
    Write-Host "Check your inbox at $ToEmail" -ForegroundColor Green
    
    # Clean up
    $mailMessage.Dispose()
    $smtpClient.Dispose()

} catch {
    Write-Host "ERROR: Failed to send email" -ForegroundColor Red
    Write-Host "Error Details: $($_.Exception.Message)" -ForegroundColor Red
    
    Write-Host "" -ForegroundColor Yellow
    Write-Host "Troubleshooting Steps:" -ForegroundColor Yellow
    Write-Host "1. Verify 2FA is enabled: https://myaccount.google.com/security" -ForegroundColor Yellow
    Write-Host "2. Generate new app password: https://myaccount.google.com/apppasswords" -ForegroundColor Yellow
    Write-Host "3. Remove all spaces from app password" -ForegroundColor Yellow
    Write-Host "4. Try alternative port: .\test-gmail-smtp.ps1 -UsePort465 ..." -ForegroundColor Yellow
    
    exit 1
}

Write-Host ""
Write-Host "Gmail SMTP test completed successfully!" -ForegroundColor Cyan