-- Production Migration 01: Add Short Code Support to Support Taxonomy
-- This script adds ShortCode columns to SupportTypes, SupportCategories, and SupportSubOptions
-- It also creates a new TicketSequences table for the new ticket numbering system

-- ========================================
-- 1. Add ShortCode columns to Support Taxonomy tables
-- ========================================

-- Add ShortCode to SupportTypes
ALTER TABLE "SupportTypes" 
ADD COLUMN IF NOT EXISTS "ShortCode" VARCHAR(10) NOT NULL DEFAULT '';

-- Add ShortCode to SupportCategories  
ALTER TABLE "SupportCategories" 
ADD COLUMN IF NOT EXISTS "ShortCode" VARCHAR(10) NOT NULL DEFAULT '';

-- Add ShortCode to SupportSubOptions
ALTER TABLE "SupportSubOptions" 
ADD COLUMN IF NOT EXISTS "ShortCode" VARCHAR(10) NOT NULL DEFAULT '';

-- ========================================
-- 2. Populate ShortCode values for existing data
-- ========================================

-- Update SupportTypes with default short codes
UPDATE "SupportTypes" SET "ShortCode" = 
    CASE 
        WHEN "Name" ILIKE '%SAP RISE%' THEN 'SR'
        WHEN "Name" ILIKE '%SAP Grow%' THEN 'SG'
        WHEN "Name" ILIKE '%Database%' THEN 'DB'
        WHEN "Name" ILIKE '%Network%' THEN 'NW'
        WHEN "Name" ILIKE '%Server%' THEN 'SV'
        WHEN "Name" ILIKE '%Migration%' THEN 'MG'
        WHEN "Name" ILIKE '%On-Prem%' THEN 'OP'
        ELSE UPPER(LEFT("Name", 2))
    END
WHERE "ShortCode" = '' OR "ShortCode" IS NULL;

-- Update SupportCategories with default short codes
UPDATE "SupportCategories" SET "ShortCode" = 
    CASE 
        WHEN "Name" ILIKE '%BASIS%' THEN 'B'
        WHEN "Name" ILIKE '%Database%' OR "Name" ILIKE '%DB%' THEN 'D'
        WHEN "Name" ILIKE '%OS%' OR "Name" ILIKE '%Operating%' THEN 'O'
        WHEN "Name" ILIKE '%Network%' THEN 'N'
        WHEN "Name" ILIKE '%Application%' THEN 'A'
        WHEN "Name" ILIKE '%Performance%' THEN 'P'
        WHEN "Name" ILIKE '%Security%' THEN 'S'
        WHEN "Name" ILIKE '%Billing%' THEN 'BI'
        WHEN "Name" ILIKE '%Integration%' THEN 'I'
        ELSE UPPER(LEFT("Name", 1))
    END
WHERE "ShortCode" = '' OR "ShortCode" IS NULL;

-- Update SupportSubOptions with default short codes
UPDATE "SupportSubOptions" SET "ShortCode" = 
    CASE 
        WHEN "Name" ILIKE '%Incident%' THEN 'I'
        WHEN "Name" ILIKE '%Service Request%' OR "Name" ILIKE '%SR%' THEN 'R'
        WHEN "Name" ILIKE '%Change%' THEN 'C'
        WHEN "Name" ILIKE '%Problem%' THEN 'P'
        WHEN "Name" ILIKE '%Level 1%' OR "Name" ILIKE '%L1%' THEN 'L1'
        WHEN "Name" ILIKE '%Level 2%' OR "Name" ILIKE '%L2%' THEN 'L2'
        WHEN "Name" ILIKE '%Level 3%' OR "Name" ILIKE '%L3%' THEN 'L3'
        WHEN "Name" ILIKE '%Urgent%' THEN 'U'
        WHEN "Name" ILIKE '%Standard%' THEN 'S'
        ELSE UPPER(LEFT("Name", 1))
    END
WHERE "ShortCode" = '' OR "ShortCode" IS NULL;

-- ========================================
-- 3. Create unique constraints for short codes
-- ========================================

-- Create unique constraints for short codes within their scope
-- Note: These constraints ensure short codes are unique within their context

-- SupportTypes: Global uniqueness for short codes
CREATE UNIQUE INDEX IF NOT EXISTS "IX_SupportTypes_ShortCode" 
ON "SupportTypes" ("ShortCode");

-- SupportCategories: Unique within each SupportType
CREATE UNIQUE INDEX IF NOT EXISTS "IX_SupportCategories_ShortCode_SupportTypeId" 
ON "SupportCategories" ("ShortCode", "SupportTypeId");

-- SupportSubOptions: Unique within each SupportCategory
-- First, let's add SupportCategoryId if it doesn't exist (for proper hierarchical structure)
-- Note: In your current schema, SupportSubOptions might only have SupportTypeId
-- We'll create the constraint based on SupportTypeId for now
CREATE UNIQUE INDEX IF NOT EXISTS "IX_SupportSubOptions_ShortCode_SupportTypeId" 
ON "SupportSubOptions" ("ShortCode", "SupportTypeId");

-- ========================================
-- 4. Create TicketSequences table for new numbering system
-- ========================================

CREATE TABLE IF NOT EXISTS "TicketSequences" (
    "Id" SERIAL PRIMARY KEY,
    "Year" INTEGER NOT NULL,
    "LastSequenceNumber" INTEGER NOT NULL DEFAULT 1,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
    "UpdatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
    CONSTRAINT "UK_TicketSequences_Year" UNIQUE ("Year")
);

-- Initialize with current year
INSERT INTO "TicketSequences" ("Year", "LastSequenceNumber", "CreatedAt", "UpdatedAt")
VALUES (EXTRACT(YEAR FROM NOW()), 1, NOW() AT TIME ZONE 'utc', NOW() AT TIME ZONE 'utc')
ON CONFLICT ("Year") DO NOTHING;

-- ========================================
-- 5. Add indexes for performance
-- ========================================

-- Index on TicketSequences for year lookups
CREATE INDEX IF NOT EXISTS "IX_TicketSequences_Year" ON "TicketSequences" ("Year");

-- Indexes on Orders table for better ticket number lookups
CREATE INDEX IF NOT EXISTS "IX_Orders_OrderNumber" ON "Orders" ("OrderNumber");
CREATE INDEX IF NOT EXISTS "IX_Orders_SrIdentifier" ON "Orders" ("SrIdentifier") WHERE "SrIdentifier" IS NOT NULL;

-- ========================================
-- 6. Update constraints to be NOT NULL (after data population)
-- ========================================

-- Remove default values and make ShortCode required
ALTER TABLE "SupportTypes" ALTER COLUMN "ShortCode" DROP DEFAULT;
ALTER TABLE "SupportCategories" ALTER COLUMN "ShortCode" DROP DEFAULT;  
ALTER TABLE "SupportSubOptions" ALTER COLUMN "ShortCode" DROP DEFAULT;

-- Verify all tables have short codes populated
DO $$
BEGIN
    -- Check for any empty short codes
    IF EXISTS (SELECT 1 FROM "SupportTypes" WHERE "ShortCode" = '' OR "ShortCode" IS NULL) THEN
        RAISE EXCEPTION 'Some SupportTypes still have empty ShortCode values';
    END IF;
    
    IF EXISTS (SELECT 1 FROM "SupportCategories" WHERE "ShortCode" = '' OR "ShortCode" IS NULL) THEN
        RAISE EXCEPTION 'Some SupportCategories still have empty ShortCode values';
    END IF;
    
    IF EXISTS (SELECT 1 FROM "SupportSubOptions" WHERE "ShortCode" = '' OR "ShortCode" IS NULL) THEN
        RAISE EXCEPTION 'Some SupportSubOptions still have empty ShortCode values';
    END IF;
    
    RAISE NOTICE 'All ShortCode columns populated successfully';
END $$;

-- ========================================
-- 7. Display results for verification
-- ========================================

-- Show the updated support taxonomy with short codes
SELECT 'SupportTypes' as table_name, "Id", "Name", "ShortCode" FROM "SupportTypes" ORDER BY "Name";
SELECT 'SupportCategories' as table_name, "Id", "Name", "ShortCode", "SupportTypeId" FROM "SupportCategories" ORDER BY "SupportTypeId", "Name";
SELECT 'SupportSubOptions' as table_name, "Id", "Name", "ShortCode", "SupportTypeId" FROM "SupportSubOptions" ORDER BY "SupportTypeId", "Name";

-- Show the ticket sequence table
SELECT * FROM "TicketSequences";

-- Final success message
DO $$
BEGIN
    RAISE NOTICE 'Migration 01 completed successfully: Added ShortCode support and TicketSequences table';
END $$;