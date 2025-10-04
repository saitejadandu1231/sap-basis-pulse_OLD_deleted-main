# Railway API Deployment Guide

## 🚀 Railway Backend Deployment

### Step 1: Create Railway Account & Project
1. Go to [railway.app](https://railway.app) and sign up with GitHub
2. Click "New Project"
3. Choose "Deploy from GitHub repo"
4. Select your `saitejadandu1231/sap-basis-pulse` repository
5. Set **Root Directory** to `backend`

### Step 2: Add PostgreSQL Database
1. In your Railway project dashboard, click "Add Service"
2. Choose "Database" → "PostgreSQL"
3. Railway will automatically provision a PostgreSQL database
4. Note: This will automatically set the `DATABASE_URL` environment variable

### Step 3: Configure Environment Variables
In Railway dashboard, go to your API service → Variables tab and add:

```bash
# Required Environment Variables
ASPNETCORE_ENVIRONMENT=Production
JWT_SECRET=your_super_secure_production_jwt_secret_key_with_sufficient_length_minimum_32_characters
CORS_ORIGINS=https://sap-basis-pulse-lye7.vercel.app

# SMTP Email Configuration (Required for email notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=satejadandu1231@gmail.com
SMTP_PASSWORD=smxy ffzl tkel clrn
SMTP_FROM=noreply@yuktor.com
SMTP_ENABLE_SSL=true
ADMIN_EMAILS=admin@yuktor.com,support@yuktor.com

# Note: Gmail requires 2FA and app passwords. If you can't set up app passwords,
# consider using Supabase SMTP instead (see EMAIL_SETUP_GUIDE.md for alternatives)

# Optional (for Google SSO)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Railway automatically provides:
# DATABASE_URL=postgresql://username:password@host:port/database
# PORT=8080 (or Railway assigned port)
```

### Step 4: Deploy Settings
Railway should auto-detect your .NET application, but verify:
- **Build Command**: `dotnet publish -c Release -o out`
- **Start Command**: `dotnet out/SapBasisPulse.Api.dll`
- **Healthcheck**: `/api/status`

### Step 5: Database Migration
After successful deployment, you need to run database migrations:

#### Option A: Add migration endpoint (temporary)
Add this to your `Program.cs` for initial setup:
```csharp
// Temporary migration endpoint - remove after first deployment
if (app.Environment.IsProduction())
{
    app.MapGet("/migrate", async (AppDbContext context) =>
    {
        await context.Database.MigrateAsync();
        return "Migration completed";
    });
}
```

#### Option B: Use Railway CLI (recommended)
1. Install Railway CLI: `npm install -g @railway/cli`
2. Login: `railway login`
3. Connect to project: `railway link`
4. Run migration: `railway run dotnet ef database update`

## 🔗 Important URLs After Deployment

- **Railway Dashboard**: https://railway.app/dashboard
- **Your API URL**: https://your-api-name.railway.app
- **Database Connection**: Available in Railway dashboard under PostgreSQL service

## 🛠️ Post-Deployment Configuration

### 1. Update Vercel Environment Variables
In your Vercel dashboard:
- Update `VITE_API_URL` from `http://localhost:5274` to `https://sap-basis-pulseolddeleted-main-production.up.railway.app/api/`
- Redeploy frontend: `vercel --prod`

### 2. Test API Endpoints
Visit these URLs to verify deployment:
- `https://your-api-name.railway.app/api/status` - Health check
- `https://your-api-name.railway.app/swagger` - API documentation

### 3. Database Seeding
Your API includes admin user creation logic that runs automatically.

## 🐛 Troubleshooting

### Common Issues:

#### Build Fails:
- Check Railway build logs for .NET SDK issues
- Verify all NuGet packages are properly referenced
- Ensure `Dockerfile` is in backend directory

#### Database Connection Issues:
- Verify `DATABASE_URL` is automatically set by Railway PostgreSQL service
- Check connection string format in Railway dashboard
- Ensure Entity Framework migrations are applied

#### CORS Errors:
- Verify `CORS_ORIGINS` includes your exact Vercel URL (with https://)
- Check browser network tab for preflight request issues
- Ensure CORS policy is correctly applied in production

#### API Not Responding:
- Check Railway service logs
- Verify port configuration (Railway sets PORT automatically)
- Test health check endpoint

### Railway Free Tier Limits:
- **Execution Time**: $5/month credit (≈500 hours)
- **Storage**: 1GB for database
- **Bandwidth**: 100GB/month
- **Build Time**: Unlimited

## 📋 Deployment Checklist

- [ ] Railway account created and GitHub connected
- [ ] PostgreSQL database service added
- [ ] Environment variables configured
- [ ] API deployed successfully
- [ ] Database migrations applied
- [ ] Health check endpoint working
- [ ] Vercel frontend updated with Railway API URL
- [ ] CORS configured for Vercel domain
- [ ] End-to-end testing completed

## 🔄 Updating Your API

For future updates:
1. Push changes to your GitHub repository
2. Railway automatically redeploys from the `main` branch
3. Database migrations run automatically if configured
4. Monitor deployment logs in Railway dashboard

Your .NET API will be live at: `https://your-project-name.railway.app`