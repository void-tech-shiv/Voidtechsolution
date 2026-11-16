-- ==============================================================================
-- VOIDTECH SOLUTION — Rollback Migration: 20261114000000_admin_cms_foundation (down.sql)
-- Milestone: Phase 10.1 (CMS Database Schema & Content Repositories)
-- Target: PostgreSQL
-- Description: Completely reverses 20261114000000_admin_cms_foundation
-- ==============================================================================

-- Drop triggers and trigger functions
DROP TRIGGER IF EXISTS trg_protect_revision_immutability ON "content_revisions";
DROP FUNCTION IF EXISTS protect_revision_immutability();

DROP TRIGGER IF EXISTS trg_verify_revision_ownership ON "content_items";
DROP FUNCTION IF EXISTS verify_revision_ownership();

DROP TRIGGER IF EXISTS trg_protect_published_revisions ON "content_revisions";
DROP FUNCTION IF EXISTS protect_published_revisions();

-- Drop foreign keys referencing content_items and content_revisions
ALTER TABLE "content_items" DROP CONSTRAINT IF EXISTS "content_items_working_revision_ownership_fkey";
ALTER TABLE "content_items" DROP CONSTRAINT IF EXISTS "content_items_published_revision_ownership_fkey";
ALTER TABLE "content_revisions" DROP CONSTRAINT IF EXISTS "content_revisions_contentItemId_id_key";
DROP INDEX IF EXISTS "content_revisions_contentItemId_id_key";
ALTER TABLE "services" DROP CONSTRAINT IF EXISTS "services_contentItemId_fkey";
ALTER TABLE "portfolio_projects" DROP CONSTRAINT IF EXISTS "portfolio_projects_contentItemId_fkey";
ALTER TABLE "pricing_packages" DROP CONSTRAINT IF EXISTS "pricing_packages_contentItemId_fkey";
ALTER TABLE "faqs" DROP CONSTRAINT IF EXISTS "faqs_contentItemId_fkey";
ALTER TABLE "media_assets" DROP CONSTRAINT IF EXISTS "media_assets_uploaderId_fkey";
ALTER TABLE "testimonials" DROP CONSTRAINT IF EXISTS "testimonials_verifiedById_fkey";
ALTER TABLE "testimonials" DROP CONSTRAINT IF EXISTS "testimonials_contentItemId_fkey";
ALTER TABLE "page_sections" DROP CONSTRAINT IF EXISTS "page_sections_contentItemId_fkey";
ALTER TABLE "content_revisions" DROP CONSTRAINT IF EXISTS "content_revisions_authorId_fkey";
ALTER TABLE "content_revisions" DROP CONSTRAINT IF EXISTS "content_revisions_contentItemId_fkey";
ALTER TABLE "content_items" DROP CONSTRAINT IF EXISTS "content_items_currentWorkingRevisionId_fkey";
ALTER TABLE "content_items" DROP CONSTRAINT IF EXISTS "content_items_currentPublishedRevisionId_fkey";
ALTER TABLE "content_items" DROP CONSTRAINT IF EXISTS "content_items_publishedById_fkey";

-- Drop tables in dependency order
DROP TABLE IF EXISTS "media_assets";
DROP TABLE IF EXISTS "testimonials";
DROP TABLE IF EXISTS "page_sections";
DROP TABLE IF EXISTS "content_revisions";
DROP TABLE IF EXISTS "content_items";

-- Drop columns added to existing tables
ALTER TABLE "services" DROP COLUMN IF EXISTS "publishedAt", DROP COLUMN IF EXISTS "contentItemId";
ALTER TABLE "pricing_packages" DROP COLUMN IF EXISTS "publishedAt", DROP COLUMN IF EXISTS "contentItemId";
ALTER TABLE "portfolio_projects" DROP COLUMN IF EXISTS "publishedAt", DROP COLUMN IF EXISTS "contentItemId";
ALTER TABLE "faqs" DROP COLUMN IF EXISTS "publishedAt", DROP COLUMN IF EXISTS "contentItemId";

-- Drop custom enums
DROP TYPE IF EXISTS "StorageProviderType";
DROP TYPE IF EXISTS "ClientConsentStatus";
DROP TYPE IF EXISTS "TestimonialVerificationStatus";
DROP TYPE IF EXISTS "RevisionLifecycleStatus";
DROP TYPE IF EXISTS "ContentPublicationStatus";
DROP TYPE IF EXISTS "ContentType";

