# Phase 6: Database Readiness Audit & Initial Schema Migration Proposal

**Document Version:** 2.0.0 (Post-Diagnostic Verification)  
**Target Environment:** Remote PostgreSQL Database  
**Diagnostic Date:** 2026-11-12  
**Status:** PROPOSED ONLY — Strictly Read-Only Investigation (Zero Remote Migrations Executed)

---

## 1. Executive Summary & Root Cause Diagnosis

### The Observed Failure: Contact Form "Database Service Interruption"
When attempting to submit a project enquiry on `/contact`, the application displayed:
> *"A network or service interruption occurred. All entered project data is preserved. Please click 'Retry Submission' or contact us at voidtechsolutionsupport@gmail.com."*

### Empirical Root Cause
Our live, read-only database diagnostic confirmed:
1. **Connectivity**: PostgreSQL connection is active, authenticated, and responsive.
   - Engine: `PostgreSQL 18.6 (ac70818) on aarch64-unknown-linux-gnu`
   - Harmless queries (`SELECT 1;`, `SELECT version();`, `SELECT schema_name FROM information_schema.schemata;`) execute with sub-millisecond response times.
2. **Schema State**:
   - Total tables in `public` schema: **0**
   - Total custom PostgreSQL enums: **0**
   - Migration history table (`_prisma_migrations`): **Does not exist**
   - Target table `public.enquiries`: **Does not exist**
3. **Execution Failure Mode**:
   - `EnquiriesRepo.createEnquiry()` calls `prisma.enquiry.create()`.
   - The remote PostgreSQL engine rejects the query with PostgreSQL error `42P01` (`relation "enquiries" does not exist`).
   - Prisma Client intercepts this and raises `PrismaClientKnownRequestError` with code `P2021` (`The table public.enquiries does not exist in the current database.`).
4. **Resilience & Safety Verification**:
   - `EnquiriesRepo.createEnquiry()` caught the `P2021` exception, logged a sanitized message to server logs, and re-threw a generic safe error without exposing connection strings or credentials.
   - `submitEnquiryAction` caught the error, aborted email notification dispatch, and returned `{ success: false, error: "Unable to record enquiry due to database service interruption." }`.
   - The user was **NEVER** shown a success confirmation, **NEVER** received a fake reference ID, and **NEVER** received an erroneous email notification.
   - All entered form fields (category, package, budget, timeline, message, name, email, phone, company, consent) were 100% preserved in the React component state.

---

## 2. Remote Database Schema vs Approved Prisma Schema

| Model Name | Target Table | Remote DB Status | Columns in Schema | Key Constraints |
|---|---|---|---|---|
| `Enquiry` | `public.enquiries` | **Missing (0 tables)** | 19 | PK (`id`), indexes on `status`, `email`, `createdAt`. `consentGiven` is nullable. |
| `Service` | `public.services` | **Missing (0 tables)** | 15 | PK (`id`), Unique (`slug`), indexes on `category`, `(isActive, orderIndex)`. |
| `PortfolioProject` | `public.portfolio_projects` | **Missing (0 tables)** | 17 | PK (`id`), Unique (`slug`), indexes on `(isFeatured, orderIndex)`, `projectType`. |
| `AdminUser` | `public.admin_users` | **Missing (0 tables)** | 9 | PK (`id`), Unique (`email`). |
| `PricingPackage` | `public.pricing_packages` | **Missing (0 tables)** | 13 | PK (`id`), Unique (`slug`), indexes on `(isActive, orderIndex)`, `category`. |
| `FAQ` | `public.faqs` | **Missing (0 tables)** | 8 | PK (`id`), indexes on `category`, `(isActive, orderIndex)`. |
| `SiteSetting` | `public.site_settings` | **Missing (0 tables)** | 5 | PK (`id`), Unique (`key`). |
| `AuditLog` | `public.audit_logs` | **Missing (0 tables)** | 10 | PK (`id`), indexes on `action`, `(entity, entityId)`, `actorId`, `createdAt`. |
| `OtpVerification` | `public.otp_verifications` | **Missing (0 tables)** | 12 | PK (`id`), indexes on `(identifier, purpose)`, `expiresAt`, `createdAt`. |
| `EmailDelivery` | `public.email_deliveries` | **Missing (0 tables)** | 12 | PK (`id`), indexes on `recipient`, `status`, `template`, `createdAt`. |

---

## 3. Custom Enums Required

The approved Prisma schema requires the following 5 custom PostgreSQL ENUM types:
1. `EnquiryStatus`: `'NEW'`, `'IN_REVIEW'`, `'CONTACTED'`, `'CONVERTED'`, `'ARCHIVED'`
2. `ServiceCategory`: `'WEB_DEVELOPMENT'`, `'MOBILE_DEVELOPMENT'`, `'API_BACKEND'`, `'AI_AUTOMATION'`, `'BOTS_AUTOMATION'`, `'DESIGN_CREATIVE'`, `'ENTERPRISE_SYSTEMS'`, `'FINTECH_PAYMENTS'`, `'CLOUD_HOSTING'`, `'OTHER'`
3. `UserRole`: `'SUPER_ADMIN'`, `'ADMIN'`, `'EDITOR'`
4. `OtpPurpose`: `'LOGIN'`, `'PASSWORD_RESET'`, `'ENQUIRY_VERIFICATION'`, `'ADMIN_ACTION'`
5. `EmailDeliveryStatus`: `'PENDING'`, `'SENT'`, `'FAILED'`

---

## 4. Complete Initial Migration Plan (`20261112000000_init`)

Because the remote database is completely empty, an incremental `ALTER TABLE` cannot run. A complete initial schema migration has been staged at:
[`prisma/migrations/20261112000000_init/migration.sql`](file:///d:/voidtechsolution/prisma/migrations/20261112000000_init/migration.sql)

### Privacy-Safe Consent Guarantee
```sql
CREATE TABLE "enquiries" (
    ...
    "consentGiven" BOOLEAN, -- Explicitly nullable; NULL preserves legacy records without false attribution
    ...
);
```
- Historical records instantiated without consent records remain `NULL` (no false attribution).
- All new submissions validated by `src/validations/enquiry.ts` strictly enforce `consentGiven === true`.

---

## 5. Rollback Plan (`down.sql`)

Staged at: [`prisma/migrations/20261112000000_init/down.sql`](file:///d:/voidtechsolution/prisma/migrations/20261112000000_init/down.sql)

```sql
-- Reversible DDL Execution
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

DROP TYPE IF EXISTS "EmailDeliveryStatus" CASCADE;
DROP TYPE IF EXISTS "OtpPurpose" CASCADE;
DROP TYPE IF EXISTS "UserRole" CASCADE;
DROP TYPE IF EXISTS "ServiceCategory" CASCADE;
DROP TYPE IF EXISTS "EnquiryStatus" CASCADE;
```

---

## 6. Seed Data Execution Plan

Following authorized execution of the initial migration, the database can be populated with baseline seed data by running `npm run db:seed`:
- **18 Agency Services** (with full deliverables, tech stacks, and starting INR prices)
- **10 Approved Pricing Packages** (Basic Static ₹999 to AI-Powered ₹59,999+)
- **5 Portfolio Projects** (with simulated benchmark metrics and Concept Lab tags)
- **5 Baseline FAQs** (including updated 50/50 payment terms and limited 30-day warranty)
- **Site Settings Key-Values** (defaulting to official support email `voidtechsolutionsupport@gmail.com`)

---

## 7. Strict Authorization Boundary

> **MANDATORY ENFORCEMENT:**
> In accordance with instructions, this investigation was **100% read-only**.
> Zero tables were created, zero DDL statements were executed against the remote PostgreSQL database, and zero emails were sent.
> The initial migration files and rollback scripts are prepared and verified locally, ready for deployment upon owner authorization.
