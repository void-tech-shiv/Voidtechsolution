-- ==============================================================================
-- VOIDTECH SOLUTION — Incremental Migration: CRM Lead Management & Pipeline
-- Migration: 20261113000000_crm_lead_pipeline
-- Target Engine: PostgreSQL 14+ (Compatible with PostgreSQL 18.6)
-- Status: STAGED LOCAL (Awaiting Owner Production Authorization)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTEND EnquiryStatus ENUM
-- ------------------------------------------------------------------------------
ALTER TYPE "EnquiryStatus" ADD VALUE IF NOT EXISTS 'QUALIFIED';
ALTER TYPE "EnquiryStatus" ADD VALUE IF NOT EXISTS 'PROPOSAL_SENT';
ALTER TYPE "EnquiryStatus" ADD VALUE IF NOT EXISTS 'NEGOTIATION';
ALTER TYPE "EnquiryStatus" ADD VALUE IF NOT EXISTS 'WON';
ALTER TYPE "EnquiryStatus" ADD VALUE IF NOT EXISTS 'LOST';
ALTER TYPE "EnquiryStatus" ADD VALUE IF NOT EXISTS 'ON_HOLD';

-- ------------------------------------------------------------------------------
-- 2. MIGRATE EXISTING ENQUIRY STATUSES TO EXTENDED VALUES
-- ------------------------------------------------------------------------------
UPDATE "enquiries" SET "status" = 'QUALIFIED' WHERE "status"::text = 'IN_REVIEW';
UPDATE "enquiries" SET "status" = 'WON' WHERE "status"::text = 'CONVERTED';
UPDATE "enquiries" SET "status" = 'ON_HOLD' WHERE "status"::text = 'ARCHIVED';

-- ------------------------------------------------------------------------------
-- 3. EXTEND enquiries TABLE WITH CRM COLUMNS & RELATIONSHIPS
-- ------------------------------------------------------------------------------
ALTER TABLE "enquiries"
    ADD COLUMN IF NOT EXISTS "assignedAdminId" TEXT,
    ADD COLUMN IF NOT EXISTS "estimatedValueInr" INTEGER,
    ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'WEBSITE_CONTACT_FORM',
    ADD COLUMN IF NOT EXISTS "lastContactedAt" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "nextFollowUpAt" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "lostReason" TEXT;

-- Foreign key for assigned administrator
ALTER TABLE "enquiries"
    DROP CONSTRAINT IF EXISTS "enquiries_assignedAdminId_fkey",
    ADD CONSTRAINT "enquiries_assignedAdminId_fkey"
    FOREIGN KEY ("assignedAdminId") REFERENCES "admin_users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ------------------------------------------------------------------------------
-- 4. CREATE lead_notes TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "lead_notes" (
    "id" TEXT NOT NULL,
    "enquiryId" TEXT NOT NULL,
    "authorId" TEXT,
    "authorName" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_notes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "lead_notes_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "enquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "lead_notes_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- ------------------------------------------------------------------------------
-- 5. CREATE lead_follow_ups TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "lead_follow_ups" (
    "id" TEXT NOT NULL,
    "enquiryId" TEXT NOT NULL,
    "assignedToId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "completedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_follow_ups_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "lead_follow_ups_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "enquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "lead_follow_ups_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- ------------------------------------------------------------------------------
-- 6. CREATE lead_activities TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "lead_activities" (
    "id" TEXT NOT NULL,
    "enquiryId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "actorId" TEXT,
    "actorName" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_activities_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "lead_activities_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "enquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- ------------------------------------------------------------------------------
-- 7. CREATE lead_assignments TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "lead_assignments" (
    "id" TEXT NOT NULL,
    "enquiryId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "assignedById" TEXT,
    "assignedByName" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unassignedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,

    CONSTRAINT "lead_assignments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "lead_assignments_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "enquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "lead_assignments_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- ------------------------------------------------------------------------------
-- 8. CREATE admin_notifications TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "admin_notifications" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "enquiryId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_notifications_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "admin_notifications_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "admin_notifications_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "enquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- ------------------------------------------------------------------------------
-- 9. PERFORMANCE INDEXES & CONSTRAINTS
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS "enquiries_status_createdAt_idx" ON "enquiries"("status", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "enquiries_assignedAdminId_status_idx" ON "enquiries"("assignedAdminId", "status");
CREATE INDEX IF NOT EXISTS "enquiries_nextFollowUpAt_idx" ON "enquiries"("nextFollowUpAt");

CREATE INDEX IF NOT EXISTS "lead_notes_enquiryId_createdAt_idx" ON "lead_notes"("enquiryId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "lead_notes_authorId_idx" ON "lead_notes"("authorId");

CREATE INDEX IF NOT EXISTS "lead_follow_ups_enquiryId_idx" ON "lead_follow_ups"("enquiryId");
CREATE INDEX IF NOT EXISTS "lead_follow_ups_assignedToId_isCompleted_idx" ON "lead_follow_ups"("assignedToId", "isCompleted");
CREATE INDEX IF NOT EXISTS "lead_follow_ups_dueAt_isCompleted_idx" ON "lead_follow_ups"("dueAt", "isCompleted");

CREATE INDEX IF NOT EXISTS "lead_activities_enquiryId_createdAt_idx" ON "lead_activities"("enquiryId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "lead_activities_type_idx" ON "lead_activities"("type");

CREATE INDEX IF NOT EXISTS "lead_assignments_enquiryId_isActive_idx" ON "lead_assignments"("enquiryId", "isActive");
CREATE INDEX IF NOT EXISTS "lead_assignments_adminId_isActive_idx" ON "lead_assignments"("adminId", "isActive");
CREATE UNIQUE INDEX IF NOT EXISTS "lead_assignments_single_active_unique" ON "lead_assignments"("enquiryId") WHERE "isActive" = true;

CREATE INDEX IF NOT EXISTS "admin_notifications_recipientId_isRead_createdAt_idx" ON "admin_notifications"("recipientId", "isRead", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "admin_notifications_enquiryId_idx" ON "admin_notifications"("enquiryId");

-- ------------------------------------------------------------------------------
-- 10. BACKFILL LEGACY INTERNAL NOTES
-- ------------------------------------------------------------------------------
INSERT INTO "lead_notes" ("id", "enquiryId", "authorName", "content", "createdAt", "updatedAt")
SELECT 
    'legacy_note_' || "id",
    "id",
    'System (Legacy Migration)',
    "internalNotes",
    "updatedAt",
    "updatedAt"
FROM "enquiries"
WHERE "internalNotes" IS NOT NULL AND length(trim("internalNotes")) > 0
ON CONFLICT ("id") DO NOTHING;
