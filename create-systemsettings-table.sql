-- Create SystemSettings table manually
-- Run this SQL script if the migration doesn't work

-- Create the SystemSettings table
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

-- Insert initial system settings
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

-- Verify the table was created
SELECT * FROM "SystemSettings";

-- Check if the migration record exists in __EFMigrationsHistory
SELECT * FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251005185437_AddSystemSettings';

-- If the migration record doesn't exist, insert it to mark the migration as applied
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20251005185437_AddSystemSettings', '8.0.0')
ON CONFLICT ("MigrationId") DO NOTHING;