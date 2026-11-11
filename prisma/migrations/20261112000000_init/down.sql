-- ==============================================================================
-- VOIDTECH SOLUTION — EMERGENCY DESTRUCTIVE TEARDOWN PROCEDURE
-- Script: 20261112000000_init down.sql
-- Status: NON-PRODUCTION ONLY / EMERGENCY TEARDOWN ONLY
-- ==============================================================================
--
-- ⚠️ CRITICAL SAFETY NOTICE — DO NOT EXECUTE IN ROUTINE PRODUCTION ⚠️
--
-- 1. CLASSIFICATION:
--    This script is a DESTRUCTIVE TEARDOWN PROCEDURE. It is NOT a routine
--    production rollback mechanism.
--
-- 2. IMPACT:
--    Executing this script issues cascading DROP TABLE statements across all 10
--    application tables and 5 custom PostgreSQL ENUM types.
--    ALL DATA — including live client enquiries, audit logs, admin accounts,
--    site configurations, and service records — WILL BE PERMANENTLY DESTROYED.
--
-- 3. PROHIBITED USAGE:
--    ROUTINE PRODUCTION EXECUTION IS STRICTLY PROHIBITED.
--    Never execute this script against a database containing valuable or live
--    production data.
--
-- 4. PREFERRED PRODUCTION RECOVERY STRATEGIES:
--    A. FORWARD-FIX MIGRATION (Primary Strategy):
--       If a defect or constraint mismatch is discovered in production, author
--       an incremental corrective migration (e.g. ALTER TABLE, CREATE INDEX)
--       that fixes the issue without dropping tables or discarding data.
--    B. POINT-IN-TIME BACKUP RESTORATION (Disaster Recovery Strategy):
--       If database state or schema becomes corrupted, restore the database
--       from the verified pre-deployment pg_dump backup snapshot.
--
-- 5. PERMITTED USAGE:
--    This script may ONLY be used in:
--    - Ephemeral local development environments (e.g., reset test DB).
--    - Isolated automated CI/CD teardown pipelines.
--    - Emergency pre-release environments BEFORE any real customer or production
--      data exists, with explicit written authorization from the system owner.
--
-- ==============================================================================

-- Drop Tables in reverse dependency order (Destructive Cascade)
DROP TABLE IF EXISTS "email_deliveries" CASCADE;
DROP TABLE IF EXISTS "otp_verifications" CASCADE;
DROP TABLE IF EXISTS "audit_logs" CASCADE;
DROP TABLE IF EXISTS "site_settings" CASCADE;
DROP TABLE IF EXISTS "faqs" CASCADE;
DROP TABLE IF EXISTS "pricing_packages" CASCADE;
DROP TABLE IF EXISTS "admin_users" CASCADE;
DROP TABLE IF EXISTS "portfolio_projects" CASCADE;
DROP TABLE IF EXISTS "services" CASCADE;
DROP TABLE IF EXISTS "enquiries" CASCADE;

-- Drop Custom PostgreSQL Enums
DROP TYPE IF EXISTS "EmailDeliveryStatus" CASCADE;
DROP TYPE IF EXISTS "OtpPurpose" CASCADE;
DROP TYPE IF EXISTS "UserRole" CASCADE;
DROP TYPE IF EXISTS "ServiceCategory" CASCADE;
DROP TYPE IF EXISTS "EnquiryStatus" CASCADE;


