-- Production Database Update Script for Consultant Tables Audit Fields
-- Run this script on your production database to add audit fields to ConsultantSkill and ConsultantAvailabilitySlots tables
-- Migration: 20251002173221_AddAuditFieldsToConsultantTables

-- Add audit fields to ConsultantSkill table
ALTER TABLE "ConsultantSkill"
ADD COLUMN IF NOT EXISTS "CreatedBy" text;

ALTER TABLE "ConsultantSkill"
ADD COLUMN IF NOT EXISTS "IsDeleted" boolean NOT NULL DEFAULT false;

ALTER TABLE "ConsultantSkill"
ADD COLUMN IF NOT EXISTS "UpdatedAt" timestamp with time zone;

ALTER TABLE "ConsultantSkill"
ADD COLUMN IF NOT EXISTS "UpdatedBy" text;

-- Add audit fields to ConsultantAvailabilitySlots table
ALTER TABLE "ConsultantAvailabilitySlots"
ADD COLUMN IF NOT EXISTS "CreatedAt" timestamp with time zone NOT NULL DEFAULT '0001-01-01 00:00:00';

ALTER TABLE "ConsultantSkill"
ADD COLUMN IF NOT EXISTS "CreatedBy" text;

ALTER TABLE "ConsultantAvailabilitySlots"
ADD COLUMN IF NOT EXISTS "IsDeleted" boolean NOT NULL DEFAULT false;

ALTER TABLE "ConsultantAvailabilitySlots"
ADD COLUMN IF NOT EXISTS "UpdatedAt" timestamp with time zone;

ALTER TABLE "ConsultantAvailabilitySlots"
ADD COLUMN IF NOT EXISTS "UpdatedBy" text;

-- Update existing records to set CreatedAt to current timestamp for ConsultantAvailabilitySlots
-- (Only for records that don't already have a CreatedAt value)
UPDATE "ConsultantAvailabilitySlots"
SET "CreatedAt" = (now() at time zone 'utc')
WHERE "CreatedAt" = '0001-01-01 00:00:00';

-- Create indexes for better performance on audit fields
CREATE INDEX IF NOT EXISTS "IX_ConsultantSkill_IsDeleted" ON "ConsultantSkill" ("IsDeleted");
CREATE INDEX IF NOT EXISTS "IX_ConsultantAvailabilitySlots_IsDeleted" ON "ConsultantAvailabilitySlots" ("IsDeleted");
CREATE INDEX IF NOT EXISTS "IX_ConsultantAvailabilitySlots_CreatedAt" ON "ConsultantAvailabilitySlots" ("CreatedAt");

-- Verify the updates
SELECT
    'ConsultantSkill audit fields added' as ConsultantSkill_Status,
    COUNT(*) as ConsultantSkill_Count
FROM "ConsultantSkill"
UNION ALL
SELECT
    'ConsultantAvailabilitySlots audit fields added' as ConsultantAvailabilitySlots_Status,
    COUNT(*) as ConsultantAvailabilitySlots_Count
FROM "ConsultantAvailabilitySlots";