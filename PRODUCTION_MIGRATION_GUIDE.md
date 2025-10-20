# Production Database Migration Guide

This document outlines the database changes required for deploying your staged changes to production.

## Overview of Changes

Your staged changes implement a major improvement to the ticket numbering system:

1. **Old System**: Complex TicketNumberTemplates with configurable patterns
2. **New System**: Simplified, consistent ticket numbering with short codes

### New Ticket Number Format
```
SRBIL102500013
│││││││││││││└─ Sequence (5 digits): 00013  
││││││││││└─── MonthYear (4 digits): 1025 (October 2025)
│││││││││└──── Priority (1 char): L (Low), M (Medium), H (High), C (Critical), U (Urgent)
││││││└─────── SubOption (1-3 chars): L (Level 1), R (Request), I (Incident)
│││└────────── Category (1-3 chars): BI (Billing), D (Database), A (Application)
└─────────────── SupportType (2-5 chars): SR (Service Request), DB (Database), NW (Network)
```

## Migration Files

Execute these scripts in **exact order** in your production database:

### 1. `prod-migration-01-add-shortcodes.sql`
- Adds `ShortCode` columns to support taxonomy tables
- Populates short codes based on existing names
- Creates `TicketSequences` table for new numbering system
- Adds necessary indexes and constraints

### 2. `prod-migration-02-remove-templates.sql`
- Removes the `TicketNumberTemplates` table (legacy system)
- Cleans up old indexes and references
- Updates sequence counters based on existing tickets
- Adds performance optimizations

### 3. `prod-migration-03-data-quality.sql`
- Fixes status mapping inconsistencies
- Improves status colors for better UX
- Validates support taxonomy relationships
- Adds data quality constraints and indexes

## Pre-Migration Checklist

- [ ] **Backup Database**: Take a full backup before starting
- [ ] **Test in Staging**: Run all scripts in staging environment first
- [ ] **Application Downtime**: Plan for brief downtime during migration
- [ ] **Verify Dependencies**: Ensure no other systems depend on TicketNumberTemplates
- [ ] **Monitor Disk Space**: Migration adds indexes that require additional space

## Migration Steps

1. **Stop Application Services**
   ```bash
   # Stop your application to prevent new tickets during migration
   ```

2. **Execute Migrations**
   ```sql
   -- Execute in psql or your preferred PostgreSQL client
   \i prod-migration-01-add-shortcodes.sql
   \i prod-migration-02-remove-templates.sql  
   \i prod-migration-03-data-quality.sql
   ```

3. **Verify Migration**
   ```sql
   -- Check that all tables have correct structure
   \d "SupportTypes"
   \d "SupportCategories" 
   \d "SupportSubOptions"
   \d "TicketSequences"
   
   -- Verify no TicketNumberTemplates table exists
   \dt "*Templates*"
   
   -- Check data quality
   SELECT COUNT(*) FROM "SupportTypes" WHERE "ShortCode" IS NOT NULL;
   SELECT COUNT(*) FROM "SupportCategories" WHERE "ShortCode" IS NOT NULL;
   SELECT COUNT(*) FROM "SupportSubOptions" WHERE "ShortCode" IS NOT NULL;
   ```

4. **Deploy Application Code**
   - Deploy backend with `SimpleTicketNumberService`
   - Deploy frontend with updated ticket display logic
   - Restart application services

5. **Post-Migration Verification**
   - Create a test ticket to verify new numbering works
   - Check that existing tickets display correctly
   - Verify status updates work properly
   - Test ticket search and filtering

## Rollback Plan

If issues occur, use `prod-migration-rollback.sql`:

```sql
-- Execute rollback in reverse order if needed
\i prod-migration-rollback.sql
```

**⚠️ Warning**: Rollback will lose ShortCode data and any tickets created with new system.

## Expected Benefits

- **Consistent Numbering**: All tickets follow same format
- **Better Performance**: Simplified sequence generation
- **Improved UX**: Cleaner ticket display with short codes
- **Easier Maintenance**: No complex template configuration needed

## Support Taxonomy Short Codes

The migration will automatically assign short codes based on existing names:

### Support Types
- SAP RISE → `SR`
- SAP Grow → `SG` 
- Database → `DB`
- Network → `NW`
- Migration → `MG`
- On-Prem → `OP`

### Categories  
- BASIS → `B`
- Database/DB → `D`
- OS/Operating → `O`
- Network → `N`
- Application → `A`
- Performance → `P`
- Security → `S`
- Billing → `BI`

### Sub-Options
- Incident → `I`
- Service Request/SR → `R`
- Change → `C`
- Problem → `P`
- Level 1/L1 → `L1`
- Level 2/L2 → `L2`
- Level 3/L3 → `L3`

## Monitoring After Migration

- **Ticket Creation**: Monitor that new tickets get proper numbers
- **Sequence Counters**: Check `TicketSequences` table for proper increments
- **Performance**: Monitor query performance with new indexes
- **User Feedback**: Ensure users can find and identify tickets easily

## Troubleshooting

### Common Issues

1. **Migration Fails on Constraints**
   - Check for existing data that violates new constraints
   - Run data quality queries to identify issues

2. **Application Errors After Migration**
   - Verify new `ISimpleTicketNumberService` is properly registered
   - Check that frontend uses `orderNumber` instead of old identifiers

3. **Performance Issues**
   - Monitor index usage with `EXPLAIN ANALYZE`
   - Consider additional indexes based on query patterns

### Support Contacts

- **Database Issues**: DBA team
- **Application Issues**: Development team  
- **Rollback Decision**: Product owner + Technical lead

---

**Last Updated**: October 20, 2025
**Migration Version**: 1.0
**Estimated Duration**: 15-30 minutes (depending on data size)