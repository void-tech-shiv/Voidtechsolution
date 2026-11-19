-- VOIDTECH SOLUTION 2.0 / Phase 3 — non-destructive agency workflow.
-- Run "prisma migrate deploy" on production before enabling the new pages.
-- Financial amounts are whole INR. Existing customer data is not changed.

CREATE TYPE "AgencyProposalStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED');
CREATE TYPE "AgencyProjectStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED');

CREATE TABLE "agency_proposals" (
  "id" TEXT NOT NULL,
  "enquiryId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "terms" TEXT NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "subtotalInr" INTEGER NOT NULL,
  "discountInr" INTEGER NOT NULL DEFAULT 0,
  "totalInr" INTEGER NOT NULL,
  "status" "AgencyProposalStatus" NOT NULL DEFAULT 'DRAFT',
  "validUntil" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "acceptedAt" TIMESTAMP(3),
  "rejectedAt" TIMESTAMP(3),
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "agency_proposals_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "agency_proposal_items" (
  "id" TEXT NOT NULL,
  "proposalId" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "unitPriceInr" INTEGER NOT NULL,
  "lineTotalInr" INTEGER NOT NULL,
  "orderIndex" INTEGER NOT NULL,
  CONSTRAINT "agency_proposal_items_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "agency_projects" (
  "id" TEXT NOT NULL,
  "proposalId" TEXT NOT NULL,
  "enquiryId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "status" "AgencyProjectStatus" NOT NULL DEFAULT 'PLANNED',
  "dueAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "agency_projects_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "agency_project_milestones" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "orderIndex" INTEGER NOT NULL,
  "isCompleted" BOOLEAN NOT NULL DEFAULT false,
  "completedAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "agency_project_milestones_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "agency_proposals_enquiryId_createdAt_idx" ON "agency_proposals"("enquiryId", "createdAt" DESC);
CREATE INDEX "agency_proposals_status_createdAt_idx" ON "agency_proposals"("status", "createdAt" DESC);
CREATE INDEX "agency_proposal_items_proposalId_orderIndex_idx" ON "agency_proposal_items"("proposalId", "orderIndex");
CREATE UNIQUE INDEX "agency_projects_proposalId_key" ON "agency_projects"("proposalId");
CREATE INDEX "agency_projects_enquiryId_createdAt_idx" ON "agency_projects"("enquiryId", "createdAt" DESC);
CREATE INDEX "agency_projects_status_dueAt_idx" ON "agency_projects"("status", "dueAt");
CREATE UNIQUE INDEX "agency_project_milestones_projectId_orderIndex_key" ON "agency_project_milestones"("projectId", "orderIndex");
CREATE INDEX "agency_project_milestones_projectId_isCompleted_idx" ON "agency_project_milestones"("projectId", "isCompleted");

ALTER TABLE "agency_proposals"
  ADD CONSTRAINT "agency_proposals_enquiryId_fkey"
  FOREIGN KEY ("enquiryId") REFERENCES "enquiries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agency_proposal_items"
  ADD CONSTRAINT "agency_proposal_items_proposalId_fkey"
  FOREIGN KEY ("proposalId") REFERENCES "agency_proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agency_projects"
  ADD CONSTRAINT "agency_projects_proposalId_fkey"
  FOREIGN KEY ("proposalId") REFERENCES "agency_proposals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agency_projects"
  ADD CONSTRAINT "agency_projects_enquiryId_fkey"
  FOREIGN KEY ("enquiryId") REFERENCES "enquiries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agency_project_milestones"
  ADD CONSTRAINT "agency_project_milestones_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "agency_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
