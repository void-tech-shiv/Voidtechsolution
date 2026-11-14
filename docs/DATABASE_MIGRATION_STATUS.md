# DATABASE_MIGRATION_STATUS.md — Database Schema & Migration Audit
## VOIDTECH SOLUTION — Database State Reconciliation

**Current Status as of:** 2026-11-15  
**Configured Host:** `ep-little-credit-beuthfde.c-9.us-east-2.aws.neon.tech` (Pooler: `ep-little-credit-beuthfde-pooler.c-9.us-east-2.aws.neon.tech`)  
**Configured Database:** `neondb`  
**Engine:** PostgreSQL 18.7 (a21afb5) on aarch64-unknown-linux-gnu (Neon Cloud)  
**Neon Project ID:** `cool-term-97592889`  
**Neon Branch ID:** `br-little-bird-bejretq1`  
**Neon Endpoint ID:** `ep-little-credit-beuthfde`  
**Safety Status:** **MIGRATION AUDIT COMPLETE — AWAITING OWNER APPROVAL PRIOR TO EXECUTION**  

---

## 1. Executive Summary

A comprehensive read-only SQL audit was conducted directly against the configured Neon PostgreSQL database to reconcile the schema against `prisma/schema.prisma` and resolve the root cause of the development runtime errors (`P2021` missing tables, `P2022` missing columns).

### Root Cause Analysis:
1. **Migration Discrepancy:**
   - The repository contains 5 migrations under `prisma/migrations/`.
   - The Neon database `_prisma_migrations` table contains only **1 applied migration**: `20261112000000_init`.
   - `admin_sessions` was created in Neon manually during Phase 7, but was never recorded in `_prisma_migrations`.
   - Subsequent migrations (`20261113000000_crm_lead_pipeline`, `20261113010000_crm_status_mapping_correction`, `20261114000000_admin_cms_foundation`) were developed and tested strictly against the isolated local test PostgreSQL instance (`voidtech_test_concurrency`) to satisfy the zero-production-contact rule.
   - Consequently, when `npm run dev` boots using `.env` pointing to Neon, Next.js encounters missing CRM/CMS tables and columns.
2. **Data Preservation Status:**
   - All 12 existing tables and their records are intact in Neon:
     - `admin_users`: 1 record (`SUPER_ADMIN`)
     - `admin_sessions`: 4 active session records
     - `services`: 18 business catalog records
     - `pricing_packages`: 10 approved pricing tiers
     - `faqs`: 5 core FAQ records
     - `portfolio_projects`: 2 featured project records
     - `enquiries`: 4 lead intake records (all status `NEW`)
     - `site_settings`: 5 system configuration records
     - `audit_logs`: 49 audit event records
     - `email_deliveries`: 92 delivery tracking records
     - `otp_verifications`: 123 verification records
   - **Zero data loss has occurred.**

---

## 2. Table & Column Reconciliation Matrix

| Table Name | Neon Database Status | Record Count | Discrepancy / Action Required |
|---|:---:|:---:|---|
| `_prisma_migrations` | Present | 1 row | Missing records for migrations 2–5. |
| `admin_users` | Present | 1 row | Up to date with schema. |
| `admin_sessions` | Present | 4 rows | Schema matches `20261112000001_add_admin_sessions` 100%. Needs `prisma migrate resolve --applied`. |
| `services` | Present | 18 rows | Missing `contentItemId` (TEXT) and `publishedAt` (TIMESTAMP). |
| `pricing_packages` | Present | 10 rows | Missing `contentItemId` (TEXT) and `publishedAt` (TIMESTAMP). |
| `portfolio_projects` | Present | 2 rows | Missing `contentItemId` (TEXT) and `publishedAt` (TIMESTAMP). |
| `faqs` | Present | 5 rows | Missing `contentItemId` (TEXT) and `publishedAt` (TIMESTAMP). |
| `enquiries` | Present | 4 rows | Missing CRM columns (`assignedAdminId`, `estimatedValueInr`, `source`, `lastContactedAt`, `nextFollowUpAt`, `lostReason`) and `EnquiryStatus` enum values (`QUALIFIED`, `PROPOSAL_SENT`, `NEGOTIATION`, `WON`, `LOST`, `ON_HOLD`). |
| `site_settings` | Present | 5 rows | Up to date with schema. |
| `audit_logs` | Present | 49 rows | Up to date with schema. |
| `email_deliveries` | Present | 92 rows | Up to date with schema. |
| `otp_verifications` | Present | 123 rows | Up to date with schema. |
| `lead_notes` | **Missing** | 0 rows | Defined in `20261113000000_crm_lead_pipeline`. Needs creation. |
| `lead_follow_ups` | **Missing** | 0 rows | Defined in `20261113000000_crm_lead_pipeline`. Needs creation. |
| `lead_activities` | **Missing** | 0 rows | Defined in `20261113000000_crm_lead_pipeline`. Needs creation. |
| `lead_assignments` | **Missing** | 0 rows | Defined in `20261113000000_crm_lead_pipeline`. Needs creation. |
| `admin_notifications` | **Missing** | 0 rows | Defined in `20261113000000_crm_lead_pipeline`. Needs creation. |
| `content_items` | **Missing** | 0 rows | Defined in `20261114000000_admin_cms_foundation`. Needs creation. |
| `content_revisions` | **Missing** | 0 rows | Defined in `20261114000000_admin_cms_foundation`. Needs creation. |
| `page_sections` | **Missing** | 0 rows | Defined in `20261114000000_admin_cms_foundation`. Needs creation. |
| `testimonials` | **Missing** | 0 rows | Defined in `20261114000000_admin_cms_foundation`. Needs creation. |
| `media_assets` | **Missing** | 0 rows | Defined in `20261114000000_admin_cms_foundation`. Needs creation. |

---

## 3. Ordered Safe Migration Repair Plan

To repair the Neon database without data loss, downtime, or constraint failures, the following exact 4-step sequence has been formulated:

### Step 1: Reconcile `admin_sessions` Migration Record
Because `admin_sessions` was already created in Neon with the exact schema matching `20261112000001_add_admin_sessions`, attempting to replay `CREATE TABLE "admin_sessions"` will fail with a duplicate table error.
- **Action:** Mark the migration as resolved:
  ```bash
  npx prisma migrate resolve --applied 20261112000001_add_admin_sessions
  ```
- **Risk:** Zero risk. Does not alter table structures or data; inserts the tracking row into `_prisma_migrations`.

### Step 2: Apply CRM Lead Pipeline Migration (`20261113000000_crm_lead_pipeline`)
- **Schema Additions:**
  - `ALTER TYPE "EnquiryStatus" ADD VALUE IF NOT EXISTS 'QUALIFIED' / 'PROPOSAL_SENT' / 'NEGOTIATION' / 'WON' / 'LOST' / 'ON_HOLD'`.
  - Add CRM columns to `enquiries` (`assignedAdminId`, `estimatedValueInr`, `source`, `lastContactedAt`, `nextFollowUpAt`, `lostReason`).
  - Add FK `enquiries_assignedAdminId_fkey` (`ON DELETE SET NULL`).
  - Create tables: `lead_notes`, `lead_follow_ups`, `lead_activities`, `lead_assignments`, `admin_notifications`.
  - Create partial unique index `lead_assignments_single_active_unique` on `(enquiryId) WHERE isActive = true`.
- **Data Safety:** All 4 existing enquiries remain intact (status `NEW`).

### Step 3: Apply CRM Status Mapping Correction (`20261113010000_crm_status_mapping_correction`)
- **Schema Updates:**
  - Safely normalizes any legacy statuses to `CONTACTED` or `ON_HOLD`.
- **Data Safety:** Non-destructive update queries.

### Step 4: Apply Headless Admin CMS Foundation Migration (`20261114000000_admin_cms_foundation`)
- **Schema Additions:**
  - Create enums: `ContentType`, `ContentPublicationStatus`, `RevisionLifecycleStatus`, `TestimonialVerificationStatus`, `ClientConsentStatus`, `StorageProviderType`.
  - Add `contentItemId` (TEXT nullable) and `publishedAt` (TIMESTAMP nullable) to `services`, `pricing_packages`, `portfolio_projects`, and `faqs`.
  - Create tables: `content_items`, `content_revisions`, `page_sections`, `testimonials`, `media_assets`.
  - Create triggers: `verify_revision_ownership` and `protect_published_revisions`.
- **Data Safety:** Purely additive. Existing catalog records remain untouched with `contentItemId = NULL`, enabling seamless fallback or progressive promotion.

---

## 4. Database Safety Gate & Dedicated Development Branch Strategy

Per the project instructions:
> "Do NOT modify the primary Neon branch `br-little-bird-bejretq1`. Prepare a safe Neon development migration workflow."

- **Primary Branch Protection:** Primary branch `br-little-bird-bejretq1` remains completely untouched and isolated.
- **Dedicated Dev Branch Workflow:** Full plans and runbooks have been authored:
  1. [NEON_DEVELOPMENT_BRANCH_PLAN.md](file:///d:/voidtechsolution/docs/NEON_DEVELOPMENT_BRANCH_PLAN.md): Step-by-step console guide to provision the `development` branch off `br-little-bird-bejretq1`.
  2. [NEON_MIGRATION_SQL_REVIEW.md](file:///d:/voidtechsolution/docs/NEON_MIGRATION_SQL_REVIEW.md): In-depth SQL audit of all 4 staged migrations.
  3. [NEON_MIGRATION_EXECUTION_PLAN.md](file:///d:/voidtechsolution/docs/NEON_MIGRATION_EXECUTION_PLAN.md): Complete step-by-step execution, verification, and instant rollback runbook.
- **Current State:** Awaiting owner branch creation and approval before running `prisma migrate resolve` and `prisma migrate deploy` against the new development branch.

