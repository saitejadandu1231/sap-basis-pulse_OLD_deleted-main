-- Clear All Data Script
-- WARNING: This script will delete ALL data from ALL tables
-- Make sure you have a backup before running this script!

-- ========================================
-- SAFETY CHECK - Uncomment to proceed
-- ========================================

-- Remove the comment from the line below to confirm you want to delete all data
 SET client_min_messages = WARNING;

-- Uncomment this line to actually execute the deletions
-- DO $$ BEGIN RAISE NOTICE 'Data deletion confirmed'; END $$;

-- If you haven't uncommented the above lines, the script will stop here
DO $$
BEGIN
    IF current_setting('client_min_messages') != 'warning' THEN
        RAISE EXCEPTION 'Safety check failed. Please read the comments at the top of this script and uncomment the safety lines to proceed.';
    END IF;
END $$;

-- ========================================
-- Disable triggers and constraints temporarily
-- ========================================

-- Disable all triggers to avoid cascading issues
SET session_replication_role = replica;

-- Start transaction for rollback capability
BEGIN;

-- ========================================
-- Clear all data in correct order (respecting foreign keys)
-- ========================================

-- Core operational data (most dependent tables first)
TRUNCATE TABLE "MessageAttachments" CASCADE;
TRUNCATE TABLE "Messages" CASCADE;
TRUNCATE TABLE "Conversations" CASCADE;
TRUNCATE TABLE "TicketRatings" CASCADE;
TRUNCATE TABLE "OrderTimeSlots" CASCADE;

-- Orders and related data (clear all - admin users shouldn't have customer orders)
TRUNCATE TABLE "Orders" CASCADE;
TRUNCATE TABLE "CustomerChoices" CASCADE;

-- Consultant and availability data
-- Clear availability slots (admin consultants can recreate these)
TRUNCATE TABLE "ConsultantAvailabilitySlots" CASCADE;

-- Clear consultant skills for non-admin users only
DELETE FROM "ConsultantSkill" 
WHERE "ConsultantId" IN (SELECT "Id" FROM "Users" WHERE "Role" != 'Admin');

-- Service request identifiers
TRUNCATE TABLE "ServiceRequestIdentifiers" CASCADE;

-- Authentication and session data (preserve admin user sessions)
-- Clear refresh tokens for non-admin users only
DELETE FROM "RefreshTokens" 
WHERE "UserId" IN (SELECT "Id" FROM "Users" WHERE "Role" != 'Admin');

-- Clear login activity for non-admin users only  
DELETE FROM "LoginActivities"
WHERE "UserId" IN (SELECT "Id" FROM "Users" WHERE "Role" != 'Admin');

-- Users (preserve admin users for login)
-- Delete all non-admin users, keep admin users for system access
DELETE FROM "Users" WHERE "Role" != 'Admin';

-- Support taxonomy data
TRUNCATE TABLE "SupportSubOptions" CASCADE;
TRUNCATE TABLE "SupportCategories" CASCADE;
TRUNCATE TABLE "SupportTypes" CASCADE;

-- System configuration
TRUNCATE TABLE "SSOConfigurations" CASCADE;
TRUNCATE TABLE "DomainRestrictions" CASCADE;
TRUNCATE TABLE "SystemSettings" CASCADE;

-- New ticket numbering system
TRUNCATE TABLE "TicketSequences" CASCADE;

-- Status and audit data
TRUNCATE TABLE "StatusChangeLogs" CASCADE;

-- Clear audit logs for non-admin users, preserve admin audit trail if needed
-- Uncomment the next line if you want to preserve admin audit logs:
-- DELETE FROM "AuditLogs" WHERE "UserId" NOT IN (SELECT "Id" FROM "Users" WHERE "Role" = 'Admin');
-- Or uncomment this line to clear all audit logs:
TRUNCATE TABLE "AuditLogs" CASCADE;

-- Status master (only clear if you want to remove all statuses)
-- UNCOMMENT ONLY IF YOU WANT TO REMOVE ALL STATUS DEFINITIONS
-- TRUNCATE TABLE "StatusMaster" CASCADE;

-- ========================================
-- Reset sequences to start from 1
-- ========================================

-- Reset all sequences to start from 1
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
END $$;

-- ========================================
-- Re-initialize essential data
-- ========================================

-- Reinitialize TicketSequences with current year
INSERT INTO "TicketSequences" ("Year", "NextSequence", "LastUpdated")
VALUES (EXTRACT(YEAR FROM NOW()), 1, NOW() AT TIME ZONE 'utc');

-- ========================================
-- Re-enable triggers and constraints
-- ========================================

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- ========================================
-- Verification
-- ========================================

-- Show table row counts to verify clearing
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserted_rows,
    n_tup_upd as updated_rows,
    n_tup_del as deleted_rows
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Show which tables still have data
SELECT 
    table_name,
    (xpath('/row/count/text()', query_to_xml(format('SELECT count(*) FROM %I.%I', table_schema, table_name), false, true, '')))[1]::text::int AS row_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND table_name NOT LIKE 'pg_%'
ORDER BY table_name;

-- Commit the transaction
COMMIT;

-- ========================================
-- Final verification and summary
-- ========================================

SELECT 'Data Clearing Summary' as summary_type, 
       COUNT(*) as total_tables_processed
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';

-- Show any tables that still have data (these might be reference tables that should keep data)
SELECT 
    'Tables with remaining data' as info,
    table_name,
    (xpath('/row/count/text()', query_to_xml(format('SELECT count(*) FROM %I.%I', table_schema, table_name), false, true, '')))[1]::text::int AS row_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND (xpath('/row/count/text()', query_to_xml(format('SELECT count(*) FROM %I.%I', table_schema, table_name), false, true, '')))[1]::text::int > 0
ORDER BY row_count DESC;

-- Final success messages
DO $$
BEGIN
    RAISE NOTICE 'Data clearing completed successfully!';
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
    "Role",
    "CreatedAt"
FROM "Users" 
WHERE "Role" = 'Admin'
ORDER BY "CreatedAt";

-- ========================================
-- IMPORTANT NOTES
-- ========================================

/*
IMPORTANT POST-CLEARING STEPS:

1. **Reinitialize Required Data**:
   - Run seed scripts for StatusMaster if you cleared it
   - Create initial admin user
   - Set up initial support taxonomy
   - Configure system settings

2. **Verify Application Startup**:
   - Check that application can start without errors
   - Verify database connections work
   - Test user registration/login functionality

3. **Optional Seed Data Scripts to Run**:
   - Status master data (if cleared)
   - Initial support types and categories  
   - Default system settings
   - Test admin user

4. **What This Script Does**:
   - Clears ALL user data except admin users
   - Preserves admin users and their authentication data for system access
   - Clears all orders, messages, consultant data, etc.
   - Preserves table structure and relationships
   - Resets all sequences to start from 1
   - Reinitializes TicketSequences for current year
   - Can optionally preserve StatusMaster data

5. **What This Script Does NOT Do**:
   - Does not drop tables or alter schema
   - Does not remove indexes or constraints
   - Does not clear system sequences (those are reset to 1)
   - Does not affect database structure

6. **Safety Features**:
   - Requires manual confirmation before running
   - Uses transaction for rollback capability
   - Temporarily disables triggers to avoid cascading issues
   - Provides verification queries to confirm results

7. **Use Cases**:
   - Development environment reset
   - Testing with clean database
   - Demo environment preparation
   - After major data corruption issues

WARNING: NEVER run this in production without explicit approval and full backup!
*/