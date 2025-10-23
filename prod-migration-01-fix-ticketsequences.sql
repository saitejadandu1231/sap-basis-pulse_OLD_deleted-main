-- Production Migration 01 Fix: Correct TicketSequences table structure
-- This script fixes the column names in TicketSequences table to match the C# entity

-- ========================================
-- Fix TicketSequences table structure
-- ========================================

-- Check if the table exists and has the wrong column names
DO $$
BEGIN
    -- Check if the table exists with old column names
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'TicketSequences' 
        AND column_name = 'NextSequence'
    ) THEN
        -- Drop the table and recreate it with correct structure
        DROP TABLE IF EXISTS "TicketSequences";
        
        -- Create the table with correct column names
        CREATE TABLE "TicketSequences" (
            "Id" SERIAL PRIMARY KEY,
            "Year" INTEGER NOT NULL,
            "LastSequenceNumber" INTEGER NOT NULL DEFAULT 1,
            "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
            "UpdatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
            CONSTRAINT "UK_TicketSequences_Year" UNIQUE ("Year")
        );
        
        -- Initialize with current year
        INSERT INTO "TicketSequences" ("Year", "LastSequenceNumber", "CreatedAt", "UpdatedAt")
        VALUES (EXTRACT(YEAR FROM NOW()), 1, NOW() AT TIME ZONE 'utc', NOW() AT TIME ZONE 'utc');
        
        -- Create index for performance
        CREATE INDEX IF NOT EXISTS "IX_TicketSequences_Year" ON "TicketSequences" ("Year");
        
        RAISE NOTICE 'TicketSequences table structure corrected successfully';
    ELSE
        RAISE NOTICE 'TicketSequences table already has correct structure';
    END IF;
END $$;

-- Verify the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'TicketSequences' 
ORDER BY ordinal_position;

-- Show current data
SELECT * FROM "TicketSequences";

-- Final success message
DO $$
BEGIN
    RAISE NOTICE 'Migration 01 Fix completed successfully: TicketSequences table structure corrected';
END $$;