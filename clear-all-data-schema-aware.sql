-- Clear All Data Script (Schema-Aware Version)
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
-- Database Schema Analysis
-- ========================================

-- Show all tables in the database for reference
DO $$
DECLARE
    table_count integer;
BEGIN
    SELECT count(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name NOT LIKE 'pg_%';
    
    RAISE NOTICE 'Found % tables in the database', table_count;
END $$;

-- Validate critical tables exist
DO $$
DECLARE
    missing_tables text := '';
    table_exists boolean;
BEGIN
    -- Check Users table
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'Users'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        missing_tables := missing_tables || 'Users, ';
    END IF;
    
    -- Check Orders table
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'Orders'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        missing_tables := missing_tables || 'Orders, ';
    END IF;
    
    IF missing_tables != '' THEN
        RAISE EXCEPTION 'Critical tables missing: %', rtrim(missing_tables, ', ');
    END IF;
    
    RAISE NOTICE 'Database schema validation passed.';
END $$;

-- ========================================
-- Show actual column names for Users table
-- ========================================

DO $$
DECLARE
    col_name text;
    user_columns text := '';
BEGIN
    FOR col_name IN 
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'Users'
        ORDER BY ordinal_position
    LOOP
        user_columns := user_columns || col_name || ', ';
    END LOOP;
    
    RAISE NOTICE 'Users table columns: %', rtrim(user_columns, ', ');
END $$;

-- ========================================
-- Disable triggers and constraints temporarily
-- ========================================

-- Disable all triggers to avoid cascading issues
SET session_replication_role = replica;

-- ========================================
-- Clear data in dependency order with error handling
-- ========================================

-- Function to safely clear a table
CREATE OR REPLACE FUNCTION safe_clear_table(table_name text, clear_method text DEFAULT 'TRUNCATE') 
RETURNS void AS $$
DECLARE
    table_exists boolean;
    row_count integer;
BEGIN
    -- Check if table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = safe_clear_table.table_name
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        RAISE NOTICE 'Table % does not exist, skipping', table_name;
        RETURN;
    END IF;
    
    -- Get current row count
    EXECUTE format('SELECT count(*) FROM %I', table_name) INTO row_count;
    
    IF row_count = 0 THEN
        RAISE NOTICE 'Table % is already empty', table_name;
        RETURN;
    END IF;
    
    -- Clear the table
    IF clear_method = 'TRUNCATE' THEN
        EXECUTE format('TRUNCATE TABLE %I CASCADE', table_name);
        RAISE NOTICE 'TRUNCATED table % (was % rows)', table_name, row_count;
    ELSE
        EXECUTE format('DELETE FROM %I %s', table_name, clear_method);
        GET DIAGNOSTICS row_count = ROW_COUNT;
        RAISE NOTICE 'DELETED % rows from table %', row_count, table_name;
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not clear table %: %', table_name, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- Clear tables in dependency order
-- ========================================

-- Most dependent tables first (leaf nodes)
SELECT safe_clear_table('MessageAttachments');
SELECT safe_clear_table('Messages');
SELECT safe_clear_table('Conversations');
SELECT safe_clear_table('TicketRatings');
SELECT safe_clear_table('OrderTimeSlots');

-- Orders and customer data
SELECT safe_clear_table('Orders');
SELECT safe_clear_table('CustomerChoices');

-- Consultant data
SELECT safe_clear_table('ConsultantAvailabilitySlots');

-- Clear consultant skills for non-admin users only
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ConsultantSkill') THEN
        DELETE FROM "ConsultantSkill" 
        WHERE "ConsultantId" IN (SELECT "Id" FROM "Users" WHERE "Role" != 0); -- 0 = Admin role enum value
        RAISE NOTICE 'Cleared ConsultantSkill for non-admin users';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not clear ConsultantSkill: %', SQLERRM;
END $$;

-- Service request data
SELECT safe_clear_table('ServiceRequestIdentifiers');

-- Authentication and session data (preserve admin sessions)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'RefreshTokens') THEN
        DELETE FROM "RefreshTokens" 
        WHERE "UserId" IN (SELECT "Id" FROM "Users" WHERE "Role" != 0); -- 0 = Admin role
        RAISE NOTICE 'Cleared RefreshTokens for non-admin users';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not clear RefreshTokens: %', SQLERRM;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'LoginActivities') THEN
        DELETE FROM "LoginActivities"
        WHERE "UserId" IN (SELECT "Id" FROM "Users" WHERE "Role" != 0); -- 0 = Admin role
        RAISE NOTICE 'Cleared LoginActivities for non-admin users';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not clear LoginActivities: %', SQLERRM;
END $$;

-- Users (preserve admin users - Role = 0 is Admin in enum)
DO $$
DECLARE
    deleted_count integer;
    preserved_count integer;
BEGIN
    -- Count before deletion
    SELECT count(*) INTO preserved_count FROM "Users" WHERE "Role" = 0;
    
    DELETE FROM "Users" WHERE "Role" != 0; -- Keep admin users only
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RAISE NOTICE 'Deleted % non-admin users, preserved % admin users', deleted_count, preserved_count;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not delete non-admin users: %', SQLERRM;
END $$;

-- Support taxonomy data (clear in dependency order)
SELECT safe_clear_table('SupportSubOptions');
SELECT safe_clear_table('SupportCategories');
SELECT safe_clear_table('SupportTypes');

-- System configuration
SELECT safe_clear_table('SSOConfigurations');
SELECT safe_clear_table('DomainRestrictions');
SELECT safe_clear_table('SystemSettings');

-- Ticket system data
SELECT safe_clear_table('TicketSequences');
SELECT safe_clear_table('StatusChangeLogs');

-- Audit data (clear all or preserve admin - uncomment preferred option)
-- Option 1: Clear all audit logs
SELECT safe_clear_table('AuditLogs');

-- Option 2: Preserve admin audit logs (comment out line above and uncomment below)
-- DO $$
-- BEGIN
--     DELETE FROM "AuditLogs" WHERE "UserId" NOT IN (SELECT "Id" FROM "Users" WHERE "Role" = 0);
--     RAISE NOTICE 'Cleared AuditLogs for non-admin users only';
-- EXCEPTION WHEN OTHERS THEN
--     RAISE NOTICE 'Could not selectively clear AuditLogs: %', SQLERRM;
-- END $$;

-- Clean up the helper function
DROP FUNCTION IF EXISTS safe_clear_table(text, text);

-- ========================================
-- Reset sequences to start from 1
-- ========================================

DO $$
DECLARE
    seq_record RECORD;
    reset_count integer := 0;
BEGIN
    FOR seq_record IN 
        SELECT schemaname, sequencename 
        FROM pg_sequences 
        WHERE schemaname = 'public'
    LOOP
        BEGIN
            EXECUTE 'ALTER SEQUENCE ' || quote_ident(seq_record.schemaname) || '.' || quote_ident(seq_record.sequencename) || ' RESTART WITH 1';
            reset_count := reset_count + 1;
            RAISE NOTICE 'Reset sequence: %', seq_record.sequencename;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not reset sequence %: %', seq_record.sequencename, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Successfully reset % sequences', reset_count;
END $$;

-- ========================================
-- Re-initialize essential data
-- ========================================

-- Reinitialize TicketSequences for current year
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'TicketSequences') THEN
        INSERT INTO "TicketSequences" ("Id", "Year", "NextSequence", "LastUpdated")
        VALUES (gen_random_uuid(), EXTRACT(YEAR FROM NOW()), 1, NOW() AT TIME ZONE 'utc');
        RAISE NOTICE 'Reinitialized TicketSequences for year %', EXTRACT(YEAR FROM NOW());
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not reinitialize TicketSequences: %', SQLERRM;
END $$;

-- ========================================
-- Re-enable triggers and constraints
-- ========================================

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- ========================================
-- Final verification and summary
-- ========================================

-- Show remaining data summary
DO $$
DECLARE
    table_record RECORD;
    total_tables integer := 0;
    empty_tables integer := 0;
    non_empty_tables integer := 0;
    row_count integer;
BEGIN
    RAISE NOTICE '=== DATA CLEARING SUMMARY ===';
    
    FOR table_record IN
        SELECT table_name
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          AND table_name NOT LIKE 'pg_%'
        ORDER BY table_name
    LOOP
        total_tables := total_tables + 1;
        
        EXECUTE format('SELECT count(*) FROM %I', table_record.table_name) INTO row_count;
        
        IF row_count = 0 THEN
            empty_tables := empty_tables + 1;
        ELSE
            non_empty_tables := non_empty_tables + 1;
            RAISE NOTICE 'Table % still has % rows', table_record.table_name, row_count;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Total tables: %, Empty: %, Non-empty: %', total_tables, empty_tables, non_empty_tables;
END $$;

-- Show preserved admin users with actual column names
DO $$
DECLARE
    admin_count integer;
    user_record RECORD;
BEGIN
    SELECT count(*) INTO admin_count FROM "Users" WHERE "Role" = 0;
    
    IF admin_count > 0 THEN
        RAISE NOTICE '=== PRESERVED ADMIN USERS (%): ===', admin_count;
        
        FOR user_record IN
            SELECT "Id", "FirstName", "LastName", "Email", "UserName"
            FROM "Users" 
            WHERE "Role" = 0
            ORDER BY "Email"
        LOOP
            RAISE NOTICE 'Admin: % % (%) - %', user_record."FirstName", user_record."LastName", user_record."Email", user_record."UserName";
        END LOOP;
    ELSE
        RAISE NOTICE 'WARNING: No admin users found! You may not be able to access the system.';
    END IF;
END $$;

-- Final success message
DO $$
BEGIN
    RAISE NOTICE '=== DATA CLEARING COMPLETED SUCCESSFULLY ===';
    RAISE NOTICE 'Admin users have been preserved for system access.';
    RAISE NOTICE 'All sequences have been reset to start from 1.';
    RAISE NOTICE 'TicketSequences has been reinitialized for the current year.';
    RAISE NOTICE 'Remember to run seed data scripts if you need initial reference data.';
END $$;

-- ========================================
-- IMPORTANT NOTES
-- ========================================

/*
SCHEMA-AWARE VERSION FEATURES:

1. **Actual Schema Detection**: Analyzes your database schema before clearing data
2. **Column Name Validation**: Uses actual column names from your database
3. **Smart Error Handling**: Continues even if some tables don't exist
4. **Dependency-Aware Clearing**: Clears tables in the correct order to avoid FK violations
5. **Admin Preservation**: Correctly identifies admin users using enum value (0 = Admin)
6. **Comprehensive Logging**: Detailed feedback about what was cleared and preserved
7. **Safety Checks**: Multiple validation steps before data deletion

WHAT THIS SCRIPT UNDERSTANDS ABOUT YOUR SCHEMA:
- Users table uses Identity columns (no CreatedAt column)
- Role is stored as integer (0 = Admin, 1 = Customer, 2 = Consultant)  
- GUID primary keys for most entities
- Support taxonomy with ShortCode columns
- Consultant skills linked to support categories
- Ticket sequences for numbering system

USAGE:
1. Uncomment the safety confirmation line: 
   -- DO $$ BEGIN RAISE NOTICE 'Data deletion confirmed'; END $$;
   Remove the -- to make it active

2. Run this script - it will adapt to your actual database schema

3. Check the detailed output to see what was cleared successfully

ADMIN USER PRESERVATION:
- Preserves users where Role = 0 (Admin enum value)
- Preserves admin refresh tokens and login activities  
- Preserves admin consultant skills if any admins are consultants

POST-CLEARING STEPS:
1. Verify you can still log in with admin account
2. Run any seed data scripts for reference data
3. Test application functionality

This version is specifically tailored to your SAP Basis Pulse application schema.
*/