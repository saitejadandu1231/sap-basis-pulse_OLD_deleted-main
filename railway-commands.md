# Railway CLI Commands to Fix SystemSettings Table
# Make sure you have Railway CLI installed: npm install -g @railway/cli

# Step 1: Login to Railway
railway login

# Step 2: Link to your project (if not already linked)
railway link

# Step 3: Connect to your PostgreSQL database
railway connect postgres

# Step 4: Once connected to psql, run these commands:

# Create the table
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

# Insert initial data
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

# Mark migration as applied
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20251005185437_AddSystemSettings', '8.0.0')
ON CONFLICT ("MigrationId") DO NOTHING;

# Verify
SELECT * FROM "SystemSettings";
SELECT * FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251005185437_AddSystemSettings';

# Type \q to exit psql when done