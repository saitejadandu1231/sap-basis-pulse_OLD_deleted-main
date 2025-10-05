# Apply Latest Migration Only - Production Database Update

## ✅ **MIGRATION STATUS: SUCCESSFULLY COMPLETED!** 

**🎉 SUCCESS!** Your production database has been updated successfully! 

**✅ Migrations Applied:** 
- `20251002105856_MakeTicketRatingCommentsOptional` ✅
- `20251005105925_AddTicketNumberTemplate` ✅

**✅ Database:** Connected to production Supabase database
**✅ TicketNumberTemplates Table:** ✅ Created with all columns and indexes
**✅ Migration History:** ✅ Updated properly
**✅ Ready for Deployment:** ✅ Your app can now be safely deployed

---

## 🎯 Apply Only Latest Migration: `AddTicketNumberTemplate`

This guide helps you apply only the latest migration (`20251005105925_AddTicketNumberTemplate`) to your production database.

### **What This Migration Adds:**
- **TicketNumberTemplates table** for configurable ticket numbering
- **Indexes** for performance optimization
- **Foreign key relationships** to SupportCategories and SupportSubOptions

### **Option 1: Install Railway CLI First**

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login and link to your project
railway login
railway link

# 3. Check current migration status
railway run dotnet ef migrations list

# 4. Apply only the latest migration
railway run dotnet ef database update 20251005105925_AddTicketNumberTemplate --verbose
```

### **Option 2: Direct Connection to Production Database** ⭐ (READY TO USE)

```powershell
# 1. Navigate to backend directory
cd backend

# 2. Set environment variables with your actual Railway database connection
$env:DATABASE_URL = "postgresql://postgres.zbsfyxakypvuftxntywm:Sai.9999.Teja@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"
$env:ASPNETCORE_ENVIRONMENT = "Production"

# 3. Check which migrations are already applied
dotnet ef migrations list

# 4. Apply only the latest migration
dotnet ef database update 20251005105925_AddTicketNumberTemplate --verbose
```

**🚀 Ready-to-run commands:**
```powershell
# Copy and paste these commands one by one:
cd backend
$env:DATABASE_URL = "postgresql://postgres.zbsfyxakypvuftxntywm:Sai.9999.Teja@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"
$env:ASPNETCORE_ENVIRONMENT = "Production"
dotnet ef database update 20251005105925_AddTicketNumberTemplate --verbose
```

### **Option 3: Manual SQL Script**

If you prefer manual SQL execution, here's the script:

```sql
-- Create TicketNumberTemplates table
CREATE TABLE "TicketNumberTemplates" (
    "Id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "Name" character varying(100) NOT NULL,
    "Description" character varying(500),
    "Template" character varying(200) NOT NULL,
    "SupportTypeId" uuid,
    "SupportCategoryId" uuid,
    "SupportSubOptionId" uuid,
    "Priority" integer NOT NULL,
    "IsActive" boolean NOT NULL,
    "IsDefault" boolean NOT NULL,
    "CurrentSequence" integer NOT NULL,
    "DateFormat" character varying(50) NOT NULL DEFAULT 'yyyy-MM-dd',
    "SequenceFormat" character varying(20) NOT NULL DEFAULT '0000',
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
    "UpdatedAt" timestamp with time zone,
    "CreatedByUserId" uuid NOT NULL,
    "UpdatedByUserId" uuid,
    CONSTRAINT "PK_TicketNumberTemplates" PRIMARY KEY ("Id")
);

-- Add foreign key constraints
ALTER TABLE "TicketNumberTemplates" 
ADD CONSTRAINT "FK_TicketNumberTemplates_SupportCategories_SupportCategoryId" 
FOREIGN KEY ("SupportCategoryId") REFERENCES "SupportCategories" ("Id") ON DELETE SET NULL;

ALTER TABLE "TicketNumberTemplates" 
ADD CONSTRAINT "FK_TicketNumberTemplates_SupportSubOptions_SupportSubOptionId" 
FOREIGN KEY ("SupportSubOptionId") REFERENCES "SupportSubOptions" ("Id") ON DELETE SET NULL;

ALTER TABLE "TicketNumberTemplates" 
ADD CONSTRAINT "FK_TicketNumberTemplates_SupportTypes_SupportTypeId" 
FOREIGN KEY ("SupportTypeId") REFERENCES "SupportTypes" ("Id") ON DELETE SET NULL;

ALTER TABLE "TicketNumberTemplates" 
ADD CONSTRAINT "FK_TicketNumberTemplates_Users_CreatedByUserId" 
FOREIGN KEY ("CreatedByUserId") REFERENCES "Users" ("Id") ON DELETE CASCADE;

ALTER TABLE "TicketNumberTemplates" 
ADD CONSTRAINT "FK_TicketNumberTemplates_Users_UpdatedByUserId" 
FOREIGN KEY ("UpdatedByUserId") REFERENCES "Users" ("Id");

-- Create indexes
CREATE INDEX "IX_TicketNumberTemplates_CreatedByUserId" ON "TicketNumberTemplates" ("CreatedByUserId");
CREATE INDEX "IX_TicketNumberTemplates_IsActive" ON "TicketNumberTemplates" ("IsActive");
CREATE INDEX "IX_TicketNumberTemplates_IsDefault" ON "TicketNumberTemplates" ("IsDefault");
CREATE INDEX "IX_TicketNumberTemplates_Priority" ON "TicketNumberTemplates" ("Priority");
CREATE INDEX "IX_TicketNumberTemplates_SupportCategoryId" ON "TicketNumberTemplates" ("SupportCategoryId");
CREATE INDEX "IX_TicketNumberTemplates_SupportSubOptionId" ON "TicketNumberTemplates" ("SupportSubOptionId");
CREATE INDEX "IX_TicketNumberTemplates_SupportTypeId" ON "TicketNumberTemplates" ("SupportTypeId");
CREATE INDEX "IX_TicketNumberTemplates_UpdatedByUserId" ON "TicketNumberTemplates" ("UpdatedByUserId");

-- Update migration history
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion") 
VALUES ('20251005105925_AddTicketNumberTemplate', '8.0.0');
```

### **Quick PowerShell Script**

Save this as `apply-latest-migration.ps1`:

```powershell
Write-Host "🚀 Applying Latest Migration to Production Database" -ForegroundColor Green

# Check if Railway CLI is installed
if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Railway CLI..." -ForegroundColor Yellow
    npm install -g @railway/cli
}

# Navigate to backend
Set-Location backend

try {
    Write-Host "📋 Checking current migration status..." -ForegroundColor Cyan
    railway run dotnet ef migrations list
    
    Write-Host "🔄 Applying latest migration: AddTicketNumberTemplate..." -ForegroundColor Yellow
    railway run dotnet ef database update 20251005105925_AddTicketNumberTemplate --verbose
    
    Write-Host "✅ Migration applied successfully!" -ForegroundColor Green
    
    Write-Host "🔍 Verifying migration..." -ForegroundColor Cyan
    railway connect postgresql -c "SELECT table_name FROM information_schema.tables WHERE table_name = 'TicketNumberTemplates';"
    
} catch {
    Write-Host "❌ Error applying migration: $_" -ForegroundColor Red
    Write-Host "💡 Try the manual SQL script option instead" -ForegroundColor Yellow
}

Write-Host "✨ Migration process completed!" -ForegroundColor Green
```

### **Verification Steps**

After applying the migration:

1. **Check if table exists:**
```sql
SELECT table_name FROM information_schema.tables WHERE table_name = 'TicketNumberTemplates';
```

2. **Verify migration history:**
```sql
SELECT * FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251005105925_AddTicketNumberTemplate';
```

3. **Test table structure:**
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'TicketNumberTemplates';
```

### **Safety Notes**

- ✅ This is a **safe migration** - it only adds a new table
- ✅ **No data loss risk** - existing tables are not modified
- ✅ **Rollback available** if needed using EF Core migrations
- ⚠️ Make sure your production database connection is stable

### **Rollback (If Needed)**

If you need to rollback this migration:
```bash
# Rollback to previous migration
railway run dotnet ef database update 20251002105856_MakeTicketRatingCommentsOptional
```

### **Next Steps After Migration**

1. Deploy your application code to Railway
2. Test the ticket numbering functionality
3. Configure default ticket number templates via admin panel