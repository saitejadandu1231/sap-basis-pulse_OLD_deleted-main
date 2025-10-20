-- Check current status mapping for tickets
SELECT 
    o.Id as OrderId,
    o.SrIdentifier,
    o.StatusId,
    o.StatusString,
    sm.StatusCode,
    sm.StatusName,
    sm.ColorCode
FROM "Orders" o
JOIN "StatusMaster" sm ON o.StatusId = sm.Id
WHERE o.StatusString != sm.StatusCode
ORDER BY o.CreatedAt DESC;

-- Fix any mismatched StatusString values to match StatusCode
UPDATE "Orders" 
SET "StatusString" = (
    SELECT sm.StatusCode 
    FROM "StatusMaster" sm 
    WHERE sm.Id = "Orders".StatusId
)
WHERE "StatusString" != (
    SELECT sm.StatusCode 
    FROM "StatusMaster" sm 
    WHERE sm.Id = "Orders".StatusId
);

-- Verify the fix
SELECT 'Fixed status mismatches' as message, COUNT(*) as tickets_updated
FROM "Orders" o
JOIN "StatusMaster" sm ON o.StatusId = sm.Id
WHERE o.StatusString = sm.StatusCode;