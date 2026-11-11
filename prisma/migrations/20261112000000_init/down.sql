-- ==============================================================================
-- VOIDTECH SOLUTION — Initial Schema Rollback
-- Migration Rollback: 20261112000000_init down
-- Status: PROPOSED ONLY (Reversible DDL)
-- ==============================================================================

-- Drop Tables in reverse dependency order
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

-- Drop Custom Enums
DROP TYPE IF EXISTS "EmailDeliveryStatus" CASCADE;
DROP TYPE IF EXISTS "OtpPurpose" CASCADE;
DROP TYPE IF EXISTS "UserRole" CASCADE;
DROP TYPE IF EXISTS "ServiceCategory" CASCADE;
DROP TYPE IF EXISTS "EnquiryStatus" CASCADE;
