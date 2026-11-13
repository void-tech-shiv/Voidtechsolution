# CMS_TESTING_STRATEGY.md — Quality Assurance & Testing Blueprint

**Project:** VOIDTECH SOLUTION  
**Milestone:** Phase 10.0.1 — CMS Architecture Refinement & Design Freeze  
**Document Status:** FROZEN TESTING ARCHITECTURE & SPECIFICATION (FOR PHASES 10.1–10.4)  
**Author:** Google DeepMind Assistant  
**Approved By:** SHIVANSHU SATYAJEET (Project Owner) — Design Freeze Authorized  

---

## 1. Testing Philosophy & Empirical Validation Principle

VOIDTECH SOLUTION strictly enforces the **Empirical Validation Principle**:
> *No "trust me, it works." Every architectural capability, security boundary, concurrent state transition, and UI interaction requires captured, repeatable proof from automated test runners, compilers, or browser automation.*

The Phase 10 CMS testing framework spans five distinct verification tiers with zero tolerance for skipped, unasserted, or flaky tests:
1. **Tier 1 — Unit & Schema Validation:** Sub-millisecond testing of Zod schemas, GFM Markdown HTML pipeline (`unified` + `rehype-sanitize`), SVG DOMPurify sanitization, magic-byte MIME detectors, and deterministic slug generators.
2. **Tier 2 — Repository & Concurrency Integration:** Real PostgreSQL verification on isolated test database (`voidtech_test_concurrency`) testing Approach C (Canonical `ContentItem` + `ContentRevision` + Materialized Snapshots), atomic OCC version counters, draft retention pruning (20 working drafts limit, published exempt), and offline static fallbacks.
3. **Tier 3 — Server Action & RBAC Security Suites:** Full matrix testing across all three administrative roles (`SUPER_ADMIN`, `ADMIN`, `EDITOR`), validating permission gates, pricing publication restrictions, testimonial consent/verification gates, SVG upload restrictions, and unauthorized mutation rejections.
4. **Tier 4 — Public Integration & Draft Mode Regression:** Verifying that public routes consume exclusively published records, Draft Mode preview securely serves draft revisions with `X-Robots-Tag: noindex, nofollow`, on-demand cache tag revalidation executes, and Phase 9 CRM lead pipeline workflows remain 100% regression-free.
5. **Tier 5 — Playwright End-to-End (E2E) Browser Journeys:** Multi-viewport browser validation covering content drafting, admin approval/publishing, media uploads, pricing updates, testimonial verification, and responsive layout acceptance across 10 distinct viewports.

---

## 2. Test Execution Hierarchy & Architecture

```mermaid
flowchart TD
    subgraph L1["Tier 1: Unit & Validation (Vitest)"]
        ZodTests["Zod Schema Constraints & Invariants"]
        MarkdownTests["GFM Pipeline & rehype-sanitize HTML AST"]
        SvgTests["DOMPurify & Magic-Byte MIME Validation"]
        SlugTests["Deterministic Slug & Currency Formatters"]
    end

    subgraph L2["Tier 2: Repository Integration (Real PostgreSQL)"]
        ApproachCTest["Approach C: ContentItem + ContentRevision Sync"]
        DraftIsolation["Public Queries Read Materialized Published Only"]
        OCCDrift["Atomic OCC Version Counter Locking"]
        RetentionPrune["Draft Retention Pruning (Max 20 Drafts, Pubs Exempt)"]
        RollbackTest["Version Rollback Creates New Draft (v = max + 1)"]
        FallbackTest["Offline Static Fallback Resilience on Disconnect"]
    end

    subgraph L3["Tier 3: Server Actions & RBAC (Vitest + Auth)"]
        RBACMatrix["3-Role Permission Enforcement Matrix"]
        PricingGate["Pricing Publish Restricted (SUPER_ADMIN / ADMIN Only)"]
        TestimonialGate["Testimonial Verification & Consent Dual Gate"]
        SvgUploadGate["SVG Upload Privilege (media:upload_svg)"]
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
        AdminPublishJourney["Admin Preview HUD & Atomic Publish Flow"]
        TestimonialJourney["Testimonial Verification & Consent Workflow"]
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
  4. `testimonialSchema` validation: quote length (10–1000 chars), valid client rating (1–5), client consent confirmation boolean check.
  5. `gfmMarkdownParser` validation:
     - Converts standard Markdown `# Heading`, `**bold**`, `*italics*`, `~~strike~~` into semantic HTML.
     - Supports GFM tables (`| Col 1 | Col 2 |`), task lists (`- [x] Done`), and autolinks.
     - Adds `rel="noopener noreferrer"` and `target="_blank"` to all external hyperlinks via `rehype-external-links`.
     - Strips dangerous tags: `<script>`, `<iframe>`, `<object>`, `<embed>`, `<form>`, `<input>`, `<link>`, `<style>`.
     - Strips dangerous attributes: `onerror`, `onload`, `onclick`, `onmouseover`, `javascript:` URI schemes.
  6. `svgSanitizer` validation:
     - Sanitizes SVG payloads using DOMPurify with strict XML profile.
     - Strips nested `<script>`, `<foreignObject>`, and event handlers while preserving vector `<path>`, `<rect>`, `<circle>`, `<g>`, `<svg>` elements and attributes.
  7. `magicByteValidator`:
     - Inspects file headers to detect real MIME type (`image/png`: `89 50 4E 47`, `image/jpeg`: `FF D8 FF`, `image/webp`: `52 49 46 46...57 45 42 50`).
     - Rejects disguised executable files or HTML polyglots with spoofed `.png` extensions.
  8. `slugify` validation: handles accented unicode characters, trims whitespace, collapses multiple consecutive dashes, strips special punctuation characters.

### 3.2 Tier 2: Repository Integration Suites (`tests/integration/cms-repositories.integration.test.ts`)
- **Execution Harness:** Real PostgreSQL instance on `voidtech_test_concurrency`.
- **Target Suite Coverage:** 28+ Integration Tests.
- **Key Scenarios & Assertions:**
  1. **Approach C Relational Consistency:**
     - Creating a draft creates a canonical `ContentItem` (`status = DRAFT`, `version = 1`, `currentPublishedRevisionId = null`) and an initial `ContentRevision` (`revisionNumber = 1`, `status = DRAFT`).
     - Materialized public tables (`services`, `pricing_packages`, etc.) remain completely empty or unchanged while content is in `DRAFT`.
  2. **Draft Isolation Guarantee:**
     - Public query `getActiveServices()` queries exclusively from the materialized `services` table where `isActive = true`.
     - Unpromoted draft revisions, pending review drafts, and rejected drafts never appear in public repository queries.
  3. **Atomic OCC Version Locking:**
     - `updateContentItem(id, expectedVersion, data)` atomically checks `version === expectedVersion`.
     - Concurrent update with stale `expectedVersion` immediately aborts and throws `ConcurrencyConflictError` with active version metadata.
  4. **Atomic Promotion on Publish:**
     - `publishContentItem(id, revisionId)` executes within an atomic `prisma.$transaction`.
     - Sets `ContentItem.status = PUBLISHED`, increments `ContentItem.version`, updates `ContentItem.currentPublishedRevisionId = revisionId`.
     - Sets `ContentRevision.status = PUBLISHED` and records `publishedAt = now()`.
     - Upserts the materialized domain record (`services`, `pricing_packages`, etc.) with `isActive = true`.
     - Any simulated constraint failure rolls back the entire transaction, leaving both draft and published states pristine.
  5. **Draft Revision Retention Policy:**
     - Creating consecutive draft revisions increments `revisionNumber`.
     - When working draft count exceeds 20 for a given `contentItemId`, the oldest non-published draft revisions (`status = DRAFT`) are pruned.
     - All revisions that have ever been published (`publishedAt !== null` or referenced by `currentPublishedRevisionId`) are **permanently exempt** from pruning.
  6. **Immutable Historical Rollback:**
     - Restoring historical Revision 2 from current Revision 5 creates a brand new `ContentRevision` with `revisionNumber = 6` containing Revision 2's snapshot data.
     - Historical revisions 1 through 5 remain untouched and immutable.
  7. **Offline Static Fallback Resilience:**
     - Simulating database connection failure (invalid pool / disconnected host) triggers immediate fallback to static code registries (`servicesRegistry`, `pricingRegistry`, `portfolioRegistry`, `testimonialsRegistry`).
     - Returns hardcoded data with structured logging without crashing the application runtime.

### 3.3 Tier 3: Server Action & RBAC Security Suites (`tests/integration/cms-rbac-security.integration.test.ts`)
- **Execution Harness:** Vitest with mocked HTTP headers and real PostgreSQL sessions.
- **Target Suite Coverage:** 35+ Security Tests.
- **Key Scenarios & Assertions:**
  1. **Full 3-Role Matrix Enforcement:**
     - `SUPER_ADMIN`: Granted all permissions across all domains, including permanent deletion, testimonial verification, SVG uploads, and pricing publication.
     - `ADMIN`: Granted create, edit, publish, archive, restore, and standard media upload across all domains. Explicitly denied permanent deletion (`services:delete`, `pricing:delete`, `portfolio:delete`).
     - `EDITOR`: Granted create draft, edit draft (`pricing:edit_draft`), and standard media upload. Explicitly denied publishing (`services:publish`, `pricing:publish`), archiving, deleting, and modifying SEO metadata.
  2. **Pricing Publication Permission Enforcement (Decision 7):**
     - Invoking `publishPricingPackageAction` as `EDITOR` returns `403 Forbidden` (`INSUFFICIENT_PERMISSIONS`).
     - Invoking `publishPricingPackageAction` as `ADMIN` or `SUPER_ADMIN` succeeds and promotes pricing to live public site.
     - `EDITOR` is permitted to invoke `savePricingPackageDraftAction`, which saves the proposal to `ContentRevision` without affecting live public prices.
  3. **Testimonial Verification Dual Gate (Decision 4):**
     - Invoking `verifyTestimonialAction` as `EDITOR` returns `403 Forbidden`.
     - `verifyTestimonialAction` requires explicit verifier session, recording `verifiedByAdminId` and `verifiedAt`.
     - Invoking `publishTestimonialAction` fails with `PRECONDITION_FAILED` if `clientConsentConfirmed !== true` or `approvalStatus !== 'VERIFIED'`.
     - Public testimonial query strictly filters by `isVerified === true AND clientConsentConfirmed === true AND approvalStatus === 'VERIFIED' AND status === 'PUBLISHED' AND isActive === true`.
     - Consent revocation via `revokeTestimonialConsentAction` instantly sets `clientConsentConfirmed = false` and deactivates public record within an atomic transaction.
  4. **Restricted SVG Upload Privilege (Decision 5):**
     - Attempting to upload an SVG file with an `EDITOR` session returns `403 Forbidden` (`PERMISSION_DENIED: SVG uploads require media:upload_svg privilege`).
     - Attempting to upload an SVG with `ADMIN` or `SUPER_ADMIN` invokes `DOMPurify` XML profile sanitization and saves the file.
  5. **Cross-Origin Mutation Protection:**
     - Any mutating Server Action (`POST`) rejects requests where `request.headers.get("origin") !== request.headers.get("host")`.
  6. **Immutable Audit Logging:**
     - Every mutating action generates an immutable `AuditLog` entry with `actorId`, `actionType`, `targetId`, `ipAddress`, `userAgent`, and detailed `metadata` diffs.

### 3.4 Tier 4: Public Integration & Draft Mode Regression Suites (`tests/integration/cms-public-integration.integration.test.ts`)
- **Execution Harness:** Next.js Server Components & Vitest Integration Harness.
- **Target Suite Coverage:** 20+ Integration Tests.
- **Key Scenarios & Assertions:**
  1. **Public Materialized Table Hydration:**
     - Public routes `/services`, `/pricing`, `/portfolio`, `/testimonials` query exclusively from materialized domain tables.
     - Verified zero database joins to `content_revisions` during standard public traffic.
  2. **Draft Mode Preview Pipeline (Decision 1):**
     - Calling `GET /api/draft/preview?secret=...&slug=...&contentType=service` validates the preview secret and sets the `__prerender_bypass` cookie.
     - In draft mode, the service detail page fetches the latest working draft from `ContentRevision` rather than the published table.
     - In draft mode, the HTTP response includes header `X-Robots-Tag: noindex, nofollow` to prevent search engine indexing.
     - In draft mode, the layout renders the persistent amber preview HUD (`"PREVIEW DRAFT MODE"` banner with exit button).
  3. **Cache Invalidation Verification:**
     - Publishing a service calls `revalidatePath('/services')` and `revalidateTag('services')`.
     - Next.js Data Cache properly invalidates and serves fresh data on the subsequent public request.
  4. **Phase 9 CRM Regression Invariant:**
     - All 462 existing unit/integration tests and 21 Playwright CRM tests run against the same database schema and pass with 100% success.
     - Zero disruption to CRM leads, pipeline stages, activity notes, tasks, or assignment workflows.

### 3.5 Tier 5: Playwright E2E Browser Acceptance (`tests/e2e/cms-acceptance.spec.ts`)
- **Execution Harness:** Playwright with Chromium & Microsoft Edge engines.
- **Target Suite Coverage:** 25+ Comprehensive E2E Journeys across 10 Viewports.
- **Key Journeys & Visual Acceptance:**
  1. **Journey 1: Editor Drafting & Pricing Restriction Workflow:**
     - Log in as `editor@voidtech.io`.
     - Navigate to `/admin/cms/services`. Click "New Service".
     - Fill form with title, slug, GFM markdown description, deliverables, and starting price.
     - Save draft. Verify draft saved successfully with `status: DRAFT`.
     - Verify "Publish" button is disabled with tooltip: *"You do not have permission to publish content."*
     - Navigate to `/admin/cms/pricing`. Edit "Growth Engine" package proposal. Verify draft saved, publish disabled.
  2. **Journey 2: Admin Review, Preview & Publishing Workflow:**
     - Log in as `admin@voidtech.io`.
     - Navigate to `/admin/cms/services`. Open the editor's draft.
     - Click "Preview in Draft Mode".
     - Browser redirects to public page with amber preview banner: `PREVIEW DRAFT MODE: Viewing Draft Revision v1`.
     - Verify draft content renders with exact styling.
     - Return to admin tab. Click "Publish Service".
     - Confirm dialog. Verify status changes to `PUBLISHED`.
     - Open public `/services` page in an unauthenticated incognito context; verify new service is live.
  3. **Journey 3: Testimonial Verification & Public Listing Workflow:**
     - Create testimonial as `EDITOR`. Status is `DRAFT`, `approvalStatus: PENDING_REVIEW`.
     - Log in as `SUPER_ADMIN`. Open testimonial review drawer.
     - Confirm client consent checkbox, enter verification evidence URL, click "Verify & Approve".
     - Click "Publish". Verify testimonial appears in public testimonial carousel on homepage.
     - Click "Revoke Consent". Verify testimonial instantly disappears from public homepage.
  4. **Journey 4: Media Upload, Alt-Text & Sharp WebP Processing:**
     - Upload sample JPG/PNG image in media library.
     - Verify system generates optimized WebP variants.
     - Ensure modal enforces non-empty alt text before inserting image into markdown content.
  5. **Journey 5: Multi-Viewport Visual Screenshot Acceptance:**
     - Capture screenshot proofs of CMS admin panels, edit drawers, and preview HUD across all 10 project viewports:
       - `320px` (Ultra Mobile)
       - `360px` (Standard Mobile Android)
       - `375px` (iPhone SE / Standard iOS)
       - `390px` (iPhone 13 / 14 / 15)
       - `430px` (iPhone Pro Max)
       - `768px` (iPad Portrait / Tablet)
       - `1024px` (iPad Landscape / Small Laptop)
       - `1280px` (Desktop Standard)
       - `1440px` (Desktop Widescreen / MacBook Pro)
       - `1920px` (Full HD Monitor)

---

## 4. Security Verification Test Matrix (SEC-01 through SEC-15)

Directly mapped from `CMS_SECURITY_REVIEW.md`, these 15 automated test cases must be implemented and verified in Tier 3 & Tier 5:

| ID | Test Scenario | Threat Under Test | Verification Method & Expected Outcome |
| :--- | :--- | :--- | :--- |
| **SEC-01** | Editor Direct Publish Interception | Privilege Escalation to Publish | Server Action called with `EDITOR` session returns `403 Forbidden`. DB state remains unchanged. |
| **SEC-02** | Stored XSS via GFM Markdown | XSS Execution via Rich Text | Input contains `<script>alert(1)</script>` and `<img src=x onerror=alert(1)>`. `unified` parser produces sanitized HTML with scripts and handlers stripped. |
| **SEC-03** | SVG Embedded Script & Entity Defense | XSS / XXE via SVG Upload | Upload SVG containing `<script>` or external entity. `DOMPurify` XML profile strips script and XXE; malicious payload defanged. |
| **SEC-04** | OCC Stale Version Collision | Race Condition / Overwrite | Two concurrent requests update same item with `version = 1`. One succeeds (becomes `v = 2`), second aborts with `409 ConcurrencyConflictError`. |
| **SEC-05** | Public Leakage of Unpromoted Draft | Unauthorized Information Disclosure | Create draft service. Public query `getActiveServices()` returns 0 items. Direct REST query to published endpoint returns 404. |
| **SEC-06** | Draft Mode Preview Cookie Tampering | Unauthorized Content Preview | Send request to `/api/draft/preview` with invalid secret. Endpoint returns `401 Unauthorized`. Cookie is NOT set. |
| **SEC-07** | Search Engine Indexing of Drafts | SEO Degradation / Leaked Info | Fetch draft page in Draft Mode. Inspect response headers: `X-Robots-Tag: noindex, nofollow` must be present. |
| **SEC-08** | Unverified Testimonial Publication | Misrepresentation / Legal Liability | Attempt to publish testimonial where `isVerified = false` or `clientConsentConfirmed = false`. Action throws `412 Precondition Failed`. |
| **SEC-09** | Magic-Byte MIME Spoofing | Malicious Executable Upload | Upload executable binary renamed to `invoice.png`. File detector inspects magic bytes, detects mismatch, rejects upload with `400 Bad Request`. |
| **SEC-10** | Path Traversal via Media Filename | Local Filesystem Traversal | Upload file with filename `../../../../etc/passwd.png`. Storage provider sanitizes filename to `passwd.png` and confines storage to designated folder. |
| **SEC-11** | Cross-Origin Server Action Invocation | CSRF / Cross-Origin Action Abuse | Invoke mutating Server Action with `Origin: https://evil-attacker.com`. Action inspects headers, rejects request with `403 Forbidden`. |
| **SEC-12** | Database Disconnection Fallback | Application Outage / Denial of Service | Disconnect PostgreSQL pool. Public route calls `getActiveServices()` and returns static code fallback data within 50ms without crashing. |
| **SEC-13** | Editor Commercial Price Tampering | Commercial Sabotage / Pricing Fraud | `EDITOR` attempts to call `updatePricingPackageAction` with `priceInr = 1`. Action rejects with `403 Forbidden` (`pricing:publish` required). |
| **SEC-14** | Revision Pruning Memory Exhaustion | DoS via Infinite Revisions | Create 35 draft revisions for single item. Verify that only 20 working draft revisions remain in DB. Verify all published snapshots are preserved. |
| **SEC-15** | SSRF Defense in Remote Media Fetch | Server-Side Request Forgery | Attempt to register media asset from internal URL (`http://169.254.169.254/`). Ingestion validator blocks private and loopback IP ranges. |

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
