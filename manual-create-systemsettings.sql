-- Manual SystemSettings Table Creation Script
-- Run this directly in Railway's PostgreSQL database console

-- Step 1: Create the SystemSettings table
CREATE TABLE IF NOT EXISTS "SystemSettings" (
    "Key" text NOT NULL,
    "Value" text NOT NULL,
    "Description" text NULL,
    "DataType" text NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "UpdatedBy" text NULL,
    CONSTRAINT "PK_SystemSettings" PRIMARY KEY ("Key")
);

-- Step 2: Insert the ConsultantRegistrationEnabled setting
INSERT INTO "SystemSettings" ("Key", "Value", "Description", "DataType", "CreatedAt", "UpdatedAt", "UpdatedBy")
VALUES (
    'ConsultantRegistrationEnabled', 
    'true', 
    'Allow new consultant registrations through the public registration form', 
    'boolean', 
    NOW(), 
    NOW(), 
    'System'
) ON CONFLICT ("Key") DO NOTHING;

-- Step 3: Mark the migration as applied (important!)
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20251005185437_AddSystemSettings', '8.0.0')
ON CONFLICT ("MigrationId") DO NOTHING;

-- Step 4: Verify everything was created correctly
SELECT 'SystemSettings table created' as status;
SELECT * FROM "SystemSettings";
SELECT 'Migration marked as applied' as status;
SELECT * FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251005185437_AddSystemSettings';