# Phase 6: Database Readiness Audit & Initial Schema Migration Proposal

**Document Version:** 2.1.0 (Post-Diagnostic Verification & Production Runbook)  
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

## 5. Emergency Teardown Procedure (`down.sql`) & Production Recovery

Staged at: [`prisma/migrations/20261112000000_init/down.sql`](file:///d:/voidtechsolution/prisma/migrations/20261112000000_init/down.sql)

### ⚠️ Destructive Teardown Classification & Safety Warning
- **Classification:** `down.sql` is an **Emergency Destructive Teardown Procedure**, NOT a routine production rollback mechanism.
- **Destructive Impact:** It issues cascading `DROP TABLE ... CASCADE` across all 10 application tables and `DROP TYPE ... CASCADE` across all 5 custom PostgreSQL enums.
- **Data Loss Warning:** Executing this against a live database permanently and irreversibly destroys all records, including customer enquiries, audit logs, admin users, and custom database configurations.
- **Strict Prohibition:** **Routine execution in production is STRICTLY PROHIBITED.**

### Preferred Production Recovery Strategies
1. **Forward-Fix Migration (Primary Strategy):**
   If a schema defect, column omission, or constraint mismatch is discovered in production, author an incremental forward migration (e.g., `ALTER TABLE`, `CREATE INDEX`, `ALTER COLUMN`) to resolve the issue without dropping tables or discarding live data.
2. **Point-in-Time Backup Restoration (Disaster Recovery Strategy):**
   If the database state or schema becomes corrupted, restore the database from the pre-deployment timestamped `pg_dump` backup snapshot taken before migration execution.

---

## 6. Seed Strategy & Overwrite Protection (`prisma/seed.ts`)

Following authorized execution of the initial migration, the database can be populated with baseline seed data by running `npm run db:seed`.

### Seed Protection Architecture
`prisma/seed.ts` implements a **Safe Initial-Seed Strategy** with non-destructive preservation:
- **Default Execution Mode (`SEED_FORCE_OVERWRITE` unset or `false`):**
  - Performs `findUnique` check on each record before creation.
  - If the record does not exist: creates the baseline record.
  - If the record **ALREADY exists**: preserves existing database record without modifying owner-customized titles, descriptions, pricing, deliverables, or settings.
  - Idempotent: repeated runs produce 0 duplicate errors and 0 data loss.
- **Controlled Synchronization Mode (`SEED_FORCE_OVERWRITE="true"`):**
  - Opt-in override: explicitly forces database records to re-synchronize with codebase static definitions.
- **Security Boundaries:**
  - `enquiries`: ZERO modifications (all customer enquiries preserved).
  - `admin_users`: ZERO modifications (strictly isolated to Phase 7).
  - `audit_logs`, `otp_verifications`, `email_deliveries`: ZERO modifications.

### Seed Baseline Quantities
- **18 Agency Services** (with full deliverables, tech stacks, and starting INR prices)
- **10 Approved Pricing Packages** (Basic Static ₹999 to AI-Powered ₹59,999+)
- **5 Baseline FAQs** (including approved 50/50 payment terms and limited 30-day warranty)
- **5 Baseline Site Settings** (defaulting to official support email `voidtechsolutionsupport@gmail.com`)
- **2 Portfolio Concepts** (Concept Lab Architecture Prototypes tagged `CONCEPT`)

---

## 7. Windows PowerShell Deployment Runbook

The deployment of the initial database schema is performed **strictly by the human database owner** using the runbook below:

### Step 1: Pre-Deployment Timestamped Backup (Mandatory)
```powershell
# 1. Define external backup directory (MUST be kept outside the project repository)
$BackupDir = "$HOME\voidtech-backups"
if (!(Test-Path -Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    Write-Host "Created external backup directory: $BackupDir" -ForegroundColor Cyan
}

# 2. Generate ISO 8601 timestamped filename
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = "$BackupDir\voidtech_backup_$Timestamp.sql"

# 3. Execute pg_dump using DIRECT_URL connection
Write-Host "Executing pre-deployment backup to: $BackupFile" -ForegroundColor Cyan
& pg_dump "$env:DIRECT_URL" --clean --if-exists --format=plain --file="$BackupFile"
$DumpExitCode = $LASTEXITCODE

# 4. Verify exit code
if ($DumpExitCode -ne 0) {
    Write-Error "CRITICAL: pg_dump failed with exit code $DumpExitCode. Aborting deployment."
    exit $DumpExitCode
}

# 5. Verify the backup file exists and is non-empty
if (Test-Path -Path $BackupFile) {
    $FileSize = (Get-Item -Path $BackupFile).Length
    if ($FileSize -gt 0) {
        Write-Host "SUCCESS: Backup verified ($FileSize bytes) at $BackupFile" -ForegroundColor Green
    } else {
        Write-Error "CRITICAL: Backup file was created but is 0 bytes! Check connection parameters."
        exit 1
    }
} else {
    Write-Error "CRITICAL: Backup file was not created!"
    exit 1
}
```

### Step 2: Deploy Initial Database Migration
```powershell
cmd.exe /c "npm run db:migrate:deploy"
```
*Expected Output:*
```
1 migration found in prisma/migrations
Applying migration `20261112000000_init`
The following migration have been applied:
- 20261112000000_init
All migrations have been successfully applied.
```

### Step 3: Populate Baseline Catalog Data (Safe Seed)
```powershell
cmd.exe /c "npm run db:seed"
```
*Expected Output:*
```
Mode:              SAFE INITIAL SEED (PRESERVE EXISTING)
Services:          18 created | 0 preserved | 0 updated
Site Settings:     5 created | 0 preserved | 0 updated
Pricing Packages:  10 created | 0 preserved | 0 updated
FAQs:              5 created | 0 preserved | 0 updated
Portfolio Concept: 2 created | 0 preserved | 0 updated
```

### Step 4: Run Automated Verification Script
```powershell
cmd.exe /c "npm run db:verify"
```
*Expected Output:*
- All 10 tables report `PASS`.
- `_prisma_migrations` reports `PASS` (Initial Migration applied).
- All 10 Prisma delegates report `PASS`.
- Seed counts: Services = 18, Packages = 10, FAQs = 5, Settings = 5, Portfolio Concepts = 2, Enquiries = 0, Admin = 0.
- Result: `✅ ALL DATABASE CHECKS PASSED.`

---

## 8. Strict Authorization Boundary

> **MANDATORY ENFORCEMENT:**
> In accordance with instructions, this investigation was **100% read-only**.
> Zero tables were created, zero DDL statements were executed against the remote PostgreSQL database, and zero emails were sent.
> The initial migration files, teardown scripts, verification suite, and runbooks are prepared and verified locally, ready for deployment upon owner authorization.
