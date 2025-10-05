# Brevo Email Service Setup Guide

## What is Brevo?
Brevo (formerly SendinBlue) is a reliable email delivery service that provides better deliverability and reliability compared to Gmail SMTP, especially in production environments.

## Setup Steps

### 1. Create a Brevo Account
1. Go to https://www.brevo.com/
2. Click "Sign up free"
3. Complete the registration process
4. Verify your email address

### 2. Get Your API Key
1. Log into your Brevo account
2. Click on your name in the top-right corner
3. Select "SMTP & API"
4. Under the "API Keys" tab, click "Generate a new API key"
5. Name your API key (e.g., "Yuktor Production")
6. Copy the generated API key and save it securely

### 3. Verify Sender Domain (Important)
For production use, you should verify your sender domain:
1. Go to "Senders & IP" in your Brevo dashboard
2. Click "Domains"
3. Add your domain (e.g., yuktor.com)
4. Follow the DNS verification steps
5. Wait for verification (usually takes a few minutes to hours)

### 4. Configure Environment Variables

#### For Railway Deployment:
Set these environment variables in your Railway dashboard:
```
BREVO_API_KEY=your_actual_brevo_api_key_here
Brevo__ApiKey=your_actual_brevo_api_key_here
Brevo__FromEmail=noreply@yourdomain.com
Brevo__FromName=Yuktor SAP BASIS Support
```

#### For Local Development:
Update your `backend/appsettings.Development.json`:
```json
{
  "Brevo": {
    "ApiKey": "your_brevo_api_key_here",
    "FromEmail": "noreply@yourdomain.com",
    "FromName": "Yuktor SAP BASIS Support",
    "DisableInDevelopment": false
  }
}
```

### 5. Test Your Setup
After deployment, test the email functionality by:
1. Registering a new user account
2. Checking if the verification email is sent
3. Monitoring logs for any Brevo-related errors

## Benefits of Using Brevo

✅ **Better Deliverability**: Professional email service with better inbox delivery rates
✅ **Production Ready**: Designed for high-volume, reliable email delivery
✅ **No Gmail Restrictions**: Avoid Gmail SMTP limits and authentication issues
✅ **Analytics**: Built-in email tracking and analytics
✅ **Free Tier**: 300 emails per day on the free plan
✅ **Scalable**: Easy to upgrade as your email volume grows

## Troubleshooting

### Common Issues:

1. **API Key Not Working**
   - Ensure you've copied the complete API key
   - Check that the environment variable name is correct
   - Verify the API key is active in your Brevo dashboard

2. **Emails Not Being Delivered**
   - Check your Brevo dashboard for delivery status
   - Verify your sender domain is authenticated
   - Ensure recipient email addresses are valid

3. **"name is missing in to" Error**
   - Fixed in v1.1: The system now automatically extracts recipient names from email addresses
   - Brevo requires a name for each recipient, which is now automatically provided

4. **Permission Errors**
   - Make sure your API key has transactional email permissions
   - Check your Brevo account status and limits

### Getting Help:
- Check Brevo's documentation: https://developers.brevo.com/
- Contact Brevo support through their dashboard
- Monitor application logs for detailed error messages

## API Documentation
For developers wanting to understand the implementation:
- Brevo API Reference: https://developers.brevo.com/reference/sendtransacemail
- Our implementation: `backend/Services/BrevoEmailSender.cs`