START TRANSACTION;
ALTER TABLE "ConsultantSkill" ADD "CreatedBy" text;

ALTER TABLE "ConsultantSkill" ADD "IsDeleted" boolean NOT NULL DEFAULT FALSE;

ALTER TABLE "ConsultantSkill" ADD "UpdatedAt" timestamp with time zone;

ALTER TABLE "ConsultantSkill" ADD "UpdatedBy" text;

ALTER TABLE "ConsultantAvailabilitySlots" ADD "CreatedAt" timestamp with time zone NOT NULL DEFAULT TIMESTAMPTZ '-infinity';

ALTER TABLE "ConsultantAvailabilitySlots" ADD "CreatedBy" text;

ALTER TABLE "ConsultantAvailabilitySlots" ADD "IsDeleted" boolean NOT NULL DEFAULT FALSE;

ALTER TABLE "ConsultantAvailabilitySlots" ADD "UpdatedAt" timestamp with time zone;

ALTER TABLE "ConsultantAvailabilitySlots" ADD "UpdatedBy" text;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20251002173221_AddAuditFieldsToConsultantTables', '9.0.9');

COMMIT;

