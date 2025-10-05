# Secure Brevo Setup Guide

## 🔐 Security Notice
**Never commit API keys to your repository!** This guide shows you how to set up Brevo securely.

## 📝 **Your Brevo API Key**
```
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
```
⚠️ **Keep this key private and secure!**

## 🚀 **Production Deployment (Railway)**

### Environment Variables to Set:
```bash
BREVO_API_KEY=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
Brevo__ApiKey=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
Brevo__FromEmail=noreply@brevo.com
Brevo__FromName=Yuktor SAP BASIS Support
Brevo__DisableInDevelopment=false
```

## 🏠 **Local Development Setup**

### Option 1: Environment Variables (Recommended)
Set these in your system/IDE:
```bash
BREVO_API_KEY=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
```

### Option 2: Local Settings File (Not Committed)
Create `backend/appsettings.local.json`:
```json
{
  "Brevo": {
    "ApiKey": "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",
    "FromEmail": "noreply@brevo.com",
    "FromName": "Yuktor SAP BASIS Support",
    "DisableInDevelopment": false
  }
}
```

## 🧪 **Testing**

### Manual Test (PowerShell):
```powershell
# Replace YOUR_API_KEY with actual key
$apiKey = "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"
$email = "your-test-email@gmail.com"

$payload = @{
    sender = @{ name = "Test"; email = "noreply@brevo.com" }
    to = @(@{ email = $email; name = "TestUser" })
    subject = "Brevo Test"
    htmlContent = "<h1>Success!</h1><p>Brevo is working!</p>"
} | ConvertTo-Json -Depth 10

$headers = @{
    'api-key' = $apiKey
    'Content-Type' = 'application/json'
}

Invoke-RestMethod -Uri "https://api.brevo.com/v3/smtp/email" -Method POST -Headers $headers -Body $payload
```

## 🔒 **Security Best Practices**

1. **Never commit API keys** to version control
2. **Use environment variables** in production
3. **Rotate API keys** regularly
4. **Monitor API usage** in Brevo dashboard
5. **Use verified sender domains** for better deliverability

## 📧 **Email Configuration**

- **Verified Sender**: `noreply@brevo.com` (pre-verified by Brevo)
- **For Production**: Consider verifying your own domain `yuktor.com`
- **Free Tier**: 300 emails/day
- **Paid Plans**: Available for higher volumes

## 🛠️ **Troubleshooting**

### Common Issues:
1. **API Key Invalid**: Check key is copied completely
2. **Email not received**: Check spam folder
3. **Domain not verified**: Use `noreply@brevo.com` for testing
4. **Rate limits**: Free tier has daily limits

### Support:
- Brevo Dashboard: https://app.brevo.com/
- API Docs: https://developers.brevo.com/
- Support: support@brevo.com