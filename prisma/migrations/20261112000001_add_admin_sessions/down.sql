-- ==============================================================================
-- VOIDTECH SOLUTION — Rollback: Drop AdminSession
-- Migration: 20261112000001_add_admin_sessions down
-- Status: REVERSIBLE TEARDOWN
-- ==============================================================================

ALTER TABLE IF EXISTS "admin_sessions" DROP CONSTRAINT IF EXISTS "admin_sessions_userId_fkey";

DROP TABLE IF EXISTS "admin_sessions" CASCADE;
