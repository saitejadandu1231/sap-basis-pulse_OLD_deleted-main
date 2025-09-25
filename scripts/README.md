# Production Database Configuration Guide

## 🚀 Quick Start - Update Existing Production Database

You have **3 options** to update your existing production database with SSO configuration:

### Option 1: EF Core Migrations (Recommended)
```powershell
# Set your production database connection
$env:DATABASE_URL = "your_production_database_connection_string"

# Run the update script
.\scripts\update-production-db.ps1
```

### Option 2: Railway Specific (If using Railway)
```powershell
# Automated Railway database update
.\scripts\update-railway-db.ps1
```

### Option 3: Manual SQL Execution
```sql
-- Connect to your production database and run:
-- File: scripts/update-production-database.sql
```

---

## 📋 What These Scripts Do

### Database Changes Applied:
1. **Creates `SSOConfigurations` table** with columns:
   - `Id` (UUID, Primary Key)
   - `GoogleEnabled` (Boolean, default: true)
   - `AppleEnabled` (Boolean, default: true) 
   - `SupabaseEnabled` (Boolean, default: true)
   - `CreatedAt`, `UpdatedAt` (Timestamps)

2. **Adds `SsoProvider` column** to existing `Users` table

3. **Makes `PasswordHash` nullable** for SSO-only users

4. **Creates performance indexes** for SSO queries

5. **Inserts default SSO configuration** (all providers enabled)

---

## 🔧 Detailed Instructions

### For Railway Deployments:

1. **Ensure Railway CLI is installed:**
   ```powershell
   npm install -g @railway/cli
   railway login
   railway link  # Select your SAP Basis Pulse project
   ```

2. **Run Railway-specific script:**
   ```powershell
   .\scripts\update-railway-db.ps1
   ```

3. **Verify in Railway dashboard:**
   - Check logs: `railway logs`
   - Monitor deployment: `railway status`

### For Other Cloud Providers:

1. **Get your production database connection string**
2. **Set environment variable:**
   ```powershell
   $env:DATABASE_URL = "Host=host;Port=5432;Database=db;Username=user;Password=pass;SSL Mode=Require"
   ```
3. **Run generic script:**
   ```powershell
   .\scripts\update-production-db.ps1
   ```

### Manual SQL Method (If scripts fail):

1. **Connect to your production database**
2. **Execute SQL file:** `scripts/update-production-database.sql`
3. **Verify tables created:** 
   ```sql
   SELECT * FROM "SSOConfigurations";
   ```

---

## ✅ Verification Steps

After running the update scripts:

### 1. Database Verification
```sql
-- Check SSO configuration table
SELECT * FROM "SSOConfigurations";

-- Verify Users table has SsoProvider column
\d "Users"

-- Check indexes were created
\di *SSO*
```

### 2. Application Verification
- Restart your production application
- Check application logs for SSO initialization
- Visit admin panel → SSO Configuration
- Test Google OAuth login flow

### 3. Expected Log Output
```
[Startup] SSO configuration already exists. Current state: Supabase=True, Google=True, Apple=True
```

---

## 🔒 Security Considerations

### Production Environment Variables Needed:
```bash
# Backend (Railway/Production)
ASPNETCORE_ENVIRONMENT=Production
JWT_SECRET=your_secure_256_bit_jwt_secret
GOOGLE_CLIENT_ID=your_production_google_client_id  
GOOGLE_CLIENT_SECRET=your_production_google_client_secret
SUPABASE_URL=https://zbsfyxakypvuftxntywm.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
CORS_ORIGINS=https://your-frontend-url.vercel.app
```

### OAuth Provider Setup:
1. **Google Console:** Add production URLs to authorized origins
2. **Supabase:** Update site URL and redirect URLs
3. **Test OAuth flow** in production environment

---

## 🚨 Troubleshooting

### Common Issues:

**"Migration already exists"**
- ✅ This is normal - the script detects existing tables

**"Connection string not found"**
- Set `DATABASE_URL` environment variable
- Verify connection string format

**"Permission denied"**  
- Ensure database user has CREATE TABLE permissions
- Check SSL/TLS requirements

**"SSO buttons not appearing"**
- Check `SSOConfigurations` table has data
- Verify environment variables are set
- Check application logs for initialization errors

### Getting Help:
1. Check Railway logs: `railway logs`
2. Verify database connection: `railway connect`
3. Test local connection with production data

---

## 📊 Migration Status

### Before Running Scripts:
- ❌ No SSO support
- ❌ Users require passwords
- ❌ No SSO configuration table

### After Running Scripts:
- ✅ SSO configuration table created
- ✅ SSO providers enabled (Google, Apple, Supabase)
- ✅ Users can sign in with SSO or password
- ✅ Admin can manage SSO settings
- ✅ Performance indexes created

---

## 🎯 Ready to Deploy!

Your database update scripts are ready. Choose your method:

1. **Railway Users:** Run `.\scripts\update-railway-db.ps1`
2. **Other Platforms:** Run `.\scripts\update-production-db.ps1` 
3. **Manual Method:** Execute `scripts/update-production-database.sql`

After updating, your existing production app will have full SSO support! 🚀