-- Production Database Update Script for SSO Configuration and Work Hours Tracking
-- Run this script on your existing production database to add:
-- 1. SSO Configuration support
-- 2. Work Hours Tracking (HoursWorked, HourlyRate, CalculatedAmount columns in Orders table)

-- Step 1: Create SSOConfigurations table if it doesn't exist
CREATE TABLE IF NOT EXISTS "SSOConfigurations" (
    "Id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "GoogleEnabled" boolean NOT NULL DEFAULT false,
    "AppleEnabled" boolean NOT NULL DEFAULT false,
    "SupabaseEnabled" boolean NOT NULL DEFAULT false,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT (now() at time zone 'utc'),
    "UpdatedAt" timestamp with time zone NOT NULL DEFAULT (now() at time zone 'utc'),
    CONSTRAINT "PK_SSOConfigurations" PRIMARY KEY ("Id")
);

-- Step 2: Insert default SSO configuration if table is empty
INSERT INTO "SSOConfigurations" ("GoogleEnabled", "AppleEnabled", "SupabaseEnabled", "CreatedAt", "UpdatedAt")
SELECT true, true, true, now() at time zone 'utc', now() at time zone 'utc'
WHERE NOT EXISTS (SELECT 1 FROM "SSOConfigurations");

-- Step 3: Add SSO provider column to Users table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'Users' AND column_name = 'SsoProvider') THEN
        ALTER TABLE "Users" ADD COLUMN "SsoProvider" text;
    END IF;
END $$;

-- Step 4: Create indexes for better performance
CREATE INDEX IF NOT EXISTS "IX_Users_SsoProvider" ON "Users" ("SsoProvider");
CREATE INDEX IF NOT EXISTS "IX_SSOConfigurations_GoogleEnabled" ON "SSOConfigurations" ("GoogleEnabled");
CREATE INDEX IF NOT EXISTS "IX_SSOConfigurations_AppleEnabled" ON "SSOConfigurations" ("AppleEnabled");
CREATE INDEX IF NOT EXISTS "IX_SSOConfigurations_SupabaseEnabled" ON "SSOConfigurations" ("SupabaseEnabled");

-- Step 5: Update existing users to have nullable password (for SSO users)
-- This allows SSO users to exist without passwords
DO $$ 
BEGIN
    -- Check if PasswordHash column allows NULL
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'Users' 
               AND column_name = 'PasswordHash' 
               AND is_nullable = 'NO') THEN
        -- Make PasswordHash nullable for SSO users
        ALTER TABLE "Users" ALTER COLUMN "PasswordHash" DROP NOT NULL;
    END IF;
END $$;

-- Step 6: Verify the updates
SELECT 'SSO Configuration Table Created/Updated' as status;
SELECT COUNT(*) as sso_config_count FROM "SSOConfigurations";
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_name = 'Users' AND column_name = 'SsoProvider') 
        THEN 'SsoProvider column exists'
        ELSE 'SsoProvider column missing'
    END as sso_provider_status;

-- Display current SSO configuration
SELECT 
    "GoogleEnabled",
    "AppleEnabled", 
    "SupabaseEnabled",
    "CreatedAt",
    "UpdatedAt"
FROM "SSOConfigurations" 
ORDER BY "CreatedAt" DESC 
LIMIT 1;

-- Step 7: Add HoursWorked, HourlyRate, and CalculatedAmount columns to Orders table
-- This corresponds to the AddHoursWorkedAndCalculatedAmount migration
DO $$ 
BEGIN
    -- Add HoursWorked column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'Orders' AND column_name = 'HoursWorked') THEN
        ALTER TABLE "Orders" ADD COLUMN "HoursWorked" numeric;
    END IF;

    -- Add HourlyRate column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'Orders' AND column_name = 'HourlyRate') THEN
        ALTER TABLE "Orders" ADD COLUMN "HourlyRate" numeric;
    END IF;

    -- Add CalculatedAmount column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'Orders' AND column_name = 'CalculatedAmount') THEN
        ALTER TABLE "Orders" ADD COLUMN "CalculatedAmount" numeric;
    END IF;
END $$;

-- Step 8: Create indexes for the new columns for better query performance
CREATE INDEX IF NOT EXISTS "IX_Orders_HoursWorked" ON "Orders" ("HoursWorked");
CREATE INDEX IF NOT EXISTS "IX_Orders_HourlyRate" ON "Orders" ("HourlyRate");
CREATE INDEX IF NOT EXISTS "IX_Orders_CalculatedAmount" ON "Orders" ("CalculatedAmount");

-- Step 9: Verify all updates
SELECT 'Database Updates Complete' as status;

-- Verify Orders table structure
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_name = 'Orders' AND column_name = 'HoursWorked') 
        THEN 'HoursWorked column exists'
        ELSE 'HoursWorked column missing'
    END as hours_worked_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_name = 'Orders' AND column_name = 'HourlyRate') 
        THEN 'HourlyRate column exists'
        ELSE 'HourlyRate column missing'
    END as hourly_rate_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_name = 'Orders' AND column_name = 'CalculatedAmount') 
        THEN 'CalculatedAmount column exists'
        ELSE 'CalculatedAmount column missing'
    END as calculated_amount_status;