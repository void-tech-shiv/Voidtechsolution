# NEON_MIGRATION_ROLLBACK_MATRIX.md — Migration Rollback Classification & Safety Matrix
## VOIDTECH SOLUTION — Database Disaster Recovery & Data Preservation Governance

**Project:** VOIDTECH SOLUTION ("Build. Launch. Grow Online.")  
**Document:** Migration Rollback Safety Matrix  
**Target Database:** PostgreSQL 18.7 (Neon Serverless Cloud)  
**Safety Policy:** **CMS CONTENT & PRODUCTION DATA MUST NEVER BE SILENTLY DISCARDED**

---

## 1. Governance & Execution Policy

> [!CAUTION]
> **MIGRATION ROLLBACK SCRIPTS ARE DANGEROUS OPERATIONS.**
> Never execute a `down.sql` script against any database environment containing valuable user-generated content or live customer records without explicit, written system owner authorization.

### Operational Principles:
1. **CMS Content Invariant:** Editorial content, revision history, uploaded media assets, and verified testimonials are irreplaceable business assets. Rolling back schema by dropping tables is strictly prohibited when those tables hold business data.
2. **Forward Migration Preference:** In production and staging environments, schema defects or requirement changes MUST be addressed via forward-fix migrations (e.g. `ALTER TABLE`, `CREATE INDEX`, nullable adjustments), preserving existing rows.
3. **Branch Snapshot Preference (Neon):** In cloud development environments hosted on Neon, rolling back is achieved by deleting the development branch and recreating it from `br-little-bird-bejretq1` (<10 seconds). This eliminates complex manual down scripts and guarantees pristine state with zero production blast radius.

---

## 2. Migration Rollback Classification Matrix

Each migration in `prisma/migrations/` has been forensically classified into one of four safety tiers:

| Tier | Classification | Description | Permitted Environments |
|---|---|---|---|
| **Tier 1** | **Reversible Without Data Loss** | Non-destructive operations (e.g. index drops, nullable column additions). | Development, Staging, Production (with lock monitoring). |
| **Tier 2** | **Reversible Only When Tables Are Empty** | Dropping structures that have no live data, or rolling back immediately after zero-data deployment failure. | Ephemeral test pipelines, fresh pre-release branches. |
| **Tier 3** | **Destructive to User-Generated Data** | Cascading drops of tables or columns holding user, client, or CRM data. Permanently destroys records. | Ephemeral CI/CD teardown ONLY. Strictly prohibited in staging/prod. |
| **Tier 4** | **Irreversible / Requires Branch Recreation** | Data migrations or status mappings with non-invertible semantics. Reversing via SQL creates ambiguous data corruption. | Requires Neon branch recreation or Point-In-Time Restore (PITR). |

---

## 3. Comprehensive Migration-by-Migration Audit

### Migration 1: `20261112000000_init`

- **Direction:** Down (`prisma/migrations/20261112000000_init/down.sql`)
- **Safety Tier:** **TIER 3 — DESTRUCTIVE TO ALL APPLICATION DATA**
- **Operations:**
  - Cascading `DROP TABLE` across all 10 core tables:
    `email_deliveries`, `otp_verifications`, `audit_logs`, `site_settings`, `faqs`, `pricing_packages`, `admin_users`, `portfolio_projects`, `services`, `enquiries`.
  - Cascading `DROP TYPE` across 5 custom enums:
    `EmailDeliveryStatus`, `OtpPurpose`, `UserRole`, `ServiceCategory`, `EnquiryStatus`.
- **Data Loss Impact:**
  - **100% data loss.** All customer enquiries, admin credentials, audit histories, site settings, catalog offerings, and delivery records are permanently wiped.
- **Prerequisites:**
  - Full `pg_dump` backup snapshot must exist and be verified before execution.
- **Permitted Usage:**
  - Local test database resets and automated test teardown ONLY. **Strictly prohibited in Neon.**

---

### Migration 2: `20261112000001_add_admin_sessions`

- **Direction:** Down (`prisma/migrations/20261112000001_add_admin_sessions/down.sql`)
- **Safety Tier:** **TIER 2 — REVERSIBLE SESSION TEARDOWN (Zero Business Content Loss)**
- **Operations:**
  - `ALTER TABLE "admin_sessions" DROP CONSTRAINT "admin_sessions_userId_fkey";`
  - `DROP TABLE "admin_sessions" CASCADE;`
- **Data Loss Impact:**
  - Active admin session tokens (currently 4 rows in Neon) are deleted.
  - All logged-in administrators will be immediately logged out and forced to re-authenticate with their credentials and OTP.
  - **Zero impact** on client enquiries, catalog data, or CMS content.
- **Prerequisites:**
  - Scheduled maintenance window to avoid abrupt admin session invalidation.

---

### Migration 3: `20261113000000_crm_lead_pipeline`

- **Direction:** Down (`prisma/migrations/20261113000000_crm_lead_pipeline/down.sql`)
- **Safety Tier:** **TIER 3 — DESTRUCTIVE TO CRM USER-GENERATED DATA**
- **Operations:**
  - `DROP TABLE` across 5 CRM child tables:
    `admin_notifications`, `lead_assignments`, `lead_activities`, `lead_follow_ups`, `lead_notes`.
  - `ALTER TABLE "enquiries" DROP CONSTRAINT "enquiries_assignedAdminId_fkey";`
  - Drops 3 CRM indexes on `enquiries`.
  - Drops 6 extended columns from `enquiries`:
    `assignedAdminId`, `estimatedValueInr`, `source`, `lastContactedAt`, `nextFollowUpAt`, `lostReason`.
- **Data Loss Impact:**
  - **Core Enquiries Preserved:** Public customer submissions (`name`, `email`, `phone`, `companyName`, `message`, `serviceCategory`) remain intact in the `enquiries` table.
  - **CRM Data Destroyed:** All internal staff notes (`lead_notes`), follow-up schedules and reminders (`lead_follow_ups`), audit timeline records (`lead_activities`), team ownership records (`lead_assignments`), and notifications are permanently wiped.
- **Enum Reversal Limitation:**
  - PostgreSQL does not support `ALTER TYPE "EnquiryStatus" DROP VALUE`. Added enum values (`QUALIFIED`, `PROPOSAL_SENT`, `NEGOTIATION`, `WON`, `LOST`, `ON_HOLD`) remain in the database type catalog, but this is non-breaking.
- **Permitted Usage:**
  - Only when rolling back a fresh deployment where child CRM tables have 0 rows.

---

### Migration 4: `20261113010000_crm_status_mapping_correction`

- **Direction:** Down (`prisma/migrations/20261113010000_crm_status_mapping_correction/down.sql`)
- **Safety Tier:** **TIER 4 — IRREVERSIBLE / LOSSY STATUS ATTRIBUTION**
- **Operations:**
  - This migration is a data-only normalization script that updated:
    $$\text{IN\_REVIEW} \longrightarrow \text{CONTACTED}$$
    $$\text{ARCHIVED} \longrightarrow \text{ON\_HOLD}$$
- **Data Loss Impact:**
  - **Ambiguous Inversion Problem:** If a rollback script attempted to update `WHERE status = 'CONTACTED'` back to `'IN_REVIEW'`, it would unintentionally convert leads that were *originally* `CONTACTED` into `IN_REVIEW`.
  - Inverting data migrations with overlapping target states causes data corruption and loss of status attribution fidelity.
- **Recovery Requirement:**
  - Reversal cannot be achieved via SQL DDL/DML. If pre-normalization status must be restored, the database must be restored from a pre-migration snapshot, or the Neon branch must be recreated from parent.

---

### Migration 5: `20261114000000_admin_cms_foundation`

- **Direction:** Down (`prisma/migrations/20261114000000_admin_cms_foundation/down.sql`)
- **Safety Tier:** **TIER 3 — DESTRUCTIVE TO CMS EDITORIAL CONTENT**
- **Operations:**
  - Drops 3 triggers and functions:
    `trg_protect_revision_immutability`, `trg_verify_revision_ownership`, `trg_protect_published_revisions`.
  - Drops 15 foreign key constraints across domain and CMS tables.
  - Drops 5 CMS tables:
    `media_assets`, `testimonials`, `page_sections`, `content_revisions`, `content_items`.
  - Drops pointer columns (`contentItemId`, `publishedAt`) from:
    `services`, `pricing_packages`, `portfolio_projects`, `faqs`.
  - Drops 6 CMS enums:
    `StorageProviderType`, `ClientConsentStatus`, `TestimonialVerificationStatus`, `RevisionLifecycleStatus`, `ContentPublicationStatus`, `ContentType`.
- **Data Loss Impact:**
  - **Permanent Content Destruction:** All published snapshots, working drafts, revision history, uploaded media assets, client testimonials, and customized page sections are permanently destroyed.
  - Existing seed/domain records (`services`, `pricing_packages`, `portfolio_projects`, `faqs`) survive, but their CMS linkages are severed, reverting the site to static fallback data.
- **Permitted Usage:**
  - Automated test teardown ONLY. Strictly prohibited in staging/prod once content authoring has begun.

---

## 4. Operational Recovery Runbooks

### Runbook A: Neon Development Branch Reset (<10 Seconds — Recommended)
For any deployment failure, schema conflict, or migration experiment on a Neon development branch:
1. Open [Neon Console](https://console.neon.tech) -> Project `cool-term-97592889`.
2. Navigate to **Branches** -> Select `development`.
3. Click **Delete Branch**.
4. Click **Create Branch**:
   - **Name:** `development`
   - **Parent:** `br-little-bird-bejretq1`
5. The development environment is immediately reset to a pristine byte-level clone of production.
6. **Production Impact:** **ZERO**.

### Runbook B: Production Disaster Recovery (Point-in-Time Restore)
If production data corruption occurs:
1. Do NOT run `down.sql`.
2. In Neon Console -> Project `cool-term-97592889` -> Branches -> `br-little-bird-bejretq1`.
3. Select **Restore to a point in time (PITR)**.
4. Select the timestamp immediately preceding the migration deployment.
5. Create a new branch from that snapshot, verify data integrity, and switch connection strings.

### Runbook C: Non-Production Automated CI/CD Teardown
If running in an isolated test environment (e.g. `voidtech_test_concurrency` on `localhost:5432`):
```sql
-- Execute down scripts in reverse order
\i prisma/migrations/20261114000000_admin_cms_foundation/down.sql
\i prisma/migrations/20261113010000_crm_status_mapping_correction/down.sql
\i prisma/migrations/20261113000000_crm_lead_pipeline/down.sql
\i prisma/migrations/20261112000001_add_admin_sessions/down.sql
```
Verifies clean teardown of custom schemas.
