-- ==============================================================================
-- VOIDTECH SOLUTION — Rollback Migration: 20261113000000_crm_lead_pipeline (down.sql)
-- Milestone: Phase 9.1 (CRM Lead Pipeline Migration)
-- Target: PostgreSQL
-- Safety Classification: DESTRUCTIVE TO CRM USER-GENERATED DATA
-- ==============================================================================
--
-- ⚠️ SAFETY NOTICE:
-- Dropping CRM child tables will permanently delete all lead notes, follow-ups,
-- timeline activities, and assignments. Base enquiries (name, email, phone, message)
-- will be retained, but CRM metadata columns will be removed.
-- PostgreSQL enum values cannot be dropped without recreating the enum type.
--
-- ==============================================================================

-- 1. Drop CRM Child Tables in reverse dependency order
DROP TABLE IF EXISTS "admin_notifications" CASCADE;
DROP TABLE IF EXISTS "lead_assignments" CASCADE;
DROP TABLE IF EXISTS "lead_activities" CASCADE;
DROP TABLE IF EXISTS "lead_follow_ups" CASCADE;
DROP TABLE IF EXISTS "lead_notes" CASCADE;

-- 2. Drop CRM Foreign Key Constraints and Indexes on enquiries
ALTER TABLE "enquiries" DROP CONSTRAINT IF EXISTS "enquiries_assignedAdminId_fkey";
DROP INDEX IF EXISTS "enquiries_status_createdAt_idx";
DROP INDEX IF EXISTS "enquiries_assignedAdminId_status_idx";
DROP INDEX IF EXISTS "enquiries_nextFollowUpAt_idx";

-- 3. Drop CRM Extended Columns from enquiries
ALTER TABLE "enquiries"
    DROP COLUMN IF EXISTS "assignedAdminId",
    DROP COLUMN IF EXISTS "estimatedValueInr",
    DROP COLUMN IF EXISTS "source",
    DROP COLUMN IF EXISTS "lastContactedAt",
    DROP COLUMN IF EXISTS "nextFollowUpAt",
    DROP COLUMN IF EXISTS "lostReason";
