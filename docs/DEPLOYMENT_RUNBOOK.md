# Database Deployment & Operations Runbook

**Brand:** VOIDTECH SOLUTION  
**Tagline:** Build. Launch. Grow Online.  
**Version:** 1.0.0  
**Target Environment:** Remote PostgreSQL Database  

---

## 1. Overview & Operational Principles

This runbook provides the definitive, production-grade instructions for deploying the initial database schema, populating baseline catalog seed data, and validating system integrity for VOIDTECH SOLUTION.

### Key Safety Principles
1. **Human-In-The-Loop Execution:** All DDL and DML operations against the remote PostgreSQL database must be executed by the authorized human system owner. Autonomous coding agents maintain a strictly read-only posture.
2. **Mandatory Pre-Deployment Backup:** A full timestamped backup must be captured and verified before applying migrations. Backups must be stored **outside** the project repository.
3. **Seed Overwrite Protection:** Seeding is idempotent and non-destructive. Rerunning `npm run db:seed` will **never** overwrite owner-customized database content unless explicitly requested via `SEED_FORCE_OVERWRITE="true"`.
4. **Destructive Teardown vs Production Recovery:** The script `prisma/migrations/20261112000000_init/down.sql` is classified as an **Emergency Destructive Teardown Procedure**. Its routine execution in production is strictly prohibited. Production issues must be resolved via **Forward-Fix Migrations** or **Backup Restoration**.

---

## 2. Pre-Deployment: Mandatory Backup Procedure

Before applying any migration, take a complete snapshot of the database using `pg_dump`.

### Windows PowerShell Backup Script
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

# 3. Execute pg_dump using DIRECT_URL connection string
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

> [!IMPORTANT]
> Always retain backups in `$HOME\voidtech-backups` (or another secure location outside `D:\voidtechsolution`). Never move or store database backup `.sql` files inside the Git workspace to prevent accidental leakage of sensitive customer or system data.

---

## 3. Migration Deployment

Deploy the initial schema using Prisma's production migration runner:

```powershell
cmd.exe /c "npm run db:migrate:deploy"
```

### Expected Output
```
1 migration found in prisma/migrations
Applying migration `20261112000000_init`

The following migration have been applied:
- 20261112000000_init

All migrations have been successfully applied.
```

### What this creates:
- 10 Application Tables: `enquiries`, `services`, `portfolio_projects`, `admin_users`, `pricing_packages`, `faqs`, `site_settings`, `audit_logs`, `otp_verifications`, `email_deliveries`.
- 5 Custom Enums: `EnquiryStatus`, `ServiceCategory`, `UserRole`, `OtpPurpose`, `EmailDeliveryStatus`.
- 23 Performance & Security Indexes.
- 1 Migration Ledger: `_prisma_migrations`.

---

## 4. Baseline Data Seeding (Safe & Non-Destructive)

Populate the database with initial catalog offerings and configurations:

```powershell
cmd.exe /c "npm run db:seed"
```

### Protection & Idempotency Guarantee
- **Default Strategy:** Safe Initial Seed (`SEED_FORCE_OVERWRITE` is unset).
- **Existing Record Protection:** Every model performs a `findUnique` check first:
  - If missing: inserted with codebase defaults.
  - If existing: preserved intact. Any edits made by the owner in the database to service titles, descriptions, INR pricing, deliverables, package features, FAQs, or site settings are **never overwritten**.
- **Customer Enquiry Protection:** The `enquiries` table is untouched (0 modifications).
- **Administrator Isolation:** Default seeding strictly excludes administrator account creation to preserve the Phase 7 boundary.

### Expected Output
```
🌱 Starting VOIDTECH SOLUTION Database Seeding...
📋 Strategy: SAFE INITIAL SEED (Preserve Existing Records)

📦 Processing 18 business services...
✅ Services processed: 18 created, 0 preserved, 0 updated.

⚙️  Processing baseline site settings...
✅ Site settings processed: 5 created, 0 preserved, 0 updated.

💰 Processing 10 approved INR pricing packages...
✅ Pricing packages processed: 10 created, 0 preserved, 0 updated.

❓ Processing baseline FAQs...
✅ FAQs processed: 5 created, 0 preserved, 0 updated.

📁 Processing initial portfolio case studies (Internal Architecture Prototypes)...
✅ Portfolio case studies processed: 2 created, 0 preserved, 0 updated.

🛡️  Security Boundaries:
  • Customer Enquiries: ZERO modifications (all inbound customer records preserved).
  • Administrator Accounts: ZERO modifications (strictly isolated to Phase 7).
  • Audit Logs & OTP Records: ZERO modifications (live security records preserved).

================ SEED EXECUTION SUMMARY ================
Mode:              SAFE INITIAL SEED (PRESERVE EXISTING)
Services:          18 created | 0 preserved | 0 updated
Site Settings:     5 created | 0 preserved | 0 updated
Pricing Packages:  10 created | 0 preserved | 0 updated
FAQs:              5 created | 0 preserved | 0 updated
Portfolio Concept: 2 created | 0 preserved | 0 updated
========================================================
```

---

## 5. Automated Verification (`npm run db:verify`)

Run the automated verification suite to validate that all tables exist, migration history is recorded, Prisma delegates are functional, and record counts match expectations:

```powershell
cmd.exe /c "npm run db:verify"
```

### Expected Output Matrix
```
================================================================================
VERIFICATION MATRIX
================================================================================
Category             | Item                           | Expected         | Actual           | Status
-----------------------------------------------------------------------------------------------
1. Tables            | public.admin_users             | Present          | Present          | PASS
1. Tables            | public.audit_logs              | Present          | Present          | PASS
1. Tables            | public.email_deliveries        | Present          | Present          | PASS
1. Tables            | public.enquiries               | Present          | Present          | PASS
1. Tables            | public.faqs                    | Present          | Present          | PASS
1. Tables            | public.otp_verifications       | Present          | Present          | PASS
1. Tables            | public.portfolio_projects      | Present          | Present          | PASS
1. Tables            | public.pricing_packages        | Present          | Present          | PASS
1. Tables            | public.services                | Present          | Present          | PASS
1. Tables            | public.site_settings           | Present          | Present          | PASS
2. Migration Table   | public._prisma_migrations      | Present          | Present          | PASS
2. Migration History | Initial Migration (_init)      | Applied & Finished | 20261112000000_init (Steps: 1) | PASS
3. Prisma Delegates  | prisma.enquiry                 | Function (count) | Available        | PASS
3. Prisma Delegates  | prisma.service                 | Function (count) | Available        | PASS
3. Prisma Delegates  | prisma.portfolioProject        | Function (count) | Available        | PASS
3. Prisma Delegates  | prisma.adminUser               | Function (count) | Available        | PASS
3. Prisma Delegates  | prisma.pricingPackage          | Function (count) | Available        | PASS
3. Prisma Delegates  | prisma.fAQ                     | Function (count) | Available        | PASS
3. Prisma Delegates  | prisma.siteSetting             | Function (count) | Available        | PASS
3. Prisma Delegates  | prisma.auditLog                | Function (count) | Available        | PASS
3. Prisma Delegates  | prisma.otpVerification         | Function (count) | Available        | PASS
3. Prisma Delegates  | prisma.emailDelivery           | Function (count) | Available        | PASS
4. Seed Counts       | Business Services              | 18               | 18               | PASS
4. Seed Counts       | Pricing Packages (INR)         | 10               | 10               | PASS
4. Seed Counts       | Baseline FAQs                  | 5                | 5                | PASS
4. Seed Counts       | Site Settings                  | 5                | 5                | PASS
4. Seed Counts       | Portfolio Concepts (CONCEPT)   | 2                | 2                | PASS
4. Seed Counts       | Enquiries (Pre-test)           | 0                | 0                | PASS
4. Boundary Check    | Admin Users (Phase 7 Boundary) | 0                | 0                | PASS
================================================================================

✅ ALL DATABASE CHECKS PASSED.
```

---

## 6. Controlled Inbound Enquiry Verification

Once `npm run db:verify` passes:
1. Start the application locally:
   ```powershell
   cmd.exe /c "npm run dev"
   ```
2. Navigate to `http://localhost:3000/contact`.
3. Submit a controlled test enquiry:
   - **Service Category:** Web Application Development
   - **Name:** Deployment Verification Test
   - **Email:** `voidtechsolutionsupport@gmail.com`
   - **Message:** Controlled post-migration smoke test verification.
   - **Consent Checkbox:** Checked.
4. Verify results:
   - Green confirmation banner with generated tracking reference.
   - Form inputs reset.
   - Re-running `cmd.exe /c "npm run db:verify"` will report `prisma.enquiry.count() = 1` with `INFO` status.

---

## 7. Recovery Procedures: Teardown vs Forward-Fix

### Production Recovery (Recommended)
1. **Forward-Fix Migration (Preferred for Schema Defects):**
   - Create a new migration file: `prisma/migrations/<timestamp>_fix_description/migration.sql`.
   - Apply non-destructive alterations (`ALTER TABLE ... ADD COLUMN`, `CREATE INDEX ...`).
   - Run `npx prisma migrate deploy`.
2. **Point-In-Time Backup Restoration (Preferred for Disaster Recovery):**
   - In the event of catastrophic data corruption, restore from the verified external backup snapshot:
   ```powershell
   psql "$env:DIRECT_URL" -f "$HOME\voidtech-backups\voidtech_backup_<TIMESTAMP>.sql"
   ```

### Emergency Destructive Teardown (`down.sql`)
> [!CAUTION]
> `prisma/migrations/20261112000000_init/down.sql` executes cascading `DROP TABLE` statements across all 10 tables and 5 enums.
> **DO NOT EXECUTE IN PRODUCTION.**
> This script is restricted to local test environments or disaster-recovery teardowns prior to production launch.

