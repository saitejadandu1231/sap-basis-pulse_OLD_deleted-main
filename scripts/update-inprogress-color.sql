-- Update In Progress status color to make it more distinctive
-- Change from bg-yellow-500 to bg-indigo-500 for better visibility

UPDATE "StatusMaster" 
SET "ColorCode" = 'bg-indigo-500', 
    "UpdatedAt" = now() at time zone 'utc'
WHERE "StatusCode" = 'InProgress';

-- Verify the update
SELECT "StatusCode", "StatusName", "ColorCode", "UpdatedAt"
FROM "StatusMaster" 
WHERE "StatusCode" = 'InProgress';

-- Show all status colors for reference
SELECT "StatusCode", "StatusName", "ColorCode", "SortOrder"
FROM "StatusMaster" 
WHERE "IsActive" = true
ORDER BY "SortOrder";