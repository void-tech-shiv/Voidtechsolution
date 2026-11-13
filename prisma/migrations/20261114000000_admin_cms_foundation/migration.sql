-- ==============================================================================
-- VOIDTECH SOLUTION — Migration: 20261114000000_admin_cms_foundation
-- Milestone: Phase 10.1 (CMS Database Schema & Content Repositories)
-- Target: PostgreSQL
-- Description: Foundation schema for Headless Admin CMS (Approach C)
-- Includes: ContentItem, ContentRevision, PageSection, Testimonial, MediaAsset
-- Custom Features: verify_revision_ownership trigger & protect_published_revisions trigger
-- ==============================================================================

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('SERVICE', 'PRICING_PACKAGE', 'PORTFOLIO_PROJECT', 'FAQ', 'PAGE_SECTION', 'TESTIMONIAL');

-- CreateEnum
CREATE TYPE "ContentPublicationStatus" AS ENUM ('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RevisionLifecycleStatus" AS ENUM ('WORKING_DRAFT', 'PENDING_REVIEW', 'APPROVED', 'PUBLISHED_SNAPSHOT', 'SUPERSEDED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TestimonialVerificationStatus" AS ENUM ('UNVERIFIED', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ClientConsentStatus" AS ENUM ('PENDING', 'GRANTED', 'REVOKED');

-- CreateEnum
CREATE TYPE "StorageProviderType" AS ENUM ('LOCAL', 'R2');

-- AlterTable
ALTER TABLE "faqs" ADD COLUMN IF NOT EXISTS "contentItemId" TEXT,
ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "portfolio_projects" ADD COLUMN IF NOT EXISTS "contentItemId" TEXT,
ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "pricing_packages" ADD COLUMN IF NOT EXISTS "contentItemId" TEXT,
ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "contentItemId" TEXT,
ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3);

-- CreateTable: content_items
CREATE TABLE IF NOT EXISTS "content_items" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "contentType" "ContentType" NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "publicationStatus" "ContentPublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "currentPublishedRevisionId" TEXT,
    "currentWorkingRevisionId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "publishedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable: content_revisions
CREATE TABLE IF NOT EXISTS "content_revisions" (
    "id" TEXT NOT NULL,
    "contentItemId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "revisionStatus" "RevisionLifecycleStatus" NOT NULL DEFAULT 'WORKING_DRAFT',
    "isPublishedSnapshot" BOOLEAN NOT NULL DEFAULT false,
    "title" TEXT NOT NULL,
    "snapshotData" JSONB NOT NULL,
    "authorId" TEXT,
    "authorName" TEXT NOT NULL,
    "changeSummary" TEXT,
    "rejectionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: page_sections
CREATE TABLE IF NOT EXISTS "page_sections" (
    "id" TEXT NOT NULL,
    "contentItemId" TEXT,
    "key" TEXT NOT NULL,
    "pageSlug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "mediaUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "page_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable: testimonials
CREATE TABLE IF NOT EXISTS "testimonials" (
    "id" TEXT NOT NULL,
    "contentItemId" TEXT,
    "clientName" TEXT NOT NULL,
    "clientRole" TEXT NOT NULL,
    "clientCompany" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "avatarUrl" TEXT,
    "projectSlug" TEXT,
    "verificationStatus" "TestimonialVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "clientConsentStatus" "ClientConsentStatus" NOT NULL DEFAULT 'PENDING',
    "clientConsentRecordedAt" TIMESTAMP(3),
    "consentEvidenceUrl" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id")
);

-- CreateTable: media_assets
CREATE TABLE IF NOT EXISTS "media_assets" (
    "id" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "provider" "StorageProviderType" NOT NULL DEFAULT 'LOCAL',
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "sha256Hash" TEXT NOT NULL,
    "isSvg" BOOLEAN NOT NULL DEFAULT false,
    "publicUrl" TEXT NOT NULL,
    "defaultAltText" TEXT NOT NULL,
    "caption" TEXT,
    "uploaderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- Indexes and Unique Constraints
CREATE UNIQUE INDEX IF NOT EXISTS "content_items_slug_key" ON "content_items"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "content_items_currentPublishedRevisionId_key" ON "content_items"("currentPublishedRevisionId");
CREATE UNIQUE INDEX IF NOT EXISTS "content_items_currentWorkingRevisionId_key" ON "content_items"("currentWorkingRevisionId");
CREATE INDEX IF NOT EXISTS "content_items_contentType_publicationStatus_idx" ON "content_items"("contentType", "publicationStatus");
CREATE INDEX IF NOT EXISTS "content_items_slug_idx" ON "content_items"("slug");

CREATE UNIQUE INDEX IF NOT EXISTS "content_revisions_contentItemId_versionNumber_key" ON "content_revisions"("contentItemId", "versionNumber");
CREATE INDEX IF NOT EXISTS "content_revisions_contentItemId_revisionStatus_idx" ON "content_revisions"("contentItemId", "revisionStatus");
CREATE INDEX IF NOT EXISTS "content_revisions_contentItemId_isPublishedSnapshot_idx" ON "content_revisions"("contentItemId", "isPublishedSnapshot");
CREATE INDEX IF NOT EXISTS "content_revisions_authorId_idx" ON "content_revisions"("authorId");

CREATE UNIQUE INDEX IF NOT EXISTS "page_sections_contentItemId_key" ON "page_sections"("contentItemId");
CREATE UNIQUE INDEX IF NOT EXISTS "page_sections_key_key" ON "page_sections"("key");
CREATE INDEX IF NOT EXISTS "page_sections_pageSlug_isActive_orderIndex_idx" ON "page_sections"("pageSlug", "isActive", "orderIndex");

CREATE UNIQUE INDEX IF NOT EXISTS "testimonials_contentItemId_key" ON "testimonials"("contentItemId");
CREATE INDEX IF NOT EXISTS "testimonials_verificationStatus_clientConsentStatus_isActive_idx" ON "testimonials"("verificationStatus", "clientConsentStatus", "isActive");
CREATE INDEX IF NOT EXISTS "testimonials_orderIndex_idx" ON "testimonials"("orderIndex");

CREATE UNIQUE INDEX IF NOT EXISTS "media_assets_storageKey_key" ON "media_assets"("storageKey");
CREATE INDEX IF NOT EXISTS "media_assets_sha256Hash_idx" ON "media_assets"("sha256Hash");
CREATE INDEX IF NOT EXISTS "media_assets_provider_storageKey_idx" ON "media_assets"("provider", "storageKey");
CREATE INDEX IF NOT EXISTS "media_assets_uploaderId_idx" ON "media_assets"("uploaderId");

CREATE UNIQUE INDEX IF NOT EXISTS "services_contentItemId_key" ON "services"("contentItemId");
CREATE UNIQUE INDEX IF NOT EXISTS "portfolio_projects_contentItemId_key" ON "portfolio_projects"("contentItemId");
CREATE UNIQUE INDEX IF NOT EXISTS "pricing_packages_contentItemId_key" ON "pricing_packages"("contentItemId");
CREATE UNIQUE INDEX IF NOT EXISTS "faqs_contentItemId_key" ON "faqs"("contentItemId");

-- AddForeignKeys with Explicit Delete Actions
ALTER TABLE "services" 
    ADD CONSTRAINT "services_contentItemId_fkey" 
    FOREIGN KEY ("contentItemId") REFERENCES "content_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "portfolio_projects" 
    ADD CONSTRAINT "portfolio_projects_contentItemId_fkey" 
    FOREIGN KEY ("contentItemId") REFERENCES "content_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "pricing_packages" 
    ADD CONSTRAINT "pricing_packages_contentItemId_fkey" 
    FOREIGN KEY ("contentItemId") REFERENCES "content_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "faqs" 
    ADD CONSTRAINT "faqs_contentItemId_fkey" 
    FOREIGN KEY ("contentItemId") REFERENCES "content_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "content_items" 
    ADD CONSTRAINT "content_items_publishedById_fkey" 
    FOREIGN KEY ("publishedById") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "content_items" 
    ADD CONSTRAINT "content_items_currentPublishedRevisionId_fkey" 
    FOREIGN KEY ("currentPublishedRevisionId") REFERENCES "content_revisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "content_items" 
    ADD CONSTRAINT "content_items_currentWorkingRevisionId_fkey" 
    FOREIGN KEY ("currentWorkingRevisionId") REFERENCES "content_revisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Published Revision Deletion Protection (Requirement 3.A: ON DELETE RESTRICT)
ALTER TABLE "content_revisions" 
    ADD CONSTRAINT "content_revisions_contentItemId_fkey" 
    FOREIGN KEY ("contentItemId") REFERENCES "content_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "content_revisions" 
    ADD CONSTRAINT "content_revisions_authorId_fkey" 
    FOREIGN KEY ("authorId") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "page_sections" 
    ADD CONSTRAINT "page_sections_contentItemId_fkey" 
    FOREIGN KEY ("contentItemId") REFERENCES "content_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "testimonials" 
    ADD CONSTRAINT "testimonials_contentItemId_fkey" 
    FOREIGN KEY ("contentItemId") REFERENCES "content_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "testimonials" 
    ADD CONSTRAINT "testimonials_verifiedById_fkey" 
    FOREIGN KEY ("verifiedById") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "media_assets" 
    ADD CONSTRAINT "media_assets_uploaderId_fkey" 
    FOREIGN KEY ("uploaderId") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ==============================================================================
-- CUSTOM POSTGRESQL FUNCTIONS & TRIGGERS (Database-Enforced Integrity)
-- ==============================================================================

-- 1. Enforce Cross-Item Revision Ownership (Requirement 3.B)
CREATE OR REPLACE FUNCTION verify_revision_ownership()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate currentPublishedRevisionId belongs to this ContentItem
  IF NEW."currentPublishedRevisionId" IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM content_revisions
      WHERE id = NEW."currentPublishedRevisionId"
        AND "contentItemId" = NEW.id
    ) THEN
      RAISE EXCEPTION 'Constraint violation: currentPublishedRevisionId (%) does not belong to ContentItem (%)',
        NEW."currentPublishedRevisionId", NEW.id
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  -- Validate currentWorkingRevisionId belongs to this ContentItem
  IF NEW."currentWorkingRevisionId" IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM content_revisions
      WHERE id = NEW."currentWorkingRevisionId"
        AND "contentItemId" = NEW.id
    ) THEN
      RAISE EXCEPTION 'Constraint violation: currentWorkingRevisionId (%) does not belong to ContentItem (%)',
        NEW."currentWorkingRevisionId", NEW.id
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_verify_revision_ownership ON content_items;
CREATE TRIGGER trg_verify_revision_ownership
BEFORE INSERT OR UPDATE OF "currentPublishedRevisionId", "currentWorkingRevisionId"
ON content_items
FOR EACH ROW
EXECUTE FUNCTION verify_revision_ownership();

-- 2. Enforce Published Revision Deletion Protection (Requirement 3.A)
CREATE OR REPLACE FUNCTION protect_published_revisions()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent deletion of any published snapshot milestone
  IF OLD."isPublishedSnapshot" = TRUE THEN
    RAISE EXCEPTION 'Illegal operation: Cannot delete published revision snapshot (id: %, version: %)',
      OLD.id, OLD."versionNumber"
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;

  -- Prevent deletion of any revision actively referenced by currentPublishedRevisionId
  IF EXISTS (
    SELECT 1 FROM content_items
    WHERE "currentPublishedRevisionId" = OLD.id
  ) THEN
    RAISE EXCEPTION 'Illegal operation: Cannot delete active published revision (id: %)',
      OLD.id
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_published_revisions ON content_revisions;
CREATE TRIGGER trg_protect_published_revisions
BEFORE DELETE ON content_revisions
FOR EACH ROW
EXECUTE FUNCTION protect_published_revisions();
