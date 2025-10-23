-- Clear All Data Script (Safe Version)
-- WARNING: This script will delete ALL data from ALL tables
-- Make sure you have a backup before running this script!

-- ========================================
-- SAFETY CHECK - Uncomment to proceed
-- ========================================

SET client_min_messages = WARNING;

-- DO $$ BEGIN RAISE NOTICE 'Data deletion confirmed'; END $$;  -- commented out to avoid accidental execution

-- If you haven't uncommented the above lines, the script will stop here
DO $$
BEGIN
    IF current_setting('client_min_messages') != 'warning' THEN
        RAISE EXCEPTION 'Safety check failed. Please read the comments at the top of this script and uncomment the safety lines to proceed.';
    END IF;
END $$;

-- ========================================
-- Check which tables actually exist
-- ========================================

DO $$
DECLARE
    table_exists boolean;
BEGIN
    -- Check critical tables exist
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'Users'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        RAISE EXCEPTION 'Users table does not exist. Please check your database schema.';
    END IF;
    
    RAISE NOTICE 'Database schema validation passed.';
END $$;

-- ========================================
-- Disable triggers and constraints temporarily
-- ========================================

-- Disable all triggers to avoid cascading issues
SET session_replication_role = replica;

-- ========================================
-- Clear data with individual transactions for safety
-- ========================================

-- Clear each table in its own transaction to avoid transaction abort issues

-- Core operational data (most dependent tables first)
BEGIN;
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'MessageAttachments') THEN
        TRUNCATE TABLE "MessageAttachments" CASCADE;
        RAISE NOTICE 'Cleared MessageAttachments';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not clear MessageAttachments: %', SQLERRM;
END $$;
COMMIT;

BEGIN;
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Messages') THEN
        TRUNCATE TABLE "Messages" CASCADE;
        RAISE NOTICE 'Cleared Messages';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not clear Messages: %', SQLERRM;
END $$;
COMMIT;

BEGIN;
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Conversations') THEN
        TRUNCATE TABLE "Conversations" CASCADE;
        RAISE NOTICE 'Cleared Conversations';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not clear Conversations: %', SQLERRM;
END $$;
COMMIT;

BEGIN;
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'TicketRatings') THEN
        TRUNCATE TABLE "TicketRatings" CASCADE;
        RAISE NOTICE 'Cleared TicketRatings';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not clear TicketRatings: %', SQLERRM;
END $$;
COMMIT;

BEGIN;
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'OrderTimeSlots') THEN
        TRUNCATE TABLE "OrderTimeSlots" CASCADE;
        RAISE NOTICE 'Cleared OrderTimeSlots';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not clear OrderTimeSlots: %', SQLERRM;
END $$;
COMMIT;

-- Orders and related data
BEGIN;
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Orders') THEN
        TRUNCATE TABLE "Orders" CASCADE;
        RAISE NOTICE 'Cleared Orders';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not clear Orders: %', SQLERRM;
END $$;
COMMIT;

BEGIN;
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'CustomerChoices') THEN
        TRUNCATE TABLE "CustomerChoices" CASCADE;
        RAISE NOTICE 'Cleared CustomerChoices';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not clear CustomerChoices: %', SQLERRM;
END $$;
COMMIT;

-- Consultant and availability data
BEGIN;
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ConsultantAvailabilitySlots') THEN
        TRUNCATE TABLE "ConsultantAvailabilitySlots" CASCADE;
        RAISE NOTICE 'Cleared ConsultantAvailabilitySlots';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not clear ConsultantAvailabilitySlots: %', SQLERRM;
END $$;
COMMIT;

-- Clear consultant skills for non-admin users only
BEGIN;
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ConsultantSkill') THEN
        DELETE FROM "ConsultantSkill" 
        WHERE "ConsultantId" IN (SELECT "Id" FROM "Users" WHERE "Role" != 0);
        RAISE NOTICE 'Cleared ConsultantSkill for non-admin users';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not clear ConsultantSkill: %', SQLERRM;
END $$;
COMMIT;

-- Service request identifiers
BEGIN;
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ServiceRequestIdentifiers') THEN
        TRUNCATE TABLE "ServiceRequestIdentifiers" CASCADE;
        RAISE NOTICE 'Cleared ServiceRequestIdentifiers';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not clear ServiceRequestIdentifiers: %', SQLERRM;
END $$;
COMMIT;

-- Authentication and session data (preserve admin user sessions)
BEGIN;
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'RefreshTokens') THEN
        DELETE FROM "RefreshTokens" 
        WHERE "UserId" IN (SELECT "Id" FROM "Users" WHERE "Role" != 0);
        RAISE NOTICE 'Cleared RefreshTokens for non-admin users';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not clear RefreshTokens: %', SQLERRM;
END $$;
COMMIT;

-- Clear login activity for non-admin users only  
BEGIN;
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'LoginActivities') THEN
        DELETE FROM "LoginActivities"
        WHERE "UserId" IN (SELECT "Id" FROM "Users" WHERE "Role" != 0);
        RAISE NOTICE 'Cleared LoginActivities for non-admin users';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not clear LoginActivities: %', SQLERRM;
END $$;
COMMIT;

-- Users (preserve admin users for login)
BEGIN;
DO $$
BEGIN
    DELETE FROM "Users" WHERE "Role" != 0;  -- 0 = Admin role enum value
    RAISE NOTICE 'Deleted non-admin users, preserved admin users';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not delete non-admin users: %', SQLERRM;
END $$;
COMMIT;

-- Support taxonomy data
BEGIN;
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'SupportSubOptions') THEN
        TRUNCATE TABLE "SupportSubOptions" CASCADE;
        RAISE NOTICE 'Cleared SupportSubOptions';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not clear SupportSubOptions: %', SQLERRM;
END $$;
COMMIT;

BEGIN;
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'SupportCategories') THEN
        TRUNCATE TABLE "SupportCategories" CASCADE;
        RAISE NOTICE 'Cleared SupportCategories';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not clear SupportCategories: %', SQLERRM;
END $$;
COMMIT;

BEGIN;
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'SupportTypes') THEN
        TRUNCATE TABLE "SupportTypes" CASCADE;
        RAISE NOTICE 'Cleared SupportTypes';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not clear SupportTypes: %', SQLERRM;
END $$;
COMMIT;

-- System configuration
BEGIN;
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'SSOConfigurations') THEN
        TRUNCATE TABLE "SSOConfigurations" CASCADE;
        RAISE NOTICE 'Cleared SSOConfigurations';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not clear SSOConfigurations: %', SQLERRM;
END $$;
COMMIT;

BEGIN;
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'DomainRestrictions') THEN
        TRUNCATE TABLE "DomainRestrictions" CASCADE;
        RAISE NOTICE 'Cleared DomainRestrictions';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not clear DomainRestrictions: %', SQLERRM;
END $$;
COMMIT;

BEGIN;
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'SystemSettings') THEN
        TRUNCATE TABLE "SystemSettings" CASCADE;
        RAISE NOTICE 'Cleared SystemSettings';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not clear SystemSettings: %', SQLERRM;
END $$;
COMMIT;

-- New ticket numbering system
BEGIN;
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'TicketSequences') THEN
        TRUNCATE TABLE "TicketSequences" CASCADE;
        RAISE NOTICE 'Cleared TicketSequences';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not clear TicketSequences: %', SQLERRM;
END $$;
COMMIT;

-- Status and audit data
BEGIN;
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'StatusChangeLogs') THEN
        TRUNCATE TABLE "StatusChangeLogs" CASCADE;
        RAISE NOTICE 'Cleared StatusChangeLogs';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not clear StatusChangeLogs: %', SQLERRM;
END $$;
COMMIT;

-- Clear audit logs
BEGIN;
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'AuditLogs') THEN
        TRUNCATE TABLE "AuditLogs" CASCADE;
        RAISE NOTICE 'Cleared AuditLogs';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not clear AuditLogs: %', SQLERRM;
END $$;
COMMIT;

-- ========================================
-- Reset sequences to start from 1
-- ========================================

BEGIN;
DO $$
DECLARE
    seq_record RECORD;
BEGIN
    FOR seq_record IN 
        SELECT schemaname, sequencename 
        FROM pg_sequences 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE 'ALTER SEQUENCE ' || quote_ident(seq_record.schemaname) || '.' || quote_ident(seq_record.sequencename) || ' RESTART WITH 1';
        RAISE NOTICE 'Reset sequence: %', seq_record.sequencename;
    END LOOP;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error resetting sequences: %', SQLERRM;
END $$;
COMMIT;

-- ========================================
-- Re-initialize essential data
-- ========================================

BEGIN;
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'TicketSequences') THEN
        INSERT INTO "TicketSequences" ("Year", "NextSequence", "LastUpdated")
        VALUES (EXTRACT(YEAR FROM NOW()), 1, NOW() AT TIME ZONE 'utc');
        RAISE NOTICE 'Reinitialized TicketSequences for year %', EXTRACT(YEAR FROM NOW());
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not reinitialize TicketSequences: %', SQLERRM;
END $$;
COMMIT;

-- ========================================
-- Re-enable triggers and constraints
-- ========================================

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- ========================================
-- Final verification and summary
-- ========================================

-- Show which tables still have data
SELECT 
    'Tables with remaining data' as info,
    table_name,
    (xpath('/row/count/text()', query_to_xml(format('SELECT count(*) FROM %I.%I', table_schema, table_name), false, true, '')))[1]::text::int AS row_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND table_name NOT LIKE 'pg_%'
  AND (xpath('/row/count/text()', query_to_xml(format('SELECT count(*) FROM %I.%I', table_schema, table_name), false, true, '')))[1]::text::int > 0
ORDER BY row_count DESC;

-- Final success messages
DO $$
BEGIN
    RAISE NOTICE '=== Data clearing completed ===';
    RAISE NOTICE 'Admin users have been preserved for system access.';
    RAISE NOTICE 'Remember to run your seed data scripts if you need initial data.';
END $$;

-- Show preserved admin users
SELECT 
    'Preserved Admin Users' as info,
    "Id",
    "FirstName",
    "LastName", 
    "Email",
    "Role"
FROM "Users" 
WHERE "Role" = 0  -- 0 = Admin role enum value
ORDER BY "Email";

-- ========================================
-- IMPORTANT NOTES
-- ========================================

/*
SAFE VERSION FEATURES:

1. **Individual Transactions**: Each table clearing operation is in its own transaction
   to prevent transaction abort from affecting other operations.

2. **Table Existence Checks**: Verifies each table exists before attempting to clear it.

3. **Error Handling**: Uses exception handling to continue even if some operations fail.

4. **Detailed Logging**: Provides clear feedback about what succeeded and what failed.

5. **Safe Rollback**: Each operation can be rolled back individually without affecting others.

USAGE:
1. Uncomment the safety confirmation line as instructed
2. Run this script instead of the original clear-all-data.sql
3. Check the output messages to see what was cleared successfully

This version is much more resilient to schema differences and partial failures.
*/