-- Production Migration 02: Remove TicketNumberTemplates and Clean Up Legacy System
-- This script safely removes the old ticket template system while preserving data integrity

-- ========================================
-- 1. Backup existing TicketNumberTemplates data (optional)
-- ========================================

-- Create a backup table before deletion (uncomment if you want to keep a backup)
-- CREATE TABLE "TicketNumberTemplates_Backup" AS 
-- SELECT *, NOW() AT TIME ZONE 'utc' as backup_created_at 
-- FROM "TicketNumberTemplates";

-- ========================================
-- 2. Check dependencies before deletion
-- ========================================

-- Check if any foreign keys reference TicketNumberTemplates
DO $$
DECLARE
    constraint_count INTEGER;
BEGIN
    -- Check for foreign key constraints pointing to TicketNumberTemplates
    SELECT COUNT(*) INTO constraint_count
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu 
        ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND ccu.table_name = 'TicketNumberTemplates';
    
    IF constraint_count > 0 THEN
        RAISE EXCEPTION 'Found % foreign key constraints referencing TicketNumberTemplates. Please review before deletion.', constraint_count;
    END IF;
    
    RAISE NOTICE 'No foreign key dependencies found for TicketNumberTemplates table';
END $$;

-- ========================================
-- 3. Remove TicketNumberTemplates table
-- ========================================

-- Drop the table if it exists
DROP TABLE IF EXISTS "TicketNumberTemplates" CASCADE;

-- ========================================
-- 4. Update Orders table to use new OrderNumber format
-- ========================================

-- Add a comment to document the new ticket numbering format
COMMENT ON COLUMN "Orders"."OrderNumber" IS 'Ticket number in format: SupportType(2) + Category(2) + SubOption(2) + Priority(1) + MonthYear(4) + Sequence(5). Example: SRBIL102500013';

-- ========================================
-- 5. Clean up any remaining references to old system
-- ========================================

-- Remove any indexes that might have been created for the old system
DROP INDEX IF EXISTS "IX_TicketNumberTemplates_SupportTypeId";
DROP INDEX IF EXISTS "IX_TicketNumberTemplates_SupportCategoryId";
DROP INDEX IF EXISTS "IX_TicketNumberTemplates_SupportSubOptionId";
DROP INDEX IF EXISTS "IX_TicketNumberTemplates_Priority";
DROP INDEX IF EXISTS "IX_TicketNumberTemplates_IsActive";
DROP INDEX IF EXISTS "IX_TicketNumberTemplates_IsDefault";

-- ========================================
-- 6. Verify current ticket numbering in Orders table
-- ========================================

-- Show sample of existing tickets to verify current format
SELECT 
    'Current Orders Sample' as info,
    "Id",
    "OrderNumber",
    "SrIdentifier",
    "CreatedAt"
FROM "Orders" 
ORDER BY "CreatedAt" DESC 
LIMIT 10;

-- Show statistics about ticket numbering
SELECT 
    'Ticket Numbering Statistics' as info,
    COUNT(*) as total_orders,
    COUNT("OrderNumber") as orders_with_numbers,
    COUNT("SrIdentifier") as orders_with_sr_identifiers,
    AVG(LENGTH("OrderNumber")) as avg_order_number_length
FROM "Orders";

-- ========================================
-- 7. Update TicketSequences for any existing tickets
-- ========================================

-- Calculate the highest sequence number from existing tickets to set proper starting point
-- This assumes new format tickets will start with proper sequence numbers
DO $$
DECLARE
    current_year INTEGER;
    max_sequence INTEGER;
BEGIN
    current_year := EXTRACT(YEAR FROM NOW());
    
    -- Try to extract sequence numbers from existing OrderNumbers
    -- This is a best-effort approach for tickets that might already use sequential numbering
    SELECT COALESCE(MAX(
        CASE 
            WHEN "OrderNumber" ~ '[0-9]{5}$' THEN 
                CAST(RIGHT("OrderNumber", 5) AS INTEGER)
            ELSE 0
        END
    ), 0) INTO max_sequence
    FROM "Orders"
    WHERE EXTRACT(YEAR FROM "CreatedAt") = current_year;
    
    -- Update the sequence counter to start from the next number
    UPDATE "TicketSequences" 
    SET "NextSequence" = max_sequence + 1,
        "LastUpdated" = NOW() AT TIME ZONE 'utc'
    WHERE "Year" = current_year;
    
    RAISE NOTICE 'Updated ticket sequence for year % to start from %', current_year, max_sequence + 1;
END $$;

-- ========================================
-- 8. Show final verification
-- ========================================

-- Verify the TicketNumberTemplates table is gone
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'TicketNumberTemplates'
        ) THEN 'TicketNumberTemplates table still exists - manual review needed'
        ELSE 'TicketNumberTemplates table successfully removed'
    END as cleanup_status;

-- Show current TicketSequences status
SELECT 
    'TicketSequences Status' as info,
    "Year",
    "NextSequence", 
    "LastUpdated"
FROM "TicketSequences"
ORDER BY "Year";

-- ========================================
-- 9. Performance optimizations for new system
-- ========================================

-- Add additional indexes that might be useful for the new system
CREATE INDEX IF NOT EXISTS "IX_Orders_CreatedAt_Year" 
ON "Orders" (EXTRACT(YEAR FROM "CreatedAt"));

CREATE INDEX IF NOT EXISTS "IX_Orders_SupportTypeId_CreatedAt" 
ON "Orders" ("SupportTypeId", "CreatedAt");

CREATE INDEX IF NOT EXISTS "IX_Orders_StatusId_CreatedAt" 
ON "Orders" ("StatusId", "CreatedAt");

RAISE NOTICE 'Migration 02 completed successfully: Removed TicketNumberTemplates and optimized for new system';