# PHASE 10.0.1 — CMS ARCHITECTURE REFINEMENT & DESIGN FREEZE REPORT

**Project:** VOIDTECH SOLUTION ("Build. Launch. Grow Online.")  
**Milestone:** Phase 10.0.1 — CMS Architecture Refinement & Design Freeze (DOCUMENTATION ONLY)  
**Workspace:** `D:/voidtechsolution`  
**Active Branch:** `session/phase-7-admin-auth`  
**Git Author & Committer:** `SHIVANSHU SATYAJEET <satyajeetshivanshu@gmail.com>`  
**Canonical Domain:** `https://voidtechsolution.codedev.co.in/`  
**Status:** **DESIGN FREEZE COMPLETE — AWAITING OWNER AUTHORIZATION FOR PHASE 10.1**  

---

## 1. Executive Summary & Design Freeze Charter

Phase 10.0.1 consolidates, formalizes, and freezes the architectural specifications for the VOIDTECH Administrative Content Management System (CMS). 

Following the Phase 10.0 Discovery mission, the project owner reviewed and explicitly approved **seven core architectural decisions**. This mission incorporates those decisions into the architectural specifications, establishes strict draft/published separation, formalizes the relational `ContentItem` and `ContentRevision` models, resolves concurrency and pruning boundaries, and produces an implementation-ready Phase 10.1 roadmap.

### Strict Execution Boundary Adherence
In accordance with mission mandates:
- **Zero code changes:** No React components, API routes, Server Actions, or scripts were modified.
- **Zero Prisma schema or migration changes:** `prisma/schema.prisma` and migrations were untouched.
- **Zero database writes:** No writes to Neon, Supabase, or local test databases.
- **Zero credential or cloud alterations:** No Cloudflare R2 resources were created.
- **Zero auth/CRM alterations:** Phase 7 authentication and Phase 9 CRM remain 100% stable and verified (462/462 tests passing).

---

## 2. Incorporation of Seven Owner-Approved Decisions

Every owner decision is categorized as **[OWNER APPROVED]** and integrated consistently across all architectural documents:

### Decision 1: Draft & Published Content Separation [OWNER APPROVED]
- **Architecture:** Complete isolation between working drafts and published snapshots.
- **Repository Isolation:** Public-facing queries (`getActiveServices()`, `getActivePricingPackages()`, etc.) read strictly from materialized published records. Draft edits occur on `ContentRevision` records and never mutate live public records.
- **Atomic Promotion:** Publishing executes an atomic PostgreSQL transaction promoting an approved revision to the published table. If any step fails, the entire transaction rolls back, leaving public content unchanged.
- **Recovery:** Previous published revisions remain permanently preserved in `ContentRevision`.
- **Preview Isolation:** Draft previews are accessible only to authenticated administrators with active Next.js Draft Mode bypass cookies and emit `X-Robots-Tag: noindex, nofollow`.

### Decision 2: Generic ContentItem + ContentRevision Model [OWNER APPROVED]
- **Evaluation:** Evaluated Pure Generic (Approach A) vs Separate Revision Tables (Approach B) vs Materialized Published Snapshots with Relational Identity (Approach C).
- **Recommendation:** **Approach C (Materialized Snapshots + Relational ContentItem Identity)**.
- **Referential Integrity:** Fully database-enforced foreign keys between `ContentItem`, `ContentRevision`, and domain entities (`Service`, `PricingPackage`, etc.), avoiding unconstrained polymorphic string IDs.
- **Performance:** Public queries execute ultra-fast indexed SQL reads against materialized tables without runtime JSON parsing.

### Decision 3: Revision Retention Policy [OWNER APPROVED]
- **Retention Limits:** Retains up to **20 working draft revisions** per content item.
- **Permanent Preservation:** All published snapshots (`isPublishedSnapshot = true` or referenced as current/historical published versions) are permanently exempt from pruning.
- **Audit Preservation:** Pruning draft snapshots never alters `audit_logs` entries.
- **Restoration Safety:** Restoring an older revision creates a new revision (`versionNumber = max + 1`) rather than mutating historical records.

### Decision 4: Testimonial Verification & Consent Controls [OWNER APPROVED]
- **Decoupled Workflow:** Verification state (`UNVERIFIED`, `VERIFIED`, `REVOKED`) is completely decoupled from publication state (`DRAFT`, `PUBLISHED`).
- **Audit Fields:** Records `verifiedById`, `verifiedAt`, `clientConsentConfirmed`, `consentConfirmedAt`, and `consentEvidenceUrl`.
- **Public Visibility Gate:** Public queries strictly require `verificationStatus === "VERIFIED" AND clientConsentConfirmed === true AND status === "PUBLISHED" AND isActive === true`.
- **No Single Boolean Bypass:** Multi-signature gate prevents unverified endorsements from leaking to the public site.

### Decision 5: Provider-Abstracted Media System [OWNER APPROVED]
- **StorageProvider Interface:** Standardized abstraction supporting `upload`, `delete`, and `getPublicUrl`.
- **Local Filesystem Default:** Development utilizes `/public/uploads` with zero third-party dependencies.
- **Cloudflare R2 Ready:** Architecture is fully S3/R2-compatible for production, configured via environment variables with zero code changes.
- **Metadata as Source of Truth:** Stores `provider` and `storageKey` rather than relying solely on static public URLs.
- **Security:** Magic-byte sniffing, raster re-encoding (stripping metadata), SVG upload restriction, SHA-256 hash renaming.

### Decision 6: GFM Markdown & Strict Server-Side Sanitization [OWNER APPROVED]
- **Format:** GitHub Flavored Markdown (GFM) supporting tables, autolinks, task lists, and strikethrough.
- **Pipeline:** `unified` + `remark-parse` + `remark-gfm` + `remark-rehype` + `rehype-sanitize` + `rehype-stringify`.
- **Sanitization:** Strict schema stripping `<script>`, `<iframe>`, `<object>`, `<embed>`, inline event handlers (`onclick`, `onload`), and javascript URIs.
- **Link Hardening:** Automatically injects `rel="noopener noreferrer"` and `target="_blank"` on external hyperlinks.

### Decision 7: Pricing Publication Permissions [OWNER APPROVED]
- **Role Restrictions:** Publication and live pricing changes restricted strictly to `SUPER_ADMIN` and `ADMIN`.
- **EDITOR Restrictions:** `EDITOR` can draft pricing proposals (`pricing:edit_draft`) but is strictly denied from publishing, archiving, restoring, or altering live pricing in INR.
- **Enforcement:** Enforced server-side in Server Actions via `requirePermission(user, "pricing:publish")`.

---

## 3. Deterministic Lifecycle State Matrix

To eliminate ambiguity during editorial workflows, all edge-case scenarios are explicitly defined:

| Trigger Scenario | Working Revision State | ContentItem Status | Published Materialized Record | Expected Audit Log Event |
|---|---|---|---|---|
| **1. Admin edits published item** | Creates new `ContentRevision` (`WORKING_DRAFT`, v = current + 1) | Remains `PUBLISHED` (points to old revision) | Unchanged (public sees old version) | `CMS_DRAFT_SAVED` |
| **2. Editor submits draft for review** | Revision status changes to `PENDING_REVIEW` | Unchanged | Unchanged | `CMS_SUBMITTED_FOR_REVIEW` |
| **3. Admin rejects revision** | Revision status changes to `REJECTED` (with rejection note) | Unchanged | Unchanged | `CMS_REVISION_REJECTED` |
| **4. Admin publishes revision** | Revision status becomes `APPROVED` | `PUBLISHED` (points to new revision) | Atomically updated with new revision data | `CMS_ITEM_PUBLISHED` |
| **5. Two admins edit simultaneously** | First save increments `versionNumber`. Second save detects drift. | Unchanged | Unchanged | `CMS_CONCURRENCY_CONFLICT` (aborted) |
| **6. Admin restores previous revision** | Creates NEW `ContentRevision` (v = max + 1) with snapshot data | Unchanged | Unchanged (until restored draft is published) | `CMS_VERSION_RESTORED` |
| **7. Published item is archived** | Revision preserved as historical snapshot | `ARCHIVED` (`currentPublishedRevisionId` cleared) | Deactivated (`isActive = false`), unlisted from public queries | `CMS_ITEM_ARCHIVED` |
| **8. Transaction fails during publish** | Rolled back to pre-publish state | Rolled back | Rolled back (zero partial state) | `CMS_PUBLISH_FAILED` |

---

## 4. Phase 10.1 Implementation Task Breakdown

Phase 10.1 is structured into **12 bounded, sequential implementation tasks**:

1. **Task 1: Prisma Schema Refinement:** Define `ContentStatus`, `RevisionLifecycleStatus`, `VerificationStatus` enums, `ContentItem`, `ContentRevision`, `Testimonial`, `MediaAsset`, and domain relation links.
2. **Task 2: Migration Generation & Safety Audit:** Generate migration `20261114000000_admin_cms_foundation` and author down-migration rollback script.
3. **Task 3: Seed Script Synchronization:** Update `prisma/seed.ts` to backfill `ContentItem` records and seed baseline `PageSection` records from `src/config/site.ts`.
4. **Task 4: Storage Provider Subsystem:** Implement `StorageProvider` interface with `LocalStorageProvider` and mock provider for unit tests.
5. **Task 5: ContentItem & Revision Repositories:** Implement `content-items.repo.ts` and `content-revisions.repo.ts` with atomic OCC version checks.
6. **Task 6: Enriched Domain Repositories:** Refactor `services.repo.ts`, `pricing.repo.ts`, `portfolio.repo.ts`, and `faq.repo.ts` to support draft/published separation and offline fallbacks.
7. **Task 7: Testimonial Repository & Verification Gate:** Implement `testimonials.repo.ts` with multi-signature verification and consent records.
8. **Task 8: Media Asset Repository:** Implement `media.repo.ts` with hash-based deduplication and placement alt-text support.
9. **Task 9: Draft Mode Route Handlers:** Implement `/api/draft/preview` and `/api/draft/exit` with secret verification and relative redirect guards.
10. **Task 10: Markdown Rendering & Sanitization Service:** Implement server-side GFM parsing pipeline via `unified` and `rehype-sanitize`.
11. **Task 11: Zod Schemas & Unit Validation Tests:** Author unit tests in `tests/unit/cms-validation.test.ts`.
12. **Task 12: Real PostgreSQL Integration Tests:** Author integration tests in `tests/integration/cms-repositories.integration.test.ts` on `voidtech_test_concurrency`.

---

## 5. Verification & Quality Gates Status

- **Prisma Validation:** `schema.prisma` is valid and untouched.
- **Typecheck:** `tsc --noEmit` reports 0 errors.
- **ESLint:** `next lint` reports 0 warnings, 0 errors.
- **Vitest Suites:** 30 test files, **462 / 462 tests passing** (100%).
- **Playwright E2E:** 21 CRM acceptance tests and 48 website tests passing.
- **Production Build:** 30 / 30 routes compiled cleanly.

---

## 6. Stop Condition & Readiness Statement

Phase 10.0.1 design freeze is **100% complete**. All seven owner decisions are fully integrated and cross-referenced. 

**STOP. DO NOT BEGIN PHASE 10.1.**  
Awaiting explicit project owner authorization before initiating Phase 10.1.

