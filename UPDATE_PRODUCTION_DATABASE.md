# Production Database Update Guide

## 🚀 How to Update Production Database Before Deployment

### **Method 1: EF Core Migrations (Recommended)**

#### Step 1: Backup Production Database
```bash
# For Railway PostgreSQL - create backup first
railway connect
# Then in the railway environment:
pg_dump -h hostname -U username -d database_name > backup_$(date +%Y%m%d_%H%M%S).sql
```

#### Step 2: Update via EF Core Migrations
```powershell
# Navigate to backend directory
cd backend

# Set production environment variables
$env:ASPNETCORE_ENVIRONMENT = "Production"
$env:DATABASE_URL = "your_railway_postgres_connection_string"

# Apply all pending migrations to production
dotnet ef database update --verbose
```

#### Step 3: Verify Database Updates
```sql
-- Connect to your Railway PostgreSQL and verify:
-- 1. Check if new Orders columns exist (AddHoursWorkedAndCalculatedAmount migration)
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'Orders' 
AND column_name IN ('HoursWorked', 'HourlyRate', 'CalculatedAmount');

-- 2. Check if TicketNumberTemplates table exists
SELECT table_name FROM information_schema.tables WHERE table_name = 'TicketNumberTemplates';

-- 3. Verify SSO configurations
SELECT * FROM "SSOConfigurations";

-- 4. Check latest migration applied (should include AddHoursWorkedAndCalculatedAmount)
SELECT * FROM "__EFMigrationsHistory" ORDER BY "MigrationId" DESC LIMIT 5;

-- 5. Verify Orders table structure
\d "Orders"
```

### **Method 2: Railway CLI Database Update**

#### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
```

#### Step 2: Connect and Update
```bash
# Login to Railway
railway login

# Link to your project
railway link

# Connect to production database
railway connect

# Run migrations through Railway
railway run dotnet ef database update
```

### **Method 3: Manual SQL Script Execution**

If EF migrations fail, you can run SQL scripts manually:

#### Step 1: Connect to Railway Database
```bash
railway connect postgresql
```

#### Step 2: Execute Update Scripts
```sql
-- Run the scripts in order:
-- 1. scripts/update-production-database.sql
-- 2. Any custom migration scripts
-- 3. Verify with: SELECT * FROM "__EFMigrationsHistory";
```

### **Current Database Schema Updates Needed**

Based on your latest migrations, you'll need these updates:

1. **Work Hours Tracking** (20251018091800_AddHoursWorkedAndCalculatedAmount)
   - Adds `HoursWorked`, `HourlyRate`, and `CalculatedAmount` columns to Orders table
   - Required for new Work Summary and payment calculation features
2. **TicketNumberTemplates Table** (20251005105925_AddTicketNumberTemplate)
3. **Rating Comments Optional** (20251002105856_MakeTicketRatingCommentsOptional)
4. **Consultant Skills** (20250928141742_AddConsultantSkills)
5. **Payment Support** (20250928054555_AddPaymentAndMultiSlotSupport)
6. **Status Management** (20250923070115_AddStatusMasterAndStatusChangeLogTables)

### **Pre-Deployment Checklist**

- [ ] **Backup production database**
- [ ] **Test migrations on staging database first**
- [ ] **Verify all environment variables are set**
- [ ] **Check Railway PostgreSQL connection string**
- [ ] **Confirm no active user sessions during update**

### **Environment Variables Required**

Make sure these are set in Railway:
```env
DATABASE_URL=postgresql://username:password@host:port/database
ASPNETCORE_ENVIRONMENT=Production
JWT_SECRET=your_secure_32_char_minimum_secret
CORS_ORIGINS=https://your-vercel-app.vercel.app
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=support@yuktor.com
SMTP_PASSWORD=your_app_password
```

### **Rollback Plan**

If something goes wrong:
```bash
# 1. Restore from backup
railway connect
psql -d database_name < backup_YYYYMMDD_HHMMSS.sql

# 2. Or rollback to specific migration
dotnet ef database update PreviousMigrationName
```

### **Post-Update Verification**

After updating the database:

1. **Test core functionality**:
   - User authentication
   - Ticket creation
   - Payment processing
   - Email notifications

2. **Check logs**:
   ```bash
   railway logs
   ```

3. **Monitor performance**:
   - Database connections
   - Query performance
   - Memory usage

### **Automation Script**

Use the provided PowerShell script:
```powershell
# Run this from project root
.\scripts\update-railway-db.ps1
```

## ⚠️ **IMPORTANT SAFETY NOTES**

1. **Always backup before updating production**
2. **Test migrations on staging first**
3. **Update during low-traffic hours**
4. **Have rollback plan ready**
5. **Monitor application after deployment**

## 🔗 **Quick Commands Summary**

```bash
# Backup
railway connect → pg_dump

# Update database
cd backend && dotnet ef database update

# Verify
railway connect → SELECT * FROM "__EFMigrationsHistory";

# Deploy code
git push origin main  # This triggers Railway deployment
```