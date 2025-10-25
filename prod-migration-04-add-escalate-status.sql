-- Migration: Add Escalate Status to StatusMaster
-- Date: October 25, 2025
-- Purpose: Add new Escalate ticket status for escalation feature
-- Database: PostgreSQL
-- Instructions: Execute this script against the production database

-- IMPORTANT: This script should be run AFTER backing up the database
-- Backup command (Linux/WSL): pg_dump -U postgres -h localhost -d sap_basis_pulse > backup_20251025.sql

-- ============================================================================
-- PART 1: INSERT ESCALATE STATUS INTO STATUSMASTER
-- ============================================================================

-- Check if Escalate status already exists (optional - for safety)
-- SELECT "StatusCode", "StatusName" FROM "StatusMaster" WHERE "StatusCode" = 'Escalate';

-- First, check if Escalate status already exists
-- If it doesn't exist, insert it with the next available integer ID
INSERT INTO "StatusMaster" 
(
    "Id",
    "StatusCode", 
    "StatusName", 
    "Description", 
    "ColorCode", 
    "IconCode", 
    "SortOrder", 
    "IsActive", 
    "CreatedAt",
    "UpdatedAt"
)
SELECT
    (COALESCE(MAX("Id"), 0) + 1),
    'Escalate', 
    'Escalate', 
    'Issue has been escalated to senior support team', 
    'bg-red-500', 
    'AlertTriangle', 
    7, 
    true, 
    NOW(),
    NULL
FROM "StatusMaster"
WHERE NOT EXISTS (
    SELECT 1 FROM "StatusMaster" WHERE "StatusCode" = 'Escalate'
);  -- Only insert if Escalate status doesn't already exist

-- ============================================================================
-- PART 2: UPDATE EF MIGRATIONS HISTORY
-- ============================================================================

-- Record this migration in EF Core migrations history
INSERT INTO "__EFMigrationsHistory" 
(
    "MigrationId", 
    "ProductVersion"
)
VALUES 
(
    '20251025135947_AddEscalateStatus', 
    '8.0.0'
)
ON CONFLICT ("MigrationId") DO NOTHING;  -- Prevents duplicate entry

-- ============================================================================
-- PART 3: VERIFY INSERTION
-- ============================================================================

-- Verify the Escalate status was added successfully
SELECT 
    "StatusCode", 
    "StatusName", 
    "Description", 
    "ColorCode", 
    "IconCode", 
    "SortOrder", 
    "IsActive", 
    "CreatedAt"
FROM "StatusMaster"
WHERE "StatusCode" = 'Escalate';

-- View all statuses (for reference)
SELECT 
    "StatusCode", 
    "StatusName", 
    "SortOrder",
    "IsActive"
FROM "StatusMaster"
ORDER BY "SortOrder";

-- ============================================================================
-- NOTES FOR PRODUCTION DEPLOYMENT
-- ============================================================================
-- 
-- 1. This script adds the Escalate status required for the ticket escalation feature
-- 
-- 2. The status will be available for:
--    - Consultants: Can escalate active tickets
--    - Customers: Can escalate any ticket
--    - Admins: Can escalate any ticket
-- 
-- 3. When a ticket is escalated:
--    - Status changes to "Escalate" (red indicator)
--    - Email notification sent to ALL admin users
--    - Email includes ticket details and escalation reason
-- 
-- 4. The ON CONFLICT DO NOTHING clause prevents errors if run multiple times
-- 
-- 5. Verify the status appears in your application after running this script
-- 
-- 6. Test the feature by:
--    a) Creating a support ticket
--    b) Escalating it from consultant/customer account
--    c) Checking that all admins receive notification email
--    d) Verifying status shows as "Escalate" with red icon
--
-- ============================================================================
