# NEON_MIGRATION_EXECUTION_PLAN.md — Migration Execution & Rollback Plan
## VOIDTECH SOLUTION — Neon Development Migration Runbook

**Project:** VOIDTECH SOLUTION  
**Target Environment:** Neon Dedicated Development Branch (`development`)  
**Parent Branch:** `br-little-bird-bejretq1` (Protected Primary)  
**Date:** 2026-11-15  
**Execution Objective:** Safely apply staged migrations 2–5 on the dedicated development branch, eliminate Prisma runtime errors, and verify local development stability.  
**Status:** **RUNBOOK STAGED — AWAITING OWNER BRANCH PROVISIONING & APPROVAL**  

---

## 1. Pre-Flight Checklist

Before running any migration command:
- [ ] Dedicated development branch created in Neon Console off `br-little-bird-bejretq1`.
- [ ] Direct and Pooled connection strings for the development branch obtained.
- [ ] Local `.env` updated with development branch credentials (`DATABASE_URL` and `DIRECT_URL`).
- [ ] Confirmed connection hostname contains the new development endpoint ID (NOT `ep-little-credit-beuthfde`).
- [ ] Confirmed port 3000 is not blocked.

---

## 2. Step-by-Step Execution Sequence

### Step 1: Pre-Migration Connection Verification
Test connectivity to the development branch without altering data:
```bash
npx prisma migrate status
```
*Expected Output:*
- Datasource targets the new development endpoint.
- Reports `Following migrations have not yet been applied: 20261112000001_add_admin_sessions, 20261113000000_crm_lead_pipeline, 20261113010000_crm_status_mapping_correction, 20261114000000_admin_cms_foundation`.

---

### Step 2: Reconcile `admin_sessions` Migration Record
Because `admin_sessions` was already created on the parent snapshot, mark it as applied in Prisma's tracking table:
```bash
npx prisma migrate resolve --applied 20261112000001_add_admin_sessions
```
*Verification:*
- Re-run `npx prisma migrate status`.
- `20261112000001_add_admin_sessions` will now appear under applied migrations.
- Only migrations 20261113000000, 20261113010000, and 20261114000000 remain pending.

---

### Step 3: Deploy Pending CRM & CMS Migrations
Execute the pending additive migrations:
```bash
npx prisma migrate deploy
```
*Execution Details:*
1. `20261113000000_crm_lead_pipeline` applies CRM tables and columns.
2. `20261113010000_crm_status_mapping_correction` normalizes status mappings.
3. `20261114000000_admin_cms_foundation` applies CMS tables, columns, and triggers.

*Expected Output:*
```
3 migrations found in prisma/migrations
Applying migration `20261113000000_crm_lead_pipeline`
Applying migration `20261113010000_crm_status_mapping_correction`
Applying migration `20261114000000_admin_cms_foundation`

All migrations have been successfully applied.
```

---

### Step 4: Post-Migration Schema Verification
Verify that all 22 expected tables exist and `_prisma_migrations` is clean:
```bash
npx prisma migrate status
```
*Expected Output:*
`Database schema is up to date!`

Execute a read-only table count:
```sql
SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
-- Expected: 22 tables
```

---

### Step 5: Runtime Application Verification
Start the Next.js development server:
```bash
npm run dev
```
Verify terminal output:
1. Boots cleanly in <2500ms.
2. **Zero `P2021` (table does not exist) errors.**
3. **Zero `P2022` (column does not exist) errors.**
4. Public routes (`/`, `/services`, `/pricing`, `/portfolio`, `/contact`) query the database without schema warnings.
5. Admin CRM (`/admin/crm`, `/admin/enquiries`) and CMS (`/admin/cms/sections`, `/admin/faqs`, `/admin/pricing`) render real database entities.

---

## 3. Comprehensive Rollback Strategy

Because development testing is conducted on a dedicated Neon branch, two distinct rollback mechanisms are available:

### Rollback Strategy A: Instant Cloud Branch Recreation (Recommended — <10 seconds)
If any migration step fails or produces unexpected behavior on the development branch:
1. Go to Neon Console -> Branches -> Select `development`.
2. Click **Delete Branch**.
3. Click **Create Branch** -> Name: `development` -> Parent: `br-little-bird-bejretq1`.
4. The development database is reset to a pristine snapshot in under 10 seconds.
5. **Impact on Primary Branch:** **ZERO**.

### Rollback Strategy B: Reversible Down Migrations (`down.sql`)
The repository includes pre-authored down migrations in `prisma/migrations/`:
1. `prisma/migrations/20261114000000_admin_cms_foundation/down.sql`:
   - Drops CMS triggers, helper functions, foreign keys, and tables (`media_assets`, `testimonials`, `page_sections`, `content_revisions`, `content_items`).
   - Removes pointer columns from `services`, `pricing_packages`, `portfolio_projects`, `faqs`.
   - Drops CMS enums.
2. `prisma/migrations/20261112000001_add_admin_sessions/down.sql`:
   - Drops `admin_sessions` table.

---

## 4. Environment Variable Changes Summary

To connect local development to the dedicated development branch:

| Variable | Current Value (Primary Branch) | Required Value (Development Branch) |
|---|---|---|
| `DATABASE_URL` | `postgresql://...ep-little-credit-beuthfde-pooler...` | `postgresql://...ep-<dev-endpoint>-pooler...` |
| `DIRECT_URL` | `postgresql://...ep-little-credit-beuthfde...` | `postgresql://...ep-<dev-endpoint>...` |

*(Note: Never expose actual usernames, passwords, or connection strings in documentation or Git commits).*

---

## 5. Decision Gate & Owner Action Required

1. **Owner Action 1:** Create `development` branch in Neon Console (Parent: `br-little-bird-bejretq1`).
2. **Owner Action 2:** Update local `.env` with the development branch connection strings.
3. **Owner Action 3:** Authorize the execution of Step 2 (`prisma migrate resolve`) and Step 3 (`prisma migrate deploy`).
