# Phase 6: Database Migration Proposal — Enquiry Extended Metadata (Corrected Consent Safety)

## 1. Executive Summary

This proposal outlines the required PostgreSQL schema enhancements for Phase 6 to support:
- Package selection tracking from the approved Pricing tier catalog.
- Selected calculator architectural add-on configurations (`additionalConfig` JSONB).
- Optional reference project/website URLs (`referenceUrl`).
- **Privacy-Safe Consent Tracking (`consentGiven` Nullable Boolean)**.

> **CRITICAL BOUNDARY ENFORCEMENT:**
> In accordance with the project authorization boundary, **this migration is PROPOSED ONLY**.
> It has **NOT** been applied to the live remote database and will not be applied until separate, explicit user authorization is provided.

---

## 2. Consent Safety Correction Analysis

### The Flaw in `BOOLEAN NOT NULL DEFAULT true`
The initial draft proposed:
```sql
ALTER TABLE "enquiries" ADD COLUMN IF NOT EXISTS "consentGiven" BOOLEAN NOT NULL DEFAULT true;
```
**Privacy & Regulatory Failure Mode:**
Executing `ADD COLUMN NOT NULL DEFAULT true` causes PostgreSQL to backfill all pre-existing historical rows with `true`. This creates a false legal record attributing affirmative consent to individuals who never submitted a consent checkbox.

### The Corrected Architecture: Nullable Boolean
By defining `consentGiven` as `BOOLEAN DEFAULT NULL`:
1. **Historical Enquiries (`NULL`)**: Clearly demarcated as legacy records submitted prior to consent tracking. Zero false attribution of consent.
2. **New Verified Enquiries (`true`)**: Strictly enforced by the application layer. The client intake form (`ContactEnquiryForm`) starts with the checkbox unchecked, and the server-side Zod validation schema (`enquirySubmissionSchema`) requires `consentGiven === true`.
3. **Revoked / Denied Consent (`false`)**: Allows future status transitions or explicit opt-outs without schema changes.

---

## 3. Proposed Schema Alterations

### Target Table: `enquiries` (`public.enquiries`)

| Column Name | Type | Constraints | Semantic States | Purpose |
|---|---|---|---|---|
| `selectedPackage` | `TEXT` | `NULL` | Slug string or `NULL` | Selected tier slug (e.g. `basic-static`, `saas`, `ai-powered`) |
| `additionalConfig` | `JSONB` | `NULL` | JSON Object or `NULL` | Detailed calculator configuration (category, add-on IDs, urgency) |
| `referenceUrl` | `TEXT` | `NULL` | URL string or `NULL` | Optional reference website or specification document link |
| `consentGiven` | `BOOLEAN` | `DEFAULT NULL` | `NULL` = Historical/Unknown<br>`true` = Explicitly Granted<br>`false` = Revoked/Denied | Explicit consent to consultation communications |

---

## 4. Migration SQL (`prisma/migrations/20261112_phase6_enquiry_extended_metadata/migration.sql`)

```sql
-- Phase 6: Enquiry Extended Metadata Migration (Corrected Privacy-Safe Consent)
-- Target: public.enquiries
-- Non-destructive, additive schema evolution

ALTER TABLE "enquiries" ADD COLUMN IF NOT EXISTS "selectedPackage" TEXT;
ALTER TABLE "enquiries" ADD COLUMN IF NOT EXISTS "additionalConfig" JSONB;
ALTER TABLE "enquiries" ADD COLUMN IF NOT EXISTS "referenceUrl" TEXT;

-- Safe consent column: Default NULL preserves historical record integrity
ALTER TABLE "enquiries" ADD COLUMN IF NOT EXISTS "consentGiven" BOOLEAN DEFAULT NULL;

-- Verification query
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'enquiries' 
  AND column_name IN ('selectedPackage', 'additionalConfig', 'referenceUrl', 'consentGiven');
```

---

## 5. Impact Assessment & Risk Mitigation

1. **Non-Destructive Guarantee**:
   - Every added column is explicitly nullable (`NULL`).
   - Zero locks or rewrites that could disrupt concurrent transactions.
   - Zero retroactive alteration of historical enquiry data.
2. **Backward Compatibility**:
   - Legacy records instantiate safely in Prisma Client (`consentGiven: null`).
   - Offline fallback repositories handle `consentGiven` gracefully.
3. **Rollback Strategy**:
   If rollback is required, execute the following reversible DDL:
   ```sql
   ALTER TABLE "enquiries" DROP COLUMN IF EXISTS "selectedPackage";
   ALTER TABLE "enquiries" DROP COLUMN IF EXISTS "additionalConfig";
   ALTER TABLE "enquiries" DROP COLUMN IF EXISTS "referenceUrl";
   ALTER TABLE "enquiries" DROP COLUMN IF EXISTS "consentGiven";
   ```
4. **Application Layer Safety**:
   - `src/validations/enquiry.ts`: Rejects any new submission where `consentGiven !== true`.
   - `src/server/repositories/enquiries.repo.ts`: Explicitly preserves `input.consentGiven` and defaults to `null` if omitted.
