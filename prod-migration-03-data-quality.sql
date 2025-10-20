-- Production Migration 03: Data Quality and Status Improvements
-- This script fixes status mapping issues and improves data quality

-- ========================================
-- 1. Fix status mapping inconsistencies
-- ========================================

-- First, let's check for any status mismatches
CREATE TEMP TABLE status_issues AS
SELECT 
    o."Id" as "OrderId",
    o."OrderNumber",
    o."SrIdentifier",
    o."StatusId",
    o."StatusString",
    sm."StatusCode",
    sm."StatusName",
    sm."ColorCode"
FROM "Orders" o
JOIN "StatusMaster" sm ON o."StatusId" = sm."Id"
WHERE o."StatusString" != sm."StatusCode";

-- Show any issues found
SELECT 
    'Status Mapping Issues Found' as info,
    COUNT(*) as tickets_with_issues
FROM status_issues;

-- Fix mismatched StatusString values to match StatusCode
UPDATE "Orders" 
SET "StatusString" = (
    SELECT sm."StatusCode" 
    FROM "StatusMaster" sm 
    WHERE sm."Id" = "Orders"."StatusId"
),
"UpdatedAt" = NOW() AT TIME ZONE 'utc'
WHERE "StatusString" != (
    SELECT sm."StatusCode" 
    FROM "StatusMaster" sm 
    WHERE sm."Id" = "Orders"."StatusId"
);

-- ========================================
-- 2. Improve status color consistency
-- ========================================

-- Update In Progress status color for better visibility
UPDATE "StatusMaster" 
SET "ColorCode" = 'bg-indigo-500', 
    "UpdatedAt" = NOW() AT TIME ZONE 'utc'
WHERE "StatusCode" = 'InProgress' AND "ColorCode" != 'bg-indigo-500';

-- Ensure all status colors are properly formatted
UPDATE "StatusMaster" 
SET "ColorCode" = 
    CASE 
        WHEN "StatusCode" = 'New' AND ("ColorCode" IS NULL OR "ColorCode" = '') THEN 'bg-blue-500'
        WHEN "StatusCode" = 'InProgress' AND ("ColorCode" IS NULL OR "ColorCode" = '') THEN 'bg-indigo-500'  
        WHEN "StatusCode" = 'Completed' AND ("ColorCode" IS NULL OR "ColorCode" = '') THEN 'bg-green-500'
        WHEN "StatusCode" = 'Closed' AND ("ColorCode" IS NULL OR "ColorCode" = '') THEN 'bg-gray-500'
        WHEN "StatusCode" = 'Cancelled' AND ("ColorCode" IS NULL OR "ColorCode" = '') THEN 'bg-red-500'
        WHEN "StatusCode" = 'OnHold' AND ("ColorCode" IS NULL OR "ColorCode" = '') THEN 'bg-yellow-500'
        WHEN "StatusCode" = 'Paid' AND ("ColorCode" IS NULL OR "ColorCode" = '') THEN 'bg-emerald-500'
        WHEN "StatusCode" = 'TopicClosed' AND ("ColorCode" IS NULL OR "ColorCode" = '') THEN 'bg-purple-500'
        ELSE "ColorCode"
    END,
    "UpdatedAt" = NOW() AT TIME ZONE 'utc'
WHERE "ColorCode" IS NULL OR "ColorCode" = '';

-- ========================================
-- 3. Clean up and optimize Orders table
-- ========================================

-- Update any Orders with empty or null OrderNumber to have a temporary identifier
-- This helps with data consistency until new tickets get proper numbers
UPDATE "Orders" 
SET "OrderNumber" = 'LEGACY-' || SUBSTRING("Id"::text, 1, 8),
    "UpdatedAt" = NOW() AT TIME ZONE 'utc'
WHERE "OrderNumber" IS NULL OR "OrderNumber" = '';

-- ========================================
-- 4. Validate support taxonomy relationships
-- ========================================

-- Check for any Orders that reference non-existent support taxonomy
CREATE TEMP TABLE taxonomy_issues AS
SELECT 
    o."Id",
    o."OrderNumber",
    CASE WHEN st."Id" IS NULL THEN 'Missing SupportType' ELSE NULL END as support_type_issue,
    CASE WHEN sc."Id" IS NULL THEN 'Missing SupportCategory' ELSE NULL END as support_category_issue,
    CASE WHEN so."Id" IS NULL AND o."SupportSubOptionId" IS NOT NULL THEN 'Missing SupportSubOption' ELSE NULL END as support_suboption_issue
FROM "Orders" o
LEFT JOIN "SupportTypes" st ON o."SupportTypeId" = st."Id"
LEFT JOIN "SupportCategories" sc ON o."SupportCategoryId" = sc."Id"  
LEFT JOIN "SupportSubOptions" so ON o."SupportSubOptionId" = so."Id"
WHERE st."Id" IS NULL 
   OR sc."Id" IS NULL 
   OR (o."SupportSubOptionId" IS NOT NULL AND so."Id" IS NULL);

-- Show any taxonomy issues
SELECT 
    'Support Taxonomy Issues' as info,
    COUNT(*) as orders_with_issues
FROM taxonomy_issues;

-- ========================================
-- 5. Update RequiresSrIdentifier logic for existing data
-- ========================================

-- Ensure SupportSubOptions that should require SR identifiers are properly marked
-- Based on naming patterns, mark options that typically need SR references
UPDATE "SupportSubOptions" 
SET "RequiresSrIdentifier" = true,
    "UpdatedAt" = NOW() AT TIME ZONE 'utc'
WHERE ("Name" ILIKE '%Service Request%' 
       OR "Name" ILIKE '%SR%' 
       OR "Name" ILIKE '%incident%')
  AND "RequiresSrIdentifier" = false;

-- ========================================
-- 6. Add helpful constraints and checks
-- ========================================

-- Ensure OrderNumber is unique when not null
CREATE UNIQUE INDEX IF NOT EXISTS "IX_Orders_OrderNumber_Unique"
ON "Orders" ("OrderNumber") 
WHERE "OrderNumber" IS NOT NULL AND "OrderNumber" != '';

-- Add check constraint for valid priority values
DO $$
BEGIN
    -- Add constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'CK_Orders_Priority_Valid'
    ) THEN
        ALTER TABLE "Orders" 
        ADD CONSTRAINT "CK_Orders_Priority_Valid" 
        CHECK ("Priority" IN ('Low', 'Medium', 'High', 'VeryHigh', 'Critical', 'Urgent'));
    END IF;
END $$;

-- ========================================
-- 7. Performance improvements
-- ========================================

-- Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS "IX_Orders_Status_CreatedAt" 
ON "Orders" ("StatusString", "CreatedAt" DESC);

CREATE INDEX IF NOT EXISTS "IX_Orders_Consultant_Status" 
ON "Orders" ("ConsultantId", "StatusString") 
WHERE "ConsultantId" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "IX_Orders_Customer_Status" 
ON "Orders" ("CreatedByUserId", "StatusString");

-- Index for payment-related queries
CREATE INDEX IF NOT EXISTS "IX_Orders_PaymentStatus_Amount" 
ON "Orders" ("PaymentStatus", "CalculatedAmount") 
WHERE "PaymentStatus" IS NOT NULL;

-- ========================================
-- 8. Data quality verification
-- ========================================

-- Final verification queries
SELECT 'Data Quality Report' as report_type, 
       'Total Orders' as metric, 
       COUNT(*) as value 
FROM "Orders"

UNION ALL

SELECT 'Data Quality Report', 
       'Orders with OrderNumber', 
       COUNT(*) 
FROM "Orders" 
WHERE "OrderNumber" IS NOT NULL AND "OrderNumber" != ''

UNION ALL  

SELECT 'Data Quality Report',
       'Orders with SR Identifier',
       COUNT(*)
FROM "Orders"
WHERE "SrIdentifier" IS NOT NULL AND "SrIdentifier" != ''

UNION ALL

SELECT 'Data Quality Report',
       'Status Consistency',
       COUNT(*)
FROM "Orders" o
JOIN "StatusMaster" sm ON o."StatusId" = sm."Id"
WHERE o."StatusString" = sm."StatusCode"

UNION ALL

SELECT 'Data Quality Report',
       'Support Types with ShortCode',
       COUNT(*)
FROM "SupportTypes"
WHERE "ShortCode" IS NOT NULL AND "ShortCode" != ''

UNION ALL

SELECT 'Data Quality Report',
       'Support Categories with ShortCode', 
       COUNT(*)
FROM "SupportCategories"
WHERE "ShortCode" IS NOT NULL AND "ShortCode" != ''

UNION ALL

SELECT 'Data Quality Report',
       'Support SubOptions with ShortCode',
       COUNT(*)
FROM "SupportSubOptions" 
WHERE "ShortCode" IS NOT NULL AND "ShortCode" != '';

-- Show status distribution
SELECT 
    'Status Distribution' as report_type,
    sm."StatusCode",
    sm."StatusName", 
    sm."ColorCode",
    COUNT(o."Id") as order_count
FROM "StatusMaster" sm
LEFT JOIN "Orders" o ON sm."Id" = o."StatusId"
WHERE sm."IsActive" = true
GROUP BY sm."StatusCode", sm."StatusName", sm."ColorCode", sm."SortOrder"
ORDER BY sm."SortOrder";

RAISE NOTICE 'Migration 03 completed successfully: Improved data quality and status consistency';