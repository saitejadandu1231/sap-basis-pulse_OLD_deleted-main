-- Production Rollback Scripts
-- Use these scripts if you need to rollback the migrations in reverse order

-- ========================================
-- ROLLBACK 03: Undo Data Quality and Status Improvements  
-- ========================================

-- Rollback script for migration 03
-- Note: This only undoes structural changes, not data fixes

-- Remove performance indexes added in migration 03
DROP INDEX IF EXISTS "IX_Orders_Status_CreatedAt";
DROP INDEX IF EXISTS "IX_Orders_Consultant_Status"; 
DROP INDEX IF EXISTS "IX_Orders_Customer_Status";
DROP INDEX IF EXISTS "IX_Orders_PaymentStatus_Amount";

-- Remove unique index on OrderNumber
DROP INDEX IF EXISTS "IX_Orders_OrderNumber_Unique";

-- Remove priority check constraint
ALTER TABLE "Orders" DROP CONSTRAINT IF EXISTS "CK_Orders_Priority_Valid";

-- Note: Status color changes and data fixes are not reverted as they are improvements

-- ========================================
-- ROLLBACK 02: Restore TicketNumberTemplates Table
-- ========================================

-- Recreate TicketNumberTemplates table structure
CREATE TABLE IF NOT EXISTS "TicketNumberTemplates" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "Name" VARCHAR(100) NOT NULL,
    "Description" VARCHAR(500),
    "Template" VARCHAR(200) NOT NULL,
    "Priority" INTEGER NOT NULL DEFAULT 0,
    "IsActive" BOOLEAN NOT NULL DEFAULT true,
    "IsDefault" BOOLEAN NOT NULL DEFAULT false,
    "CurrentSequence" INTEGER NOT NULL DEFAULT 0,
    "DateFormat" VARCHAR(50) NOT NULL DEFAULT 'yyyy-MM-dd',
    "SequenceFormat" VARCHAR(20) NOT NULL DEFAULT '0000',
    "SupportTypeId" UUID,
    "SupportCategoryId" UUID,
    "SupportSubOptionId" UUID,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc'),
    "UpdatedAt" TIMESTAMP WITH TIME ZONE,
    "CreatedByUserId" UUID NOT NULL,
    "UpdatedByUserId" UUID,
    
    -- Foreign key constraints
    CONSTRAINT "FK_TicketNumberTemplates_SupportTypes" 
        FOREIGN KEY ("SupportTypeId") REFERENCES "SupportTypes"("Id") ON DELETE SET NULL,
    CONSTRAINT "FK_TicketNumberTemplates_SupportCategories" 
        FOREIGN KEY ("SupportCategoryId") REFERENCES "SupportCategories"("Id") ON DELETE SET NULL,
    CONSTRAINT "FK_TicketNumberTemplates_SupportSubOptions" 
        FOREIGN KEY ("SupportSubOptionId") REFERENCES "SupportSubOptions"("Id") ON DELETE SET NULL,
    CONSTRAINT "FK_TicketNumberTemplates_CreatedBy" 
        FOREIGN KEY ("CreatedByUserId") REFERENCES "Users"("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_TicketNumberTemplates_UpdatedBy" 
        FOREIGN KEY ("UpdatedByUserId") REFERENCES "Users"("Id") ON DELETE SET NULL
);

-- Recreate indexes for TicketNumberTemplates
CREATE INDEX IF NOT EXISTS "IX_TicketNumberTemplates_SupportTypeId" 
ON "TicketNumberTemplates" ("SupportTypeId");
CREATE INDEX IF NOT EXISTS "IX_TicketNumberTemplates_SupportCategoryId" 
ON "TicketNumberTemplates" ("SupportCategoryId");
CREATE INDEX IF NOT EXISTS "IX_TicketNumberTemplates_SupportSubOptionId" 
ON "TicketNumberTemplates" ("SupportSubOptionId");
CREATE INDEX IF NOT EXISTS "IX_TicketNumberTemplates_Priority" 
ON "TicketNumberTemplates" ("Priority");
CREATE INDEX IF NOT EXISTS "IX_TicketNumberTemplates_IsActive" 
ON "TicketNumberTemplates" ("IsActive");

-- Restore from backup if it exists
-- INSERT INTO "TicketNumberTemplates" 
-- SELECT * FROM "TicketNumberTemplates_Backup" 
-- WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'TicketNumberTemplates_Backup');

-- Remove performance indexes added for new system
DROP INDEX IF EXISTS "IX_Orders_CreatedAt_Year";
DROP INDEX IF EXISTS "IX_Orders_SupportTypeId_CreatedAt";
DROP INDEX IF EXISTS "IX_Orders_StatusId_CreatedAt";

-- ========================================
-- ROLLBACK 01: Remove Short Code Support
-- ========================================

-- Drop unique constraints for short codes
DROP INDEX IF EXISTS "IX_SupportTypes_ShortCode";
DROP INDEX IF EXISTS "IX_SupportCategories_ShortCode_SupportTypeId";
DROP INDEX IF EXISTS "IX_SupportSubOptions_ShortCode_SupportTypeId";

-- Remove ShortCode columns
ALTER TABLE "SupportTypes" DROP COLUMN IF EXISTS "ShortCode";
ALTER TABLE "SupportCategories" DROP COLUMN IF EXISTS "ShortCode";
ALTER TABLE "SupportSubOptions" DROP COLUMN IF EXISTS "ShortCode";

-- Drop TicketSequences table
DROP TABLE IF EXISTS "TicketSequences";

-- Remove indexes added for new system
DROP INDEX IF EXISTS "IX_Orders_OrderNumber";
DROP INDEX IF EXISTS "IX_Orders_SrIdentifier";

-- Remove column comment
COMMENT ON COLUMN "Orders"."OrderNumber" IS NULL;

-- ========================================
-- Verification of Rollback
-- ========================================

-- Check that rollback completed successfully
SELECT 
    'Rollback Verification' as check_type,
    'TicketNumberTemplates exists' as check_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'TicketNumberTemplates'
    ) THEN 'YES' ELSE 'NO' END as result

UNION ALL

SELECT 
    'Rollback Verification',
    'TicketSequences removed',
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'TicketSequences'
    ) THEN 'NO - Still exists' ELSE 'YES - Removed' END

UNION ALL

SELECT 
    'Rollback Verification',
    'SupportTypes ShortCode removed',
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'SupportTypes' AND column_name = 'ShortCode'
    ) THEN 'NO - Still exists' ELSE 'YES - Removed' END

UNION ALL

SELECT 
    'Rollback Verification', 
    'SupportCategories ShortCode removed',
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'SupportCategories' AND column_name = 'ShortCode'
    ) THEN 'NO - Still exists' ELSE 'YES - Removed' END

UNION ALL

SELECT 
    'Rollback Verification',
    'SupportSubOptions ShortCode removed', 
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'SupportSubOptions' AND column_name = 'ShortCode'
    ) THEN 'NO - Still exists' ELSE 'YES - Removed' END;

-- ========================================
-- Important Notes for Rollback
-- ========================================

/*
IMPORTANT ROLLBACK CONSIDERATIONS:

1. Data Loss Warning:
   - Rolling back will remove ShortCode data that was populated
   - Any tickets created with the new numbering system may need manual attention
   - Status color improvements will remain (these are beneficial)

2. Order of Execution:
   - Always rollback in reverse order: 03 -> 02 -> 01
   - Test rollbacks in staging environment first

3. Manual Steps Required After Rollback:
   - Restart application services to use old TicketNumberService
   - Verify frontend components work with old ticket numbering
   - Check that any tickets created during new system still display correctly

4. Backup Recommendations:
   - Take full database backup before rollback
   - Verify backup integrity
   - Have a plan to restore individual tables if needed

5. Alternative Approach:
   - Consider keeping new system and fixing issues instead of full rollback
   - New system is more robust and scalable
   - Only rollback if critical issues cannot be resolved quickly
*/