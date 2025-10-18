-- AddDomainRestrictions Migration SQL Script
-- Generated on: October 18, 2025
-- Migration: 20251018115027_AddDomainRestrictions

-- ==================================================
-- UP MIGRATION (Execute this to apply the migration)
-- ==================================================

-- Create DomainRestrictions table
CREATE TABLE "DomainRestrictions" (
    "Id" uuid NOT NULL,
    "Domain" character varying(255) NOT NULL,
    "Reason" character varying(500),
    "IsActive" boolean NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
    "CreatedByUserId" uuid NOT NULL,
    "UpdatedAt" timestamp with time zone,
    "UpdatedByUserId" uuid,
    CONSTRAINT "PK_DomainRestrictions" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_DomainRestrictions_Users_CreatedByUserId" FOREIGN KEY ("CreatedByUserId") REFERENCES "Users" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_DomainRestrictions_Users_UpdatedByUserId" FOREIGN KEY ("UpdatedByUserId") REFERENCES "Users" ("Id") ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX "IX_DomainRestrictions_CreatedByUserId" ON "DomainRestrictions" ("CreatedByUserId");

CREATE UNIQUE INDEX "IX_DomainRestrictions_Domain" ON "DomainRestrictions" ("Domain");

CREATE INDEX "IX_DomainRestrictions_Domain_IsActive" ON "DomainRestrictions" ("Domain", "IsActive");

CREATE INDEX "IX_DomainRestrictions_UpdatedByUserId" ON "DomainRestrictions" ("UpdatedByUserId");

-- Insert migration record (if using __EFMigrationsHistory table)
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20251018115027_AddDomainRestrictions', '8.0.10');

-- ==================================================
-- DOWN MIGRATION (Execute this to rollback the migration)
-- ==================================================

/*
-- Drop DomainRestrictions table
DROP TABLE IF EXISTS "DomainRestrictions";

-- Remove migration record (if using __EFMigrationsHistory table)
DELETE FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251018115027_AddDomainRestrictions';
*/

-- ==================================================
-- VERIFICATION QUERIES (Optional - run after applying migration)
-- ==================================================

/*
-- Verify table was created
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'DomainRestrictions' 
ORDER BY ordinal_position;

-- Verify indexes were created
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'DomainRestrictions';

-- Verify foreign key constraints
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='DomainRestrictions';

-- Check migration was recorded
SELECT * FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251018115027_AddDomainRestrictions';
*/