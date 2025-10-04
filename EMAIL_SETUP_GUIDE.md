# Email Configuration Guide

## Option 1: Use Your Backend SMTP (Recommended)

Your application already has SMTP email functionality built-in. Configure these environment variables in your production deployment:

### Railway Environment Variables
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
SMTP_FROM=noreply@yuktor.com
SMTP_ENABLE_SSL=true
ADMIN_EMAILS=admin@yuktor.com,support@yuktor.com
```

### Docker Compose Environment Variables
If deploying with Docker Compose, set these environment variables:
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
SMTP_FROM=noreply@yuktor.com
SMTP_ENABLE_SSL=true
ADMIN_EMAILS=admin@yuktor.com,support@yuktor.com
```

### Gmail App Password Setup

**Important**: You must have 2-Factor Authentication (2FA) enabled on your Google account to create app passwords.

#### Step-by-Step Instructions:
1. **Enable 2-Factor Authentication**:
   - Go to [Google Account Settings](https://myaccount.google.com/security)
   - Under "Signing in to Google", click "2-Step Verification"
   - Follow the setup process to enable 2FA

2. **Generate App Password**:
   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Sign in if prompted
   - Select "Mail" and "Other (custom name)"
   - Enter "Yuktor" as the custom name
   - Click "Generate"
   - Copy the 16-character password (ignore spaces)

3. **Use the App Password**:
   - Use this generated password (not your regular Gmail password) in `SMTP_PASSWORD`

#### Troubleshooting: "Setting not available for your account"
If you see this error, it means 2FA is not enabled. You have these alternatives:

**Alternative A: Enable 2FA on Existing Account**
- Follow the steps above to enable 2FA, then create app password

**Alternative B: Use a Different Gmail Account**
- Create a new Gmail account specifically for Yuktor emails
- Enable 2FA on the new account
- Use the new account's app password

**Alternative C: Use Supabase SMTP (Easier Setup)**
- Go to Supabase Dashboard → Authentication → Email
- Configure SMTP settings there (3,000 emails/month free)
- Update your environment variables to use Supabase SMTP instead

### Supabase SMTP Configuration:
```bash
# Replace Gmail settings with Supabase SMTP
SMTP_HOST=your-supabase-smtp-host
SMTP_PORT=587
SMTP_USERNAME=your-supabase-smtp-username
SMTP_PASSWORD=your-supabase-smtp-password
SMTP_FROM=noreply@yuktor.com
SMTP_ENABLE_SSL=true
ADMIN_EMAILS=admin@yuktor.com,support@yuktor.com
```

**Alternative D: Use Other Email Providers**
- **Outlook/Hotmail**: Similar app password process
- **Yahoo**: App passwords available
- **SendGrid/Mailgun**: Professional SMTP services (paid but reliable)

## Option 2: Supabase SMTP (Alternative)

If you prefer to use Supabase's SMTP:
1. Go to Supabase Dashboard → Authentication → Email
2. Configure SMTP settings there
3. But you'll still need backend email sending for support request notifications

## Current Email Features

✅ **User Registration**: Email verification sent automatically
✅ **Support Requests**: Emails sent to customer, consultant, and admins
✅ **HTML Templates**: Professional, branded email templates
✅ **Error Handling**: Emails don't break request creation if they fail

## Testing Email Functionality

Use the provided PowerShell script to test your email configuration:

### Test Gmail SMTP (Default):
```powershell
# Test with your Gmail credentials
.\test-email-functionality.ps1 -SmtpUsername "your-email@gmail.com" -SmtpPassword "your-app-password" -ToEmail "test@example.com"
```

### Test Multiple Providers (If Gmail App Passwords Don't Work):
```powershell
# Test different email providers
.\test-smtp-config.ps1 -Provider gmail -ToEmail "test@example.com"
.\test-smtp-config.ps1 -Provider outlook -ToEmail "test@example.com"
.\test-smtp-config.ps1 -Provider yahoo -ToEmail "test@example.com"
.\test-smtp-config.ps1 -Provider supabase -ToEmail "test@example.com"
```

### Manual Testing Steps

1. **Deploy your application** with the SMTP environment variables configured
2. **Create a support request** in your application
3. **Check that emails are sent to:**
   - Customer (confirmation email)
   - Assigned consultant (notification)
   - Admin emails (assignment alert)

### Expected Email Content

- **Customer Email**: Confirmation with request details and Yuktor branding
- **Consultant Email**: Assignment notification with customer information
- **Admin Email**: Alert about new support request requiring attention

## Email Templates

The system includes professional HTML email templates for:
- Support request creation (customer)
- Consultant assignment (consultant)
- Admin notifications (admins)

All templates are responsive and branded for Yuktor.