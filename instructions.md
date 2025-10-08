# How to Fix SystemSettings Table - Step by Step

## Problem
The SystemSettings table doesn't exist in your Railway production database, causing the error:
```
Npgsql.PostgresException: 42P01: relation "SystemSettings" does not exist
```

## Solution Options

### Option A: Railway Dashboard (Easiest)
1. Go to https://railway.app/dashboard
2. Select your project: `sap-basis-pulse_OLD_deleted-main-production`
3. Click on your PostgreSQL database service
4. Click "Query" or "Connect" 
5. Copy and paste the contents of `manual-create-systemsettings.sql`
6. Execute the SQL script

### Option B: Railway CLI
1. Install Railway CLI: `npm install -g @railway/cli`
2. Run: `railway login`
3. Run: `railway link` (select your project)
4. Run: `railway connect postgres`
5. Copy and paste the SQL commands from `railway-commands.md`
6. Type `\q` to exit when done

### Option C: PowerShell Script
1. Get your Railway PostgreSQL connection string:
   - Go to Railway dashboard → Your project → PostgreSQL → Connect → Connection URL
   - Copy the full connection string (looks like: postgresql://username:password@host:port/database)
2. Run: `./apply-migration-manual.ps1 "your-connection-string-here"`

### Option D: Direct psql Connection
1. Get connection details from Railway dashboard
2. Use psql: `psql "postgresql://username:password@host:port/database"`
3. Run the SQL from `manual-create-systemsettings.sql`

## What the SQL Script Does
1. Creates the `SystemSettings` table with proper structure
2. Inserts the `ConsultantRegistrationEnabled` setting with value `true`
3. Marks the migration as applied in `__EFMigrationsHistory`
4. Verifies everything was created correctly

## After Running the Script
1. Your SystemSettings API should work
2. The consultant registration toggle in admin dashboard should function
3. Settings will be persisted to the database
4. The error `relation "SystemSettings" does not exist` should be resolved

## Files Created
- `manual-create-systemsettings.sql` - Direct SQL script
- `railway-commands.md` - Railway CLI commands
- `apply-migration-manual.ps1` - PowerShell script with connection string parameter
- `instructions.md` - This file

Choose the option that works best for you!