
-- Place existing Paid payments into escrow
UPDATE "Payments" 
SET "IsInEscrow" = true, 
    "Status" = 7, -- InEscrow
    "EscrowInitiatedAt" = CURRENT_TIMESTAMP,
    "EscrowReleaseCondition" = 'ServiceCompleted'
WHERE "Status" = 1 -- Paid
  AND "IsInEscrow" = false;
