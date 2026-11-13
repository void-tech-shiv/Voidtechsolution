# CMS_TESTING_STRATEGY.md — Quality Assurance & Testing Blueprint

**Project:** VOIDTECH SOLUTION  
**Milestone:** Phase 10.0.2 — Final CMS Implementation Safeguards  
**Document Status:** FROZEN TESTING ARCHITECTURE & SPECIFICATION (FOR PHASES 10.1–10.4)  
**Author:** Google DeepMind Assistant  
**Approved By:** SHIVANSHU SATYAJEET (Project Owner) — Safeguards Authorized  

---

## 1. Testing Philosophy & Empirical Validation Principle

VOIDTECH SOLUTION strictly enforces the **Empirical Validation Principle**:
> *No "trust me, it works." Every architectural capability, security boundary, concurrent state transition, and UI interaction requires captured, repeatable proof from automated test runners, compilers, or browser automation.*

The Phase 10 CMS testing framework spans five distinct verification tiers with zero tolerance for skipped, unasserted, or flaky tests:
1. **Tier 1 — Unit & Schema Validation:** Sub-millisecond testing of Zod schemas, GFM Markdown HTML pipeline (`unified` + `rehype-sanitize`), magic-byte MIME detectors, default-disabled SVG rejection, and deterministic slug generators.
2. **Tier 2 — Repository & Concurrency Integration:** Real PostgreSQL verification on isolated test database (`voidtech_test_concurrency`) testing Approach C (Canonical `ContentItem` + dual pointers `currentPublishedRevisionId` & `currentWorkingRevisionId` + `ContentRevision` + Materialized Snapshots), 9-step atomic publishing transaction rollbacks, cross-item ownership assertions, draft retention pruning (20 working drafts limit, published exempt), and 5-scenario static fallbacks (`isFallback: true`, `X-Voidtech-Content-Source`).
3. **Tier 3 — Server Action & RBAC Security Suites:** Full matrix testing across all three administrative roles (`SUPER_ADMIN`, `ADMIN`, `EDITOR`), validating permission gates, pricing publication restrictions, testimonial dual-state verification (`verificationStatus` + `clientConsentStatus`), instant consent revocation unlisting, and unauthorized mutation rejections.
4. **Tier 4 — Public Integration & Draft Mode Regression:** Verifying that public routes consume exclusively published records, Draft Mode preview securely serves working draft revisions with `X-Robots-Tag: noindex, nofollow`, on-demand cache tag revalidation executes, and Phase 9 CRM lead pipeline workflows remain 100% regression-free.
5. **Tier 5 — Playwright End-to-End (E2E) Browser Journeys:** Multi-viewport browser validation covering content drafting, admin approval/publishing, media uploads, pricing updates, testimonial verification, and responsive layout acceptance across 10 distinct viewports.

---

## 2. Test Execution Hierarchy & Architecture

```mermaid
flowchart TD
    subgraph L1["Tier 1: Unit & Validation (Vitest)"]
        ZodTests["Zod Schema Constraints & Invariants"]
        MarkdownTests["GFM Pipeline & rehype-sanitize HTML AST"]
        SvgTests["Default Disabled SVG Rejection & Magic Bytes"]
        SlugTests["Deterministic Slug & Currency Formatters"]
    end

    subgraph L2["Tier 2: Repository Integration (Real PostgreSQL)"]
        ApproachCTest["Approach C: ContentItem Dual Pointers & Revisions"]
        DraftIsolation["Public Queries Read Materialized Published Only"]
        PublishTx9["9-Step Atomic Publishing Transaction & Rollback"]
        OCCDrift["Atomic OCC Version Counter Locking"]
        RetentionPrune["Draft Retention Pruning (Max 20 Drafts, Pubs Exempt)"]
        RollbackTest["Version Rollback Creates New Draft (v = max + 1)"]
        FallbackTest["5-Scenario Static Fallback Resilience & Headers"]
    end

    subgraph L3["Tier 3: Server Actions & RBAC (Vitest + Auth)"]
        RBACMatrix["3-Role Permission Enforcement Matrix"]
        PricingGate["Pricing Publish Restricted (SUPER_ADMIN / ADMIN Only)"]
        TestimonialGate["Testimonial Verification & Legal Consent Dual Gate"]
        RevocationGate["Instant Unlisting on Consent Revocation"]
        MediaSecurityGate["Media Defaults: JPEG/PNG/WebP, SVG Disabled"]
        CSRFOrigin["Host/Origin Header Validation"]
        AuditEmit["Audit Log Event Dispatch & Structured Metadata"]
    end

    subgraph L4["Tier 4: Public Integration & Regression"]
        RSCFetch["Public RSC Data Hydration (Materialized Tables)"]
        DraftMode["Next.js Draft Mode Preview & Bypass Cookie"]
        RobotsNoIndex["X-Robots-Tag: noindex, nofollow on Draft Previews"]
        RevalidateTags["revalidatePath & revalidateTag Cache Invalidation"]
        CrmRegression["CRM Leads, Notes, Tasks & Auth Parity (0 Regression)"]
    end

    subgraph L5["Tier 5: Playwright E2E & Visual Acceptance"]
        EditorJourney["Editor Drafting Flow (Pricing Publish Blocked)"]
        AdminPublishJourney["Admin Preview HUD & 9-Step Atomic Publish Flow"]
        TestimonialJourney["Testimonial Verification, Consent & Revocation Flow"]
        MediaUploads["File Upload, Sharp WebP & Gallery Selection"]
        Responsive10["10-Viewport Visual Screenshots (320px–1920px)"]
    end

    L1 --> L2
    L2 --> L3
    L3 --> L4
    L4 --> L5
```

---

## 3. Comprehensive Test Suites Breakdown

### 3.1 Tier 1: Unit & Validation Suites (`tests/unit/cms-validation.test.ts`)
- **Execution Harness:** Vitest (In-Memory, Sub-Millisecond).
- **Target Suite Coverage:** 35+ Unit Tests.
- **Key Scenarios & Assertions:**
  1. `serviceSchema` validation: slug regex (`^[a-z0-9]+(?:-[a-z0-9]+)*$`), minimum title length (3 chars), non-empty deliverables array, positive INR starting price.
  2. `pricingPackageSchema` validation: strictly positive integer for `priceInr`, INR currency default, non-empty features array, billing cadence enum check.
  3. `portfolioProjectSchema` validation: required challenge/solution/results fields, valid `projectType` enum, concept lab disclosure check.
  4. `testimonialSchema` validation: quote length (10–1000 chars), valid client rating (1–5), client consent confirmation fields check.
  5. `gfmMarkdownParser` validation:
     - Converts standard Markdown `# Heading`, `**bold**`, `*italics*`, `~~strike~~` into semantic HTML.
     - Supports GFM tables (`| Col 1 | Col 2 |`), task lists (`- [x] Done`), and autolinks.
     - Adds `rel="noopener noreferrer"` and `target="_blank"` to all external hyperlinks via `rehype-external-links`.
     - Strips dangerous tags: `<script>`, `<iframe>`, `<object>`, `<embed>`, `<form>`, `<input>`, `<link>`, `<style>`.
     - Strips dangerous attributes: `onerror`, `onload`, `onclick`, `onmouseover`, `javascript:` URI schemes.
  6. `mediaValidation`:
     - Accepts JPEG, PNG, WebP.
     - **Rejects SVG by default** with `SVG uploads are disabled by default`.
     - Rejects files exceeding 5.0 MB.
  7. `magicByteValidator`:
     - Inspects file headers to detect real MIME type (`image/png`: `89 50 4E 47`, `image/jpeg`: `FF D8 FF`, `image/webp`: `52 49 46 46...57 45 42 50`).
     - Rejects disguised executable files or HTML polyglots with spoofed `.png` extensions.
  8. `slugify` validation: handles accented unicode characters, trims whitespace, collapses multiple consecutive dashes, strips special punctuation characters.

### 3.2 Tier 2: Repository Integration Suites (`tests/integration/cms-repositories.integration.test.ts`)
- **Execution Harness:** Real PostgreSQL instance on `voidtech_test_concurrency`.
- **Target Suite Coverage:** 28+ Integration Tests.
- **Key Scenarios & Assertions:**
  1. **Dual-Pointer Relational Consistency (Safeguard 1 & 2):**
     - Creating a draft creates canonical `ContentItem` (`publicationStatus = DRAFT`, `version = 1`, `currentPublishedRevisionId = null`, `currentWorkingRevisionId = rev1.id`).
     - Materialized public tables remain completely empty or unchanged while content is in `DRAFT`.
  2. **Draft Isolation Guarantee:**
     - Public query `getActiveServices()` queries exclusively from the materialized `services` table where `isActive = true`.
     - Unpromoted draft revisions, pending review drafts, and rejected drafts never appear in public repository queries.
  3. **Atomic OCC Version Locking & 9-Step Publishing Protocol (Safeguard 3):**
     - `publishContentItem` executes the 9-step atomic transaction.
     - Atomic check: `ContentItem.version === expectedVersion`. Stale version update immediately aborts with `409 ConcurrencyConflictError`.
     - Simulating mid-transaction constraint failure (e.g. invalid foreign key or domain constraint) rolls back all writes, leaving both draft and published states pristine.
  4. **Cross-Item Revision Ownership Assertion (Safeguard 2):**
     - Attempting to publish with a `revisionId` belonging to a different `ContentItem` aborts with `InvariantViolationError` in Step 4.
  5. **Draft Revision Retention Policy:**
     - Creating consecutive draft revisions increments `versionNumber`.
     - When working draft count exceeds 20 for a given `contentItemId`, the oldest non-published draft revisions (`revisionStatus = WORKING_DRAFT`) are pruned.
     - All revisions that have ever been published (`isPublishedSnapshot === true` or referenced by `currentPublishedRevisionId`) are **permanently exempt** from pruning.
  6. **Immutable Historical Rollback:**
     - Restoring historical Revision 2 creates a brand new `ContentRevision` with `versionNumber = max + 1` containing Revision 2's snapshot data, pointing `currentWorkingRevisionId` to it.
     - Historical revisions remain untouched and immutable.
  7. **Comprehensive Static Fallback Resilience (Safeguard 6):**
     - Scenario 1 (DB Offline): Emits `X-Voidtech-Content-Source: static-fallback`, `isFallback: true`, structured warning logged with scrubbed connection strings.
     - Scenario 2 (Empty Table): Returns static baseline config to prevent blank page.
     - Scenario 3 (Archived Item): Returns explicit 404 / `null`; NEVER serves static fallback.
     - Scenario 4 (Invalid Snapshot): Falls back to static registry for that item, logs structured error.
     - Scenario 5 (Unexpected Repo Error): Serves static baseline config, logs sanitized error.

### 3.3 Tier 3: Server Action & RBAC Security Suites (`tests/integration/cms-rbac-security.integration.test.ts`)
- **Execution Harness:** Vitest with mocked HTTP headers and real PostgreSQL sessions.
- **Target Suite Coverage:** 35+ Security Tests.
- **Key Scenarios & Assertions:**
  1. **Full 3-Role Matrix Enforcement:**
     - `SUPER_ADMIN`: All permissions granted.
     - `ADMIN`: Granted create, edit, publish, archive, restore, and standard media upload. Denied permanent deletion.
     - `EDITOR`: Granted create draft, edit draft (`pricing:edit_draft`), and standard media upload. Explicitly denied publishing (`services:publish`, `pricing:publish`), archiving, deleting, and modifying SEO metadata.
  2. **Pricing Publication Permission Enforcement (Decision 7):**
     - Invoking `publishPricingAction` as `EDITOR` returns `403 Forbidden` (`INSUFFICIENT_PERMISSIONS`).
     - Invoking `publishPricingAction` as `ADMIN` or `SUPER_ADMIN` succeeds.
  3. **Testimonial Verification Dual Gate & Instant Revocation (Safeguard 4):**
     - `verifyTestimonialAction` sets `verificationStatus = 'VERIFIED'`. Requires `SUPER_ADMIN` or `ADMIN`.
     - `recordClientConsentAction` sets `clientConsentStatus = 'GRANTED'`, requires valid evidence URL.
     - Publishing fails with `412 Precondition Failed` if `verificationStatus !== 'VERIFIED'` or `clientConsentStatus !== 'GRANTED'`.
     - `revokeTestimonialConsentAction` immediately sets `clientConsentStatus = 'REVOKED'`, `status = 'ARCHIVED'`, `isActive = false`, and verifies public query returns 0 items at SQL level.
  4. **Default Disabled SVG Upload Security (Safeguard 5):**
     - Attempting to upload an SVG file returns `400 Bad Request ("SVG uploads are disabled by default")`.
  5. **Cross-Origin Mutation Protection:**
     - Mutating actions reject requests where `origin !== host` with `403 Forbidden`.
  6. **Immutable Audit Logging:**
     - Mutating actions generate an immutable `AuditLog` entry with structured metadata diffs.

### 3.4 Tier 4: Public Integration & Draft Mode Regression Suites (`tests/integration/cms-public-integration.integration.test.ts`)
- **Execution Harness:** Next.js Server Components & Vitest Integration Harness.
- **Target Suite Coverage:** 20+ Integration Tests.
- **Key Scenarios & Assertions:**
  1. **Public Materialized Table Hydration:**
     - Public routes `/services`, `/pricing`, `/portfolio`, `/testimonials` query exclusively from materialized domain tables.
     - Verified zero database joins to `content_revisions` during standard public traffic.
  2. **Draft Mode Preview Pipeline:**
     - Calling `GET /api/draft/preview?secret=...&slug=...&contentType=service` validates secret and sets `__prerender_bypass` cookie.
     - Draft Mode queries repository with `preview: true`, loading `currentWorkingRevisionId`.
     - Injected response header: `X-Robots-Tag: noindex, nofollow`.
     - Layout renders persistent amber preview HUD banner.
  3. **Cache Invalidation Verification:**
     - Publishing calls `revalidatePath(...)` and `revalidateTag(...)`.
  4. **Phase 9 CRM Regression Invariant:**
     - All 462 existing unit/integration tests and 21 Playwright CRM tests run against the same database schema and pass with 100% success.
     - Zero disruption to CRM leads, pipeline stages, activity notes, tasks, or assignment workflows.

### 3.5 Tier 5: Playwright E2E Browser Acceptance (`tests/e2e/cms-acceptance.spec.ts`)
- **Execution Harness:** Playwright with Chromium & Microsoft Edge engines.
- **Target Suite Coverage:** 25+ Comprehensive E2E Journeys across 10 Viewports.
- **Key Journeys & Visual Acceptance:**
  1. **Journey 1: Editor Drafting & Pricing Restriction Workflow:**
     - Log in as `EDITOR`. Create draft service. Save draft. Verify "Publish" button is disabled with permission tooltip.
     - Navigate to `/admin/cms/pricing`. Edit package proposal. Verify draft saved, publish disabled.
  2. **Journey 2: Admin 9-Step Publishing & Preview Journey:**
     - Log in as `ADMIN`. Open draft. Click "Preview in Draft Mode".
     - Verify amber preview HUD banner appears with draft content.
     - Return to admin panel. Click "Publish Service". Confirm dialog.
     - Open public `/services` in incognito context; verify live update.
  3. **Journey 3: Testimonial Verification, Consent & Revocation Flow:**
     - Create testimonial as `EDITOR`. Verify `verificationStatus: UNVERIFIED`, `clientConsentStatus: PENDING`.
     - Log in as `SUPER_ADMIN`. Open verification drawer. Document verification notes and consent evidence URL.
     - Click "Publish". Verify live appearance on homepage.
     - Click "Revoke Consent". Verify instant unlisting from public page.
  4. **Journey 4: Media Upload, Alt-Text & Sharp WebP Processing:**
     - Upload sample JPG/PNG image in media library. Verify WebP generated.
     - Verify attempt to upload SVG is rejected with informative modal notice.
  5. **Journey 5: Multi-Viewport Visual Screenshot Acceptance:**
     - Capture screenshot proofs across all 10 project viewports:
       `320px`, `360px`, `375px`, `390px`, `430px`, `768px`, `1024px`, `1280px`, `1440px`, `1920px`.

---

## 4. Security Verification Test Matrix (SEC-01 through SEC-15)

| ID | Test Scenario | Threat Under Test | Verification Method & Expected Outcome |
| :--- | :--- | :--- | :--- |
| **SEC-01** | Editor Direct Publish Interception | Privilege Escalation to Publish | Server Action called with `EDITOR` session returns `403 Forbidden`. DB state remains unchanged. |
| **SEC-02** | Stored XSS via GFM Markdown | XSS Execution via Rich Text | Input contains `<script>alert(1)</script>` and `<img src=x onerror=alert(1)>`. `unified` parser produces sanitized HTML with scripts and handlers stripped. |
| **SEC-03** | Default Disabled SVG Upload Rejection | XSS / XXE via SVG Upload | Upload SVG file. Pipeline rejects upload with `400 Bad Request ("SVG uploads are disabled by default")`. |
| **SEC-04** | OCC Stale Version Collision & Rollback | Race Condition / Overwrite | Two concurrent requests update same item with `version = 1`. One succeeds (becomes `v = 2`), second aborts with `409 ConcurrencyConflictError`. Mid-transaction error rolls back cleanly. |
| **SEC-05** | Public Leakage of Unpromoted Draft | Unauthorized Information Disclosure | Create draft service. Public query `getActiveServices()` returns 0 items. Direct REST query to published endpoint returns 404. |
| **SEC-06** | Draft Mode Preview Cookie Tampering | Unauthorized Content Preview | Send request to `/api/draft/preview` with invalid secret. Endpoint returns `401 Unauthorized`. Cookie is NOT set. |
| **SEC-07** | Search Engine Indexing of Drafts | SEO Degradation / Leaked Info | Fetch draft page in Draft Mode. Inspect response headers: `X-Robots-Tag: noindex, nofollow` must be present. |
| **SEC-08** | Testimonial Dual-Gate & Instant Revocation | Misrepresentation / Consent Breach | Publish blocked if `verificationStatus !== 'VERIFIED'` or `clientConsentStatus !== 'GRANTED'`. Revocation immediately unlists at SQL query level. |
| **SEC-09** | Magic-Byte MIME Spoofing | Malicious Executable Upload | Upload executable binary renamed to `invoice.png`. File detector inspects magic bytes, detects mismatch, rejects upload with `400 Bad Request`. |
| **SEC-10** | Path Traversal via Media Filename | Local Filesystem Traversal | Upload file with filename `../../../../etc/passwd.png`. Storage provider sanitizes filename to `passwd.png` and confines storage to designated folder. |
| **SEC-11** | Cross-Origin Server Action Invocation | CSRF / Cross-Origin Action Abuse | Invoke mutating Server Action with `Origin: https://evil-attacker.com`. Action inspects headers, rejects request with `403 Forbidden`. |
| **SEC-12** | Database Disconnection Fallback & Headers | Application Outage / Silent Failure | Disconnect PostgreSQL pool. Public route returns static fallback data with `X-Voidtech-Content-Source: static-fallback` and `isFallback: true` without crashing. |
| **SEC-13** | Editor Commercial Price Tampering | Commercial Sabotage / Pricing Fraud | `EDITOR` attempts to call `publishPricingAction`. Action rejects with `403 Forbidden` (`pricing:publish` required). |
| **SEC-14** | Revision Pruning Memory Exhaustion | DoS via Infinite Revisions | Create 35 draft revisions for single item. Verify that only 20 working draft revisions remain in DB. Verify all published snapshots are preserved. |
| **SEC-15** | Serverless Ephemeral Storage Protection | Permanent Media Loss | System verifies zero media writes to ephemeral container paths (`/tmp`), enforcing persistent local dev or future cloud storage. |

---

## 5. Quality Gate Acceptance Thresholds

For any Phase 10 implementation milestone to be approved, the following strict exit criteria must be met:
- **TypeScript:** `npm.cmd run typecheck` reports 0 errors across all files.
- **ESLint:** `npm.cmd run lint` reports 0 warnings and 0 errors.
- **Automated Tests:** 100% test pass rate across all Vitest suites (0 skipped, 0 failing).
- **Playwright E2E:** 100% test pass rate across all browser journeys and viewports.
- **Production Build:** `npm.cmd run build` successfully compiles all routes with 0 errors.
- **Security Tests:** All 15 security verification tests (SEC-01 through SEC-15) verified passing.
- **CRM Regression:** All 462 existing tests and 21 Playwright CRM tests verified passing.
