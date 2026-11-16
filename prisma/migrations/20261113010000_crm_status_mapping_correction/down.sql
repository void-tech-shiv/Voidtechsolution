-- ==============================================================================
-- VOIDTECH SOLUTION — Rollback Migration: 20261113010000_crm_status_mapping_correction (down.sql)
-- Milestone: Phase 9.1 (Legacy Status Mapping Correction)
-- Target: PostgreSQL
-- Safety Classification: IRREVERSIBLE / LOSSY STATUS ATTRIBUTION (Requires DB Snapshot / Branch Restore)
-- ==============================================================================
--
-- ⚠️ SAFETY NOTICE:
-- Migration 20261113010000 normalized legacy statuses (IN_REVIEW -> CONTACTED, ARCHIVED -> ON_HOLD).
-- Reversing this mapping via SQL is fundamentally lossy: one cannot deterministically distinguish
-- between enquiries originally created with status 'CONTACTED' versus those transitioned from 'IN_REVIEW'.
--
-- If exact pre-correction status state must be restored:
-- RESTORE FROM PRE-MIGRATION SNAPSHOT OR RECREATE NEON BRANCH FROM PARENT.
--
-- ==============================================================================

-- No-op safe stub: Data-only migrations with ambiguous inverse mappings cannot be safely reversed via DDL.
SELECT '20261113010000 down: Status normalization cannot be inverted deterministically. Use branch restore if reversal is required.' AS notice;
