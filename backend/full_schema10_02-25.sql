CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

START TRANSACTION;
CREATE TABLE "AuditLogs" (
    "Id" uuid NOT NULL,
    "UserId" uuid,
    "Action" text NOT NULL,
    "Entity" text NOT NULL,
    "EntityId" text NOT NULL,
    "Details" text NOT NULL,
    "Timestamp" timestamp with time zone NOT NULL,
    "IpAddress" text NOT NULL,
    CONSTRAINT "PK_AuditLogs" PRIMARY KEY ("Id")
);

CREATE TABLE "SupportTypes" (
    "Id" uuid NOT NULL,
    "Name" text NOT NULL,
    CONSTRAINT "PK_SupportTypes" PRIMARY KEY ("Id")
);

CREATE TABLE "Users" (
    "Id" uuid NOT NULL,
    "Email" text NOT NULL,
    "PasswordHash" text NOT NULL,
    "FirstName" text NOT NULL,
    "LastName" text NOT NULL,
    "Role" integer NOT NULL,
    "Status" integer NOT NULL,
    "SsoProvider" text NOT NULL,
    CONSTRAINT "PK_Users" PRIMARY KEY ("Id")
);

CREATE TABLE "SupportCategories" (
    "Id" uuid NOT NULL,
    "Name" text NOT NULL,
    "SupportTypeId" uuid NOT NULL,
    CONSTRAINT "PK_SupportCategories" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_SupportCategories_SupportTypes_SupportTypeId" FOREIGN KEY ("SupportTypeId") REFERENCES "SupportTypes" ("Id") ON DELETE CASCADE
);

CREATE TABLE "SupportSubOptions" (
    "Id" uuid NOT NULL,
    "Name" text NOT NULL,
    "SupportTypeId" uuid NOT NULL,
    CONSTRAINT "PK_SupportSubOptions" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_SupportSubOptions_SupportTypes_SupportTypeId" FOREIGN KEY ("SupportTypeId") REFERENCES "SupportTypes" ("Id") ON DELETE CASCADE
);

CREATE TABLE "LoginActivities" (
    "Id" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "LoginStatus" text NOT NULL,
    "LoginTime" timestamp with time zone NOT NULL,
    "LogoutTime" timestamp with time zone,
    "SsoProviderUsed" text NOT NULL,
    "DeviceInfo" text NOT NULL,
    "IpAddress" text NOT NULL,
    CONSTRAINT "PK_LoginActivities" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_LoginActivities_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE
);

CREATE TABLE "RefreshTokens" (
    "Id" uuid NOT NULL,
    "Token" text NOT NULL,
    "UserId" uuid NOT NULL,
    "ExpiresAt" timestamp with time zone NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "IsRevoked" boolean NOT NULL,
    CONSTRAINT "PK_RefreshTokens" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_RefreshTokens_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE
);

CREATE TABLE "CustomerChoices" (
    "Id" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "ConsultantId" uuid,
    "Description" text NOT NULL,
    "Priority" text NOT NULL,
    "Status" text NOT NULL,
    "ScheduledTime" timestamp with time zone,
    "SupportTypeId" uuid,
    "SupportCategoryId" uuid,
    "SupportSubOptionId" uuid,
    "SlotId" uuid,
    "CreatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_CustomerChoices" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_CustomerChoices_SupportCategories_SupportCategoryId" FOREIGN KEY ("SupportCategoryId") REFERENCES "SupportCategories" ("Id"),
    CONSTRAINT "FK_CustomerChoices_SupportSubOptions_SupportSubOptionId" FOREIGN KEY ("SupportSubOptionId") REFERENCES "SupportSubOptions" ("Id"),
    CONSTRAINT "FK_CustomerChoices_SupportTypes_SupportTypeId" FOREIGN KEY ("SupportTypeId") REFERENCES "SupportTypes" ("Id"),
    CONSTRAINT "FK_CustomerChoices_Users_ConsultantId" FOREIGN KEY ("ConsultantId") REFERENCES "Users" ("Id") ON DELETE SET NULL,
    CONSTRAINT "FK_CustomerChoices_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE RESTRICT
);

CREATE TABLE "ConsultantAvailabilitySlots" (
    "Id" uuid NOT NULL,
    "ConsultantId" uuid NOT NULL,
    "SlotStartTime" timestamp with time zone NOT NULL,
    "SlotEndTime" timestamp with time zone NOT NULL,
    "BookedByCustomerChoiceId" uuid,
    CONSTRAINT "PK_ConsultantAvailabilitySlots" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_ConsultantAvailabilitySlots_CustomerChoices_BookedByCustome~" FOREIGN KEY ("BookedByCustomerChoiceId") REFERENCES "CustomerChoices" ("Id") ON DELETE SET NULL,
    CONSTRAINT "FK_ConsultantAvailabilitySlots_Users_ConsultantId" FOREIGN KEY ("ConsultantId") REFERENCES "Users" ("Id") ON DELETE CASCADE
);

CREATE TABLE "Orders" (
    "Id" uuid NOT NULL,
    "CustomerChoiceId" uuid NOT NULL,
    "ConsultantId" uuid,
    "OrderNumber" text NOT NULL,
    "SupportTypeName" text NOT NULL,
    "SupportTypeId" uuid NOT NULL,
    "SupportCategoryId" uuid NOT NULL,
    "SupportSubOptionId" uuid,
    "Description" text NOT NULL,
    "SrIdentifier" text NOT NULL,
    "Priority" text NOT NULL,
    "TimeSlotId" uuid,
    "CreatedByUserId" uuid NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "Status" text NOT NULL,
    CONSTRAINT "PK_Orders" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Orders_ConsultantAvailabilitySlots_TimeSlotId" FOREIGN KEY ("TimeSlotId") REFERENCES "ConsultantAvailabilitySlots" ("Id") ON DELETE SET NULL,
    CONSTRAINT "FK_Orders_CustomerChoices_CustomerChoiceId" FOREIGN KEY ("CustomerChoiceId") REFERENCES "CustomerChoices" ("Id") ON DELETE SET NULL,
    CONSTRAINT "FK_Orders_SupportCategories_SupportCategoryId" FOREIGN KEY ("SupportCategoryId") REFERENCES "SupportCategories" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_Orders_SupportSubOptions_SupportSubOptionId" FOREIGN KEY ("SupportSubOptionId") REFERENCES "SupportSubOptions" ("Id"),
    CONSTRAINT "FK_Orders_SupportTypes_SupportTypeId" FOREIGN KEY ("SupportTypeId") REFERENCES "SupportTypes" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_Orders_Users_ConsultantId" FOREIGN KEY ("ConsultantId") REFERENCES "Users" ("Id") ON DELETE SET NULL,
    CONSTRAINT "FK_Orders_Users_CreatedByUserId" FOREIGN KEY ("CreatedByUserId") REFERENCES "Users" ("Id") ON DELETE RESTRICT
);

CREATE TABLE "TicketRatings" (
    "Id" uuid NOT NULL,
    "OrderId" uuid NOT NULL,
    "RatedByUserId" uuid NOT NULL,
    "RatedUserId" uuid NOT NULL,
    "RatingForRole" text NOT NULL,
    "CommunicationProfessionalism" integer,
    "ResolutionQuality" integer,
    "ResponseTime" integer,
    "Comments" text,
    CONSTRAINT "PK_TicketRatings" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_TicketRatings_Orders_OrderId" FOREIGN KEY ("OrderId") REFERENCES "Orders" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_TicketRatings_Users_RatedByUserId" FOREIGN KEY ("RatedByUserId") REFERENCES "Users" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_TicketRatings_Users_RatedUserId" FOREIGN KEY ("RatedUserId") REFERENCES "Users" ("Id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "IX_ConsultantAvailabilitySlots_BookedByCustomerChoiceId" ON "ConsultantAvailabilitySlots" ("BookedByCustomerChoiceId");

CREATE INDEX "IX_ConsultantAvailabilitySlots_ConsultantId" ON "ConsultantAvailabilitySlots" ("ConsultantId");

CREATE INDEX "IX_CustomerChoices_ConsultantId" ON "CustomerChoices" ("ConsultantId");

CREATE INDEX "IX_CustomerChoices_SupportCategoryId" ON "CustomerChoices" ("SupportCategoryId");

CREATE INDEX "IX_CustomerChoices_SupportSubOptionId" ON "CustomerChoices" ("SupportSubOptionId");

CREATE INDEX "IX_CustomerChoices_SupportTypeId" ON "CustomerChoices" ("SupportTypeId");

CREATE INDEX "IX_CustomerChoices_UserId" ON "CustomerChoices" ("UserId");

CREATE INDEX "IX_LoginActivities_UserId" ON "LoginActivities" ("UserId");

CREATE INDEX "IX_Orders_ConsultantId" ON "Orders" ("ConsultantId");

CREATE INDEX "IX_Orders_CreatedByUserId" ON "Orders" ("CreatedByUserId");

CREATE INDEX "IX_Orders_CustomerChoiceId" ON "Orders" ("CustomerChoiceId");

CREATE INDEX "IX_Orders_SupportCategoryId" ON "Orders" ("SupportCategoryId");

CREATE INDEX "IX_Orders_SupportSubOptionId" ON "Orders" ("SupportSubOptionId");

CREATE INDEX "IX_Orders_SupportTypeId" ON "Orders" ("SupportTypeId");

CREATE INDEX "IX_Orders_TimeSlotId" ON "Orders" ("TimeSlotId");

CREATE INDEX "IX_RefreshTokens_UserId" ON "RefreshTokens" ("UserId");

CREATE INDEX "IX_SupportCategories_SupportTypeId" ON "SupportCategories" ("SupportTypeId");

CREATE INDEX "IX_SupportSubOptions_SupportTypeId" ON "SupportSubOptions" ("SupportTypeId");

CREATE INDEX "IX_TicketRatings_OrderId" ON "TicketRatings" ("OrderId");

CREATE INDEX "IX_TicketRatings_RatedByUserId" ON "TicketRatings" ("RatedByUserId");

CREATE INDEX "IX_TicketRatings_RatedUserId" ON "TicketRatings" ("RatedUserId");

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20250920184923_Initial', '9.0.9');

ALTER TABLE "Users" ADD "AccessFailedCount" integer NOT NULL DEFAULT 0;

ALTER TABLE "Users" ADD "ConcurrencyStamp" text;

ALTER TABLE "Users" ADD "EmailConfirmed" boolean NOT NULL DEFAULT FALSE;

ALTER TABLE "Users" ADD "LockoutEnabled" boolean NOT NULL DEFAULT FALSE;

ALTER TABLE "Users" ADD "LockoutEnd" timestamp with time zone;

ALTER TABLE "Users" ADD "NormalizedEmail" text;

ALTER TABLE "Users" ADD "NormalizedUserName" text;

ALTER TABLE "Users" ADD "PhoneNumber" text;

ALTER TABLE "Users" ADD "PhoneNumberConfirmed" boolean NOT NULL DEFAULT FALSE;

ALTER TABLE "Users" ADD "SecurityStamp" text;

ALTER TABLE "Users" ADD "TwoFactorEnabled" boolean NOT NULL DEFAULT FALSE;

ALTER TABLE "Users" ADD "UserName" text;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20250920195154_EnsureIdentityColumns', '9.0.9');

ALTER TABLE "Users" ALTER COLUMN "SsoProvider" DROP NOT NULL;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20250920200954_MakeSsoProviderNullable', '9.0.9');

CREATE TABLE "ServiceRequestIdentifiers" (
    "Id" uuid NOT NULL,
    "Identifier" character varying(50) NOT NULL,
    "Task" character varying(500) NOT NULL,
    "IsActive" boolean NOT NULL DEFAULT TRUE,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT (now()),
    "UpdatedAt" timestamp with time zone NOT NULL DEFAULT (now()),
    CONSTRAINT "PK_ServiceRequestIdentifiers" PRIMARY KEY ("Id")
);

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20250921084008_AddServiceRequestIdentifiers', '9.0.9');

ALTER TABLE "SupportSubOptions" ADD "RequiresSrIdentifier" boolean NOT NULL DEFAULT FALSE;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20250921085203_AddRequiresSrIdentifierToSubOptions', '9.0.9');

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20250921085311_AddRequiresSrIdentifierToSubOptions_v2', '9.0.9');

CREATE TABLE "Conversations" (
    "Id" uuid NOT NULL,
    "OrderId" uuid NOT NULL,
    "CustomerId" uuid NOT NULL,
    "ConsultantId" uuid,
    "Subject" character varying(200) NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "LastMessageAt" timestamp with time zone NOT NULL,
    "IsActive" boolean NOT NULL,
    CONSTRAINT "PK_Conversations" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Conversations_Orders_OrderId" FOREIGN KEY ("OrderId") REFERENCES "Orders" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_Conversations_Users_ConsultantId" FOREIGN KEY ("ConsultantId") REFERENCES "Users" ("Id") ON DELETE SET NULL,
    CONSTRAINT "FK_Conversations_Users_CustomerId" FOREIGN KEY ("CustomerId") REFERENCES "Users" ("Id") ON DELETE RESTRICT
);

CREATE TABLE "Messages" (
    "Id" uuid NOT NULL,
    "ConversationId" uuid NOT NULL,
    "SenderId" uuid NOT NULL,
    "Content" character varying(2000) NOT NULL,
    "MessageType" character varying(20) NOT NULL DEFAULT 'text',
    "SentAt" timestamp with time zone NOT NULL,
    "ReadAt" timestamp with time zone,
    "IsEdited" boolean NOT NULL,
    "EditedAt" timestamp with time zone,
    CONSTRAINT "PK_Messages" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Messages_Conversations_ConversationId" FOREIGN KEY ("ConversationId") REFERENCES "Conversations" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_Messages_Users_SenderId" FOREIGN KEY ("SenderId") REFERENCES "Users" ("Id") ON DELETE RESTRICT
);

CREATE TABLE "MessageAttachments" (
    "Id" uuid NOT NULL,
    "MessageId" uuid NOT NULL,
    "FileName" character varying(255) NOT NULL,
    "OriginalFileName" character varying(255) NOT NULL,
    "ContentType" character varying(100) NOT NULL,
    "FileSize" bigint NOT NULL,
    "FilePath" character varying(500) NOT NULL,
    "UploadedAt" timestamp with time zone NOT NULL,
    "UploadedByUserId" uuid NOT NULL,
    CONSTRAINT "PK_MessageAttachments" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_MessageAttachments_Messages_MessageId" FOREIGN KEY ("MessageId") REFERENCES "Messages" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_MessageAttachments_Users_UploadedByUserId" FOREIGN KEY ("UploadedByUserId") REFERENCES "Users" ("Id") ON DELETE RESTRICT
);

CREATE INDEX "IX_Conversations_ConsultantId" ON "Conversations" ("ConsultantId");

CREATE INDEX "IX_Conversations_CustomerId_ConsultantId" ON "Conversations" ("CustomerId", "ConsultantId");

CREATE INDEX "IX_Conversations_OrderId" ON "Conversations" ("OrderId");

CREATE INDEX "IX_MessageAttachments_MessageId" ON "MessageAttachments" ("MessageId");

CREATE INDEX "IX_MessageAttachments_UploadedByUserId" ON "MessageAttachments" ("UploadedByUserId");

CREATE INDEX "IX_Messages_ConversationId" ON "Messages" ("ConversationId");

CREATE INDEX "IX_Messages_SenderId" ON "Messages" ("SenderId");

CREATE INDEX "IX_Messages_SentAt" ON "Messages" ("SentAt");

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20250921170649_AddMessagingSystem', '9.0.9');

ALTER TABLE "Orders" RENAME COLUMN "Status" TO "StatusString";

ALTER TABLE "Orders" ADD "LastUpdated" timestamp with time zone;

ALTER TABLE "Orders" ADD "StatusId" integer NOT NULL DEFAULT 1;

CREATE TABLE "StatusMaster" (
    "Id" integer GENERATED BY DEFAULT AS IDENTITY,
    "StatusCode" character varying(50) NOT NULL,
    "StatusName" character varying(100) NOT NULL,
    "Description" character varying(500),
    "ColorCode" character varying(20),
    "IconCode" character varying(50),
    "SortOrder" integer NOT NULL,
    "IsActive" boolean NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    CONSTRAINT "PK_StatusMaster" PRIMARY KEY ("Id")
);

CREATE TABLE "StatusChangeLogs" (
    "Id" uuid NOT NULL,
    "OrderId" uuid NOT NULL,
    "FromStatusId" integer NOT NULL,
    "ToStatusId" integer NOT NULL,
    "ChangedByUserId" uuid NOT NULL,
    "Comment" character varying(1000),
    "IpAddress" character varying(45),
    "ChangedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_StatusChangeLogs" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_StatusChangeLogs_Orders_OrderId" FOREIGN KEY ("OrderId") REFERENCES "Orders" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_StatusChangeLogs_StatusMaster_FromStatusId" FOREIGN KEY ("FromStatusId") REFERENCES "StatusMaster" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_StatusChangeLogs_StatusMaster_ToStatusId" FOREIGN KEY ("ToStatusId") REFERENCES "StatusMaster" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_StatusChangeLogs_Users_ChangedByUserId" FOREIGN KEY ("ChangedByUserId") REFERENCES "Users" ("Id") ON DELETE RESTRICT
);

CREATE INDEX "IX_Orders_StatusId" ON "Orders" ("StatusId");

CREATE INDEX "IX_StatusChangeLogs_ChangedByUserId" ON "StatusChangeLogs" ("ChangedByUserId");

CREATE INDEX "IX_StatusChangeLogs_FromStatusId" ON "StatusChangeLogs" ("FromStatusId");

CREATE INDEX "IX_StatusChangeLogs_OrderId" ON "StatusChangeLogs" ("OrderId");

CREATE INDEX "IX_StatusChangeLogs_ToStatusId" ON "StatusChangeLogs" ("ToStatusId");

CREATE UNIQUE INDEX "IX_StatusMaster_StatusCode" ON "StatusMaster" ("StatusCode");

INSERT INTO "StatusMaster" ("Id", "StatusCode", "StatusName", "Description", "ColorCode", "IconCode", "SortOrder", "IsActive", "CreatedAt")
VALUES (1, 'New', 'New', 'Newly created support request', 'bg-blue-500', 'Clock', 1, TRUE, TIMESTAMPTZ '2025-10-02T08:23:55.458688Z');
INSERT INTO "StatusMaster" ("Id", "StatusCode", "StatusName", "Description", "ColorCode", "IconCode", "SortOrder", "IsActive", "CreatedAt")
VALUES (2, 'InProgress', 'In Progress', 'Support request is being worked on', 'bg-yellow-500', 'TrendingUp', 2, TRUE, TIMESTAMPTZ '2025-10-02T08:23:55.458689Z');
INSERT INTO "StatusMaster" ("Id", "StatusCode", "StatusName", "Description", "ColorCode", "IconCode", "SortOrder", "IsActive", "CreatedAt")
VALUES (3, 'PendingCustomerAction', 'Pending Customer', 'Waiting for customer response or action', 'bg-orange-500', 'AlertCircle', 3, TRUE, TIMESTAMPTZ '2025-10-02T08:23:55.458689Z');
INSERT INTO "StatusMaster" ("Id", "StatusCode", "StatusName", "Description", "ColorCode", "IconCode", "SortOrder", "IsActive", "CreatedAt")
VALUES (4, 'TopicClosed', 'Topic Closed', 'Support topic has been closed', 'bg-gray-500', 'CheckCircle', 4, TRUE, TIMESTAMPTZ '2025-10-02T08:23:55.458689Z');
INSERT INTO "StatusMaster" ("Id", "StatusCode", "StatusName", "Description", "ColorCode", "IconCode", "SortOrder", "IsActive", "CreatedAt")
VALUES (5, 'Closed', 'Closed', 'Support request has been completed and closed', 'bg-green-500', 'CheckCircle', 5, TRUE, TIMESTAMPTZ '2025-10-02T08:23:55.458689Z');
INSERT INTO "StatusMaster" ("Id", "StatusCode", "StatusName", "Description", "ColorCode", "IconCode", "SortOrder", "IsActive", "CreatedAt")
VALUES (6, 'ReOpened', 'Re-opened', 'Previously closed request has been re-opened', 'bg-purple-500', 'AlertCircle', 6, TRUE, TIMESTAMPTZ '2025-10-02T08:23:55.45869Z');


                UPDATE "Orders" SET "StatusId" = 
                    CASE "StatusString"
                        WHEN 'New' THEN 1
                        WHEN 'Open' THEN 1
                        WHEN 'InProgress' THEN 2
                        WHEN 'PendingCustomerAction' THEN 3
                        WHEN 'TopicClosed' THEN 4
                        WHEN 'Closed' THEN 5
                        WHEN 'ReOpened' THEN 6
                        ELSE 1
                    END;
            

ALTER TABLE "Orders" ADD CONSTRAINT "FK_Orders_StatusMaster_StatusId" FOREIGN KEY ("StatusId") REFERENCES "StatusMaster" ("Id") ON DELETE RESTRICT;

SELECT setval(
    pg_get_serial_sequence('"StatusMaster"', 'Id'),
    GREATEST(
        (SELECT MAX("Id") FROM "StatusMaster") + 1,
        nextval(pg_get_serial_sequence('"StatusMaster"', 'Id'))),
    false);

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20250923070115_AddStatusMasterAndStatusChangeLogTables', '9.0.9');

CREATE TABLE "SSOConfigurations" (
    "Id" uuid NOT NULL,
    "GoogleEnabled" boolean NOT NULL DEFAULT FALSE,
    "AppleEnabled" boolean NOT NULL DEFAULT FALSE,
    "SupabaseEnabled" boolean NOT NULL DEFAULT FALSE,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_SSOConfigurations" PRIMARY KEY ("Id")
);

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20250925113636_AddSSOConfiguration', '9.0.9');

ALTER TABLE "Users" ADD "HourlyRate" numeric;

ALTER TABLE "Orders" ADD "PaymentCompletedAt" timestamp with time zone;

ALTER TABLE "Orders" ADD "PaymentStatus" text NOT NULL DEFAULT '';

ALTER TABLE "Orders" ADD "RazorpayOrderId" text;

ALTER TABLE "Orders" ADD "RazorpayPaymentId" text;

ALTER TABLE "Orders" ADD "TotalAmount" numeric NOT NULL DEFAULT 0.0;

CREATE TABLE "OrderTimeSlots" (
    "Id" uuid NOT NULL,
    "OrderId" uuid NOT NULL,
    "TimeSlotId" uuid NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_OrderTimeSlots" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_OrderTimeSlots_ConsultantAvailabilitySlots_TimeSlotId" FOREIGN KEY ("TimeSlotId") REFERENCES "ConsultantAvailabilitySlots" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_OrderTimeSlots_Orders_OrderId" FOREIGN KEY ("OrderId") REFERENCES "Orders" ("Id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "IX_OrderTimeSlots_OrderId_TimeSlotId" ON "OrderTimeSlots" ("OrderId", "TimeSlotId");

CREATE INDEX "IX_OrderTimeSlots_TimeSlotId" ON "OrderTimeSlots" ("TimeSlotId");

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20250928054555_AddPaymentAndMultiSlotSupport', '9.0.9');

INSERT INTO "StatusMaster" ("Id", "StatusCode", "StatusName", "Description", "ColorCode", "IconCode", "SortOrder", "IsActive", "CreatedAt", "UpdatedAt")
VALUES (8, 'Paid', 'Paid', 'Payment has been completed successfully', 'bg-emerald-500', 'CheckCircle', 6, TRUE, TIMESTAMPTZ '2025-10-02T08:23:55.608627Z', TIMESTAMPTZ '2025-10-02T08:23:55.60863Z');

SELECT setval(
    pg_get_serial_sequence('"StatusMaster"', 'Id'),
    GREATEST(
        (SELECT MAX("Id") FROM "StatusMaster") + 1,
        nextval(pg_get_serial_sequence('"StatusMaster"', 'Id'))),
    false);

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20250928071117_AddPaidStatus', '9.0.9');

ALTER TABLE "SupportTypes" ADD "Description" text NOT NULL DEFAULT '';

ALTER TABLE "SupportSubOptions" ADD "Description" text NOT NULL DEFAULT '';

ALTER TABLE "SupportCategories" ADD "Description" text NOT NULL DEFAULT '';

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20250928122845_AddDescriptionToTaxonomyEntities', '9.0.9');

CREATE TABLE "ConsultantSkill" (
    "Id" uuid NOT NULL,
    "ConsultantId" uuid NOT NULL,
    "SupportTypeId" uuid NOT NULL,
    "SupportCategoryId" uuid,
    "SupportSubOptionId" uuid,
    "CreatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_ConsultantSkill" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_ConsultantSkill_SupportCategories_SupportCategoryId" FOREIGN KEY ("SupportCategoryId") REFERENCES "SupportCategories" ("Id"),
    CONSTRAINT "FK_ConsultantSkill_SupportSubOptions_SupportSubOptionId" FOREIGN KEY ("SupportSubOptionId") REFERENCES "SupportSubOptions" ("Id"),
    CONSTRAINT "FK_ConsultantSkill_SupportTypes_SupportTypeId" FOREIGN KEY ("SupportTypeId") REFERENCES "SupportTypes" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_ConsultantSkill_Users_ConsultantId" FOREIGN KEY ("ConsultantId") REFERENCES "Users" ("Id") ON DELETE CASCADE
);

CREATE INDEX "IX_ConsultantSkill_ConsultantId" ON "ConsultantSkill" ("ConsultantId");

CREATE INDEX "IX_ConsultantSkill_SupportCategoryId" ON "ConsultantSkill" ("SupportCategoryId");

CREATE INDEX "IX_ConsultantSkill_SupportSubOptionId" ON "ConsultantSkill" ("SupportSubOptionId");

CREATE INDEX "IX_ConsultantSkill_SupportTypeId" ON "ConsultantSkill" ("SupportTypeId");

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20250928141742_AddConsultantSkills', '9.0.9');

ALTER TABLE "ConsultantSkill" DROP CONSTRAINT "FK_ConsultantSkill_SupportCategories_SupportCategoryId";

ALTER TABLE "ConsultantSkill" DROP CONSTRAINT "FK_ConsultantSkill_SupportSubOptions_SupportSubOptionId";

ALTER TABLE "ConsultantSkill" DROP CONSTRAINT "FK_ConsultantSkill_SupportTypes_SupportTypeId";

DROP INDEX "IX_ConsultantSkill_ConsultantId";

ALTER TABLE "ConsultantSkill" ALTER COLUMN "CreatedAt" SET DEFAULT (NOW());

CREATE UNIQUE INDEX "IX_ConsultantSkill_ConsultantId_SupportTypeId_SupportCategoryI~" ON "ConsultantSkill" ("ConsultantId", "SupportTypeId", "SupportCategoryId", "SupportSubOptionId") WHERE "SupportCategoryId" IS NOT NULL OR "SupportSubOptionId" IS NOT NULL;

ALTER TABLE "ConsultantSkill" ADD CONSTRAINT "FK_ConsultantSkill_SupportCategories_SupportCategoryId" FOREIGN KEY ("SupportCategoryId") REFERENCES "SupportCategories" ("Id") ON DELETE RESTRICT;

ALTER TABLE "ConsultantSkill" ADD CONSTRAINT "FK_ConsultantSkill_SupportSubOptions_SupportSubOptionId" FOREIGN KEY ("SupportSubOptionId") REFERENCES "SupportSubOptions" ("Id") ON DELETE RESTRICT;

ALTER TABLE "ConsultantSkill" ADD CONSTRAINT "FK_ConsultantSkill_SupportTypes_SupportTypeId" FOREIGN KEY ("SupportTypeId") REFERENCES "SupportTypes" ("Id") ON DELETE RESTRICT;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20250928144439_FixConsultantSkillTableName', '9.0.9');

COMMIT;

