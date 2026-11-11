# Phase 6: Database Migration Proposal — Enquiry Extended Metadata

## 1. Executive Summary

This proposal outlines the required PostgreSQL schema enhancements for Phase 6 to support:
- Package selection tracking from the Pricing tier catalog.
- Selected calculator architectural add-on configurations.
- Optional reference project/website URLs.
- Explicit user consent tracking.

> **CRITICAL BOUNDARY ENFORCEMENT:**
> In accordance with the Phase 6 master prompt authorization boundary, **this migration is PROPOSED ONLY**.
> It has **NOT** been applied to the live remote database and will not be applied until separate, explicit user authorization is provided.

---

## 2. Proposed Schema Alterations

### Target Table: `enquiries` (`public.enquiries`)

| Column Name | Type | Constraints | Purpose |
|---|---|---|---|
| `selectedPackage` | `TEXT` | `NULL` | Selected tier slug (e.g. `basic-static`, `saas`, `ai-powered`) |
| `additionalConfig` | `JSONB` | `NULL` | Detailed calculator configuration (base category, add-on IDs, urgency) |
| `referenceUrl` | `TEXT` | `NULL` | Optional reference website or specification document link |
| `consentGiven` | `BOOLEAN` | `NOT NULL DEFAULT true` | Explicit acceptance of project intake consultation policy |

---

## 3. Migration SQL (`prisma/migrations/20261112_phase6_enquiry_extended_metadata/migration.sql`)

```sql
-- Phase 6: Enquiry Extended Metadata Migration
-- Non-destructive additions to public.enquiries table

ALTER TABLE "enquiries" ADD COLUMN IF NOT EXISTS "selectedPackage" TEXT;
ALTER TABLE "enquiries" ADD COLUMN IF NOT EXISTS "additionalConfig" JSONB;
ALTER TABLE "enquiries" ADD COLUMN IF NOT EXISTS "referenceUrl" TEXT;
ALTER TABLE "enquiries" ADD COLUMN IF NOT EXISTS "consentGiven" BOOLEAN NOT NULL DEFAULT true;

-- Verification query
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'enquiries' 
  AND column_name IN ('selectedPackage', 'additionalConfig', 'referenceUrl', 'consentGiven');
```

---

## 4. Impact Assessment & Risk Mitigation

1. **Non-Destructive Guarantee**:
   - Every added column is either explicitly nullable or supplied with a static default value (`DEFAULT true`).
   - Existing queries reading or writing to `enquiries` remain 100% functional.
2. **Backward Compatibility**:
   - Legacy records or offline fallback records instantiate seamlessly without null reference violations.
3. **Rollback Strategy**:
   ```sql
   ALTER TABLE "enquiries" DROP COLUMN IF EXISTS "selectedPackage";
   ALTER TABLE "enquiries" DROP COLUMN IF EXISTS "additionalConfig";
   ALTER TABLE "enquiries" DROP COLUMN IF EXISTS "referenceUrl";
   ALTER TABLE "enquiries" DROP COLUMN IF EXISTS "consentGiven";
   ```
4. **Current Application State**:
   - Application code in `EnquiriesRepo`, server actions, and API routes handles these fields safely.
   - If the remote PostgreSQL database has not run this migration, write operations fail safely and throw descriptive errors without leaking credentials or crashing the Node process.

