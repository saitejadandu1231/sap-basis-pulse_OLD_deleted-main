-- Check for orders and their statuses
SELECT o."Id", o."OrderNumber", o."StatusString", o."CreatedAt", o."LastUpdated"
FROM "Orders" o
ORDER BY o."CreatedAt" DESC
LIMIT 10;

-- Check for payments and their statuses
SELECT p."Id", p."OrderId", p."Status", p."IsInEscrow", p."AmountInPaise", p."CreatedAt"
FROM "Payments" p
ORDER BY p."CreatedAt" DESC
LIMIT 10;

-- Check for payments ready for release
SELECT p."Id", p."OrderId", p."Status", p."IsInEscrow", p."EscrowReleaseCondition"
FROM "Payments" p
WHERE p."Status" = 8; -- EscrowReadyForRelease