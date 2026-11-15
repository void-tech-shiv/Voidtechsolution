# DATABASE_MIGRATION_STATUS.md — Database Schema & Migration Audit
## VOIDTECH SOLUTION — Database State Reconciliation

**Current Status as of:** 2026-11-15  
**Configured Host:** `ep-little-credit-beuthfde.c-9.us-east-2.aws.neon.tech` (Pooler: `ep-little-credit-beuthfde-pooler.c-9.us-east-2.aws.neon.tech`)  
**Configured Database:** `neondb`  
**Engine:** PostgreSQL 18.7 (a21afb5) on aarch64-unknown-linux-gnu (Neon Cloud)  
**Neon Project ID:** `cool-term-97592889`  
**Neon Branch ID:** `br-little-bird-bejretq1`  
**Neon Endpoint ID:** `ep-little-credit-beuthfde`  
**Safety & Deployment Status:** **DEPLOYMENT COMPLETE & POST-DEPLOYMENT VERIFICATION AUDITED**

---

## 1. Executive Summary

This document serves as the canonical record of the database migration lifecycle for VOIDTECH SOLUTION, clearly distinguishing the pre-deployment discovery, the authorized deployment execution, and the post-deployment integrity verification.

---

## 2. Historical Pre-Deployment Audit (Discovery Phase)

Prior to authorized deployment, a read-only SQL audit revealed the root cause of local development `P2021` (missing tables) and `P2022` (missing columns) errors:
1. **Migration State:** The Neon database `_prisma_migrations` table contained only 1 applied migration (`20261112000000_init`). A historical failed attempt for `20261113000000_crm_lead_pipeline` dated `2026-11-14 22:12:16 UTC` was recorded with `finished_at = null` due to PostgreSQL error `55P04`.
2. **Missing Structures:** Tables `lead_notes`, `lead_follow_ups`, `lead_activities`, `lead_assignments`, `admin_notifications`, `content_items`, `content_revisions`, `page_sections`, `testimonials`, and `media_assets` were absent in Neon.
3. **Data Preservation:** All 12 baseline tables and their records were verified intact with zero data loss.

---

## 3. Authorized Deployment Execution (Option B Closure)

Following explicit owner authorization to execute Option B (direct deployment to primary Neon branch `br-little-bird-bejretq1` after pre-flight audit), the following sequence was executed:
1. **55P04 Root-Cause Fix:** PostgreSQL forbids using an enum value added via `ALTER TYPE ... ADD VALUE` within the same transaction block (SQLSTATE `55P04`). Because Prisma Migrate executes each `migration.sql` in an isolated transaction block (`BEGIN ... COMMIT`), the uncommitted `UPDATE ... SET status = 'WON'` was separated into forward migration `20261113010000_crm_status_mapping_correction`.
2. **Migration Reconciliation:** The failed `20261113000000` entry was resolved using Prisma's schema-engine resolution protocol.
3. **Prisma Migrate Deploy:** All pending migrations were applied:
   - `20261113000000_crm_lead_pipeline` (Applied & Finished)
   - `20261113010000_crm_status_mapping_correction` (Applied & Finished)
   - `20261114000000_admin_cms_foundation` (Applied & Finished)

---

## 4. Current Post-Deployment Table & Column Matrix

All 22 tables now exist and are fully synchronized in Neon `public` schema:

| Table Name | Neon Status | Purpose / Architecture |
|---|:---:|---|
| `_prisma_migrations` | Present (5 rows) | 100% applied: `init`, `add_admin_sessions`, `crm_lead_pipeline`, `crm_status_mapping_correction`, `admin_cms_foundation`. |
| `admin_users` | Present | Administrator RBAC accounts (SUPER_ADMIN invariant locked). |
| `admin_sessions` | Present | Dual-layer session tokens with precision (3) timestamps. |
| `services` | Present | Business catalog with `contentItemId` and `publishedAt` CMS linkages. |
| `pricing_packages` | Present | 10 approved INR pricing tiers with CMS linkages. |
| `portfolio_projects` | Present | Featured case studies with CMS linkages. |
| `faqs` | Present | Baseline FAQs with CMS linkages. |
| `enquiries` | Present | Inbound leads with all 6 CRM columns (`assignedAdminId`, `estimatedValueInr`, `source`, `lastContactedAt`, `nextFollowUpAt`, `lostReason`). |
| `site_settings` | Present | Key-value application settings. |
| `audit_logs` | Present | Immutable security event logging. |
| `email_deliveries` | Present | Transactional email delivery logs. |
| `otp_verifications` | Present | Cryptographic OTP verification tokens. |
| `lead_notes` | Present | CRM internal team notes and legacy note backfills. |
| `lead_follow_ups` | Present | CRM scheduled reminders and tasks. |
| `lead_activities` | Present | CRM chronological audit timeline. |
| `lead_assignments` | Present | CRM active ownership with single-active unique index. |
| `admin_notifications` | Present | In-app recipient-isolated admin notifications. |
| `content_items` | Present | Headless CMS entity container with published/working revision pointers. |
| `content_revisions` | Present | Immutable CMS revision snapshots with JSONB schema payload. |
| `page_sections` | Present | Dynamic page section content blocks. |
| `testimonials` | Present | Client testimonials with legal consent verification guards. |
| `media_assets` | Present | WebP media asset metadata pipeline. |

---

## 5. Forensic Clarifications & Technical Invariants

### 5.1 The `CLOSED` Status Truth
- `CLOSED` was **never** a registered PostgreSQL enum value in `EnquiryStatus`. The original enum defined in `20261112000000_init` strictly contained: `NEW`, `IN_REVIEW`, `CONTACTED`, `CONVERTED`, `ARCHIVED`.
- Because `"status"` was typed as `EnquiryStatus`, zero rows in `enquiries` could ever have had `status = 'CLOSED'`.
- The SQL statement `UPDATE "enquiries" SET "status" = 'ON_HOLD' WHERE "status"::text = 'CLOSED';` in `20261113010000` is a defensive no-op that matched and modified **0 rows**.
- External input normalization is handled strictly at the application boundary via `normalizeLegacyStatus()`, which maps incoming `"CLOSED"` strings to `"ON_HOLD"` (or `"LOST"` if a `lostReason` is present).

### 5.2 PostgreSQL Error 55P04 & Prisma Transaction Boundary
- **PostgreSQL Specification:** `ALTER TYPE ... ADD VALUE` cannot be used in expressions, updates, or defaults within the same transaction block that added it.
- **Prisma Migrate Specification:** Prisma Migrate wraps each `migration.sql` file in an isolated transaction block (`BEGIN ... COMMIT`).
- Separating the enum DDL into `20261113000000` and the status updates into `20261113010000` guarantees that the enum additions commit before the status updates execute, eliminating `55P04` completely.

### 5.3 Applied Migration File Immutability
- Prisma Migrate calculates a SHA-256 checksum of each migration file upon application and records it in `_prisma_migrations.checksum`.
- Altering applied migration files on disk (even comments or whitespace) modifies their SHA-256 checksum, causing `prisma migrate status` to fail with error `P3007`. Applied migration files must remain immutable on disk.

