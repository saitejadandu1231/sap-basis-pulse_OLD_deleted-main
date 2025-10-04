# Test Email Functionality

# 1. Test SMTP Connection
Write-Host "Testing SMTP connection..." -ForegroundColor Yellow
try {
    $smtpClient = New-Object System.Net.Mail.SmtpClient("smtp.gmail.com", 587)
    $smtpClient.EnableSsl = $true
    $smtpClient.Credentials = New-Object System.Net.NetworkCredential("your-email@gmail.com", "your-app-password")
    $smtpClient.Timeout = 10000

    $mailMessage = New-Object System.Net.Mail.MailMessage
    $mailMessage.From = "noreply@yuktor.com"
    $mailMessage.To.Add("test@example.com")
    $mailMessage.Subject = "Test Email from Yuktor"
    $mailMessage.Body = "This is a test email to verify SMTP configuration."
    $mailMessage.IsBodyHtml = $false

    $smtpClient.Send($mailMessage)
    Write-Host "✅ SMTP test successful!" -ForegroundColor Green
} catch {
    Write-Host "❌ SMTP test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 2. Check Environment Variables
Write-Host "`nChecking environment variables..." -ForegroundColor Yellow
$envVars = @(
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USERNAME",
    "SMTP_PASSWORD",
    "SMTP_FROM",
    "ADMIN_EMAILS"
)

foreach ($var in $envVars) {
    $value = [Environment]::GetEnvironmentVariable($var)
    if ($value) {
        Write-Host "✅ $var = $($value.Substring(0, [Math]::Min(10, $value.Length)))..." -ForegroundColor Green
    } else {
        Write-Host "❌ $var not set" -ForegroundColor Red
    }
}

Write-Host "`nEmail setup verification complete!" -ForegroundColor Cyan