-- Add Paid status to StatusMaster table if it doesn't exist
INSERT INTO "StatusMaster" ("StatusCode", "StatusName", "Description", "ColorCode", "IconCode", "SortOrder", "IsActive", "CreatedAt", "UpdatedAt")
SELECT 'Paid', 'Paid', 'Payment has been completed successfully', 'bg-emerald-500', 'CheckCircle', 6, true, now() at time zone 'utc', now() at time zone 'utc'
WHERE NOT EXISTS (SELECT 1 FROM "StatusMaster" WHERE "StatusCode" = 'Paid');

-- Verify the Paid status was added
SELECT 'Paid status added/verified' as status, COUNT(*) as paid_status_count
FROM "StatusMaster"
WHERE "StatusCode" = 'Paid';