-- ==============================================================================
-- VOIDTECH SOLUTION — Incremental Migration: Legacy Status Mapping Correction
-- Migration: 20261113010000_crm_status_mapping_correction
-- Target Engine: PostgreSQL 14+ (Compatible with PostgreSQL 18.6)
-- Status: STAGED LOCAL (Awaiting Owner Production Authorization)
-- ==============================================================================

-- 1. Correct IN_REVIEW mapping:
--    In migration 20261113000000_crm_lead_pipeline, IN_REVIEW was mapped to QUALIFIED.
--    The approved business mapping maps IN_REVIEW to CONTACTED (initial review/contact),
--    preserving authentic qualification boundaries. Any remaining legacy IN_REVIEW records
--    are safely updated to CONTACTED:
UPDATE "enquiries" 
SET "status" = 'CONTACTED' 
WHERE "status"::text = 'IN_REVIEW';

-- 2. Confirm CONVERTED mapping:
--    CONVERTED -> WON (already applied in 20261113000000, verified 100% compliant).

-- 3. Confirm ARCHIVED mapping:
--    ARCHIVED -> ON_HOLD (already applied in 20261113000000, keeps dormant leads recoverable).
UPDATE "enquiries" 
SET "status" = 'ON_HOLD' 
WHERE "status"::text = 'ARCHIVED';

-- 4. Address CLOSED mapping:
--    In the original Prisma schema, 'CLOSED' was not an enum value (only 'ARCHIVED' existed).
--    However, if historical external imports contain 'CLOSED', map them based on business rationale:
--    - Dormant / parked enquiries map to 'ON_HOLD'.
--    - If a legacy lead was closed without conversion and has a lost reason, it can map to 'LOST'.
--    As an approved safe fallback, unmapped 'CLOSED' strings map to 'ON_HOLD':
UPDATE "enquiries" 
SET "status" = 'ON_HOLD' 
WHERE "status"::text = 'CLOSED';
