# PHASE_10_ROADMAP.md — Admin CMS Implementation Roadmap

**Project:** VOIDTECH SOLUTION ("Build. Launch. Grow Online.")  
**Milestone:** Phase 10 — Admin CMS  
**Document Status:** FROZEN ARCHITECTURAL BLUEPRINT (DESIGN FREEZE AUTHORIZED)  
**Author:** Google DeepMind Assistant  
**Approved By:** SHIVANSHU SATYAJEET (Project Owner) — Design Freeze Authorized  

---

## 1. Executive Summary & Phased Strategy

Phase 10 delivers a production-grade, headless administrative Content Management System (CMS) enabling authorized VOIDTECH administrators (`SUPER_ADMIN`, `ADMIN`, `EDITOR`) to manage the agency's public digital presence without code deployments or developer intervention.

To eliminate risk, prevent regressions with the existing Phase 9 CRM and Phase 7 authentication systems, and ensure strict architectural discipline, Phase 10 is decomposed into **5 sequential milestones**:

```mermaid
flowchart LR
    M10_0["Phase 10.0:<br/>Discovery & Architecture<br/>(COMPLETE)"] --> M10_0_1["Phase 10.0.1:<br/>Refinement & Freeze<br/>(COMPLETE & FROZEN)"]
    M10_0_1 --> M10_1["Phase 10.1:<br/>Database Schema &<br/>Content Repositories<br/>(12 Detailed Tasks)"]
    M10_1 --> M10_2["Phase 10.2:<br/>Admin Dashboard &<br/>Content Management UI"]
    M10_2 --> M10_3["Phase 10.3:<br/>Public Website Integration<br/>& Publishing Engine"]
    M10_3 --> M10_4["Phase 10.4:<br/>Security, E2E Testing<br/>& Final Acceptance"]
```

---

## 2. Milestone Breakdown & Status

### Phase 10.0: CMS Discovery & Architecture (COMPLETE)
- **Status:** **COMPLETE** (Read-Only Audit & Specification Authoring)
- **Key Deliverables:** Baseline discovery report, architecture, database design, API design, RBAC matrix, security review, testing blueprint, and execution roadmap.

---

### Phase 10.0.1: CMS Architecture Refinement & Design Freeze (COMPLETE & FROZEN)
- **Status:** **COMPLETE & FROZEN** (Read-Only Architecture & Design Freeze)
- **Key Deliverables:**
  - `PHASE_10_0_1_ARCHITECTURE_REFINEMENT_REPORT.md`: Comprehensive design freeze charter and architectural decisions register.
  - `CMS_ARCHITECTURE.md`: Incorporated 7 owner-approved decisions, Approach A/B/C evaluation matrix, deterministic lifecycle state machine, GFM Markdown pipeline, and offline fallback guarantees.
  - `CMS_DATABASE_DESIGN.md`: Approach C ERD, Prisma models for `ContentItem`, `ContentRevision`, `Testimonial`, `MediaAsset`, and domain relation links.
  - `CMS_API_DESIGN.md`: Standardized response envelopes, Server Action contracts, atomic publishing transactions, testimonial verification, and media upload pipeline.
  - `CMS_RBAC_PERMISSION_MATRIX.md`: 3-role matrix with `pricing:publish` restricted to `SUPER_ADMIN`/`ADMIN` and `pricing:edit_draft` for `EDITOR`.
  - `CMS_SECURITY_REVIEW.md`: 15-scenario threat matrix (SEC-01 through SEC-15) with mitigations and verification tests.
  - `CMS_TESTING_STRATEGY.md`: 5-tier testing blueprint with 15 security verification tests.
  - `PHASE_10_ROADMAP.md`: Detailed 12-task Phase 10.1 implementation plan with strict prerequisites.

---

### Phase 10.1: CMS Database Schema & Content Repositories (PENDING OWNER AUTHORIZATION)
- **Objective:** Establish the persistent database, domain models, storage abstraction, and repository foundation for all CMS content models using Approach C.
- **Execution Boundary:** This milestone begins ONLY after explicit owner authorization.

#### Detailed 12-Task Implementation Plan:

| Task ID | Task Title & Scope | Dependencies & Prerequisites | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| **Task 10.1.1** | **Prisma Schema Additions & Relations**<br/>Define `ContentType`, `ContentStatus`, `ApprovalStatus`, `StorageProviderType` enums. Add `ContentItem`, `ContentRevision`, `Testimonial`, and `MediaAsset` models. Add relation links to `Service`, `PricingPackage`, `PortfolioProject`, `PageSection`, `FAQ`. | None (Schema Authoring) | `npx prisma validate` passes with 0 errors. All models conform exactly to `CMS_DATABASE_DESIGN.md`. |
| **Task 10.1.2** | **PostgreSQL Migration Generation & Verification**<br/>Generate migration `20261114000000_admin_cms_foundation`. Apply to development/test databases. Author reversible down-migration script. | Task 10.1.1 | Migration applies cleanly to PostgreSQL without data loss. Reversible script verified. |
| **Task 10.1.3** | **Prisma Client Generation & Type Export**<br/>Execute `prisma generate` to produce updated client types. Export shared TypeScript models and DTO interfaces in `@/types/cms`. | Task 10.1.2 | `npm run typecheck` passes with 0 errors. All new models accessible via `@prisma/client`. |
| **Task 10.1.4** | **Base Zod Validation Schemas**<br/>Implement Zod schemas in `@/lib/validations/cms.ts` for all content types: `serviceSchema`, `pricingPackageSchema`, `portfolioProjectSchema`, `testimonialSchema`, `pageSectionSchema`, `faqSchema`, `mediaAssetSchema`. | Task 10.1.3 | Comprehensive unit tests pass (Tier 1: 35+ assertions). Validates length, slug regex, positive pricing, and sanitized inputs. |
| **Task 10.1.5** | **ContentItem & ContentRevision Repository (Approach C)**<br/>Implement `src/lib/repositories/cms/content-item.repo.ts` and `revision.repo.ts`. Handle canonical identity creation, revision retrieval, and diff generation. | Task 10.1.3, 10.1.4 | Repository methods create canonical items and append immutable revisions. Draft isolation strictly maintained. |
| **Task 10.1.6** | **Atomic OCC Version Locking & Publishing Transaction**<br/>Implement optimistic concurrency control check (`version === expectedVersion`) and atomic `publishContentItem` transaction promoting revision data to domain tables. | Task 10.1.5 | Stale version updates throw `ConcurrencyConflictError`. Publish atomically updates `ContentItem`, `ContentRevision`, and domain table with rollback on failure. |
| **Task 10.1.7** | **Draft Revision Retention & Auto-Pruning Engine**<br/>Implement retention pruning logic in `revision.repo.ts`. Retain maximum 20 working draft revisions per content item. Exempt all published revisions permanently. | Task 10.1.5 | Revisions > 20 pruned when `status = DRAFT`. Zero published revisions ever deleted. |
| **Task 10.1.8** | **Domain Content Repositories Implementation**<br/>Enhance `services.repo.ts`, `pricing.repo.ts`, `portfolio.repo.ts`, `faq.repo.ts`, and implement `page-sections.repo.ts`, `testimonials.repo.ts`. | Task 10.1.6 | Domain queries read materialized tables. Public queries filter by `isActive = true`. Testimonials require `isVerified && clientConsentConfirmed`. |
| **Task 10.1.9** | **StorageProvider Abstraction & Local Filesystem Provider**<br/>Implement `StorageProvider` interface in `@/lib/storage/types.ts`. Implement `LocalFileSystemStorageProvider` in `@/lib/storage/local-provider.ts` with directory traversal protection. | Task 10.1.3 | Files written safely to `public/uploads/` with sanitized keys. Relative path escapes blocked. |
| **Task 10.1.10** | **Media Asset Processing Pipeline**<br/>Implement `MediaService` in `@/lib/services/media.service.ts`. Integrate `sharp` for raster conversion (WebP) and `DOMPurify` for SVG sanitization. Magic-byte MIME detection. | Task 10.1.9 | Disguised binaries rejected. WebP thumbnails generated. SVGs sanitized or restricted to `SUPER_ADMIN`/`ADMIN`. |
| **Task 10.1.11** | **GFM Markdown Parser Utility**<br/>Implement Markdown-to-HTML parser using `unified`, `remark-gfm`, `remark-rehype`, `rehype-sanitize`, `rehype-external-links`, `rehype-stringify`. | Task 10.1.4 | Script tags, onerror handlers, iframe tags stripped. GFM tables, bold, italics, autolinks rendered cleanly with `rel="noopener noreferrer"`. |
| **Task 10.1.12** | **Database Seeding & Offline Static Fallback Integration**<br/>Update `prisma/seed.ts` with baseline content. Wire hardcoded fallback registries (`@/config/*`) into repository catch blocks on DB disconnect. | Task 10.1.8, 10.1.11 | Database disconnect test passes: public repository calls return static fallback registries with structured logging without crashing. |

- **Exit Criteria for Phase 10.1:**
  - All 12 tasks completed and verified with automated test suites.
  - 100% test pass rate across Vitest Tier 1 & Tier 2 suites on real PostgreSQL.
  - Zero regressions on existing 462 Vitest tests and 21 Playwright CRM tests.
  - Production build `npm run build` passes with 0 errors.

---

### Phase 10.2: CMS Admin Dashboard & Content Management UI
- **Objective:** Build the interactive, responsive administration interfaces inside the existing `/admin/*` dashboard.
- **Scope:**
  - CMS Overview Dashboard (`/admin/cms`).
  - Services Management UI (`/admin/cms/services`).
  - Pricing Tiers Management UI (`/admin/cms/pricing`) with role-based publish restrictions.
  - Portfolio & Case Studies UI (`/admin/cms/portfolio`).
  - Testimonial Verification & Consent Drawer (`/admin/cms/testimonials`).
  - Knowledgebase & FAQs UI (`/admin/cms/faqs`).
  - Editorial Page Sections UI (`/admin/cms/sections`).
  - Media Library & Drag-and-Drop Uploader (`/admin/cms/media`).
  - Revision History & Visual Diff Rollback Drawer.
- **Exit Criteria:** Responsive across 10 viewports, full ARIA a11y compliance, Zod form validation.

---

### Phase 10.3: Public Website CMS Integration & Publishing Engine
- **Objective:** Connect public routes to CMS repositories with instant on-demand cache revalidation and Next.js Draft Mode previews.
- **Scope:**
  - Public route refactoring: `/`, `/about`, `/services`, `/pricing`, `/portfolio`, `/contact`.
  - Next.js Draft Mode preview subsystem (`/api/draft/preview`, `/api/draft/exit`) with amber HUD banner.
  - Mandatory `X-Robots-Tag: noindex, nofollow` on draft previews.
  - On-demand cache tag revalidation (`revalidatePath`, `revalidateTag`).
  - Seamless offline static fallback resilience.
- **Exit Criteria:** Dynamic content renders on public site; cache invalidates instantly on publish; draft mode isolated.

---

### Phase 10.4: Security, E2E Testing & Final Acceptance
- **Objective:** Exhaustive quality assurance, security penetration audit, visual proofs across 10 viewports, and formal sign-off.
- **Scope:**
  - Complete Playwright E2E browser test suite (`tests/e2e/cms-acceptance.spec.ts`).
  - Verification of all 15 security test cases (SEC-01 through SEC-15).
  - Multi-viewport visual screenshot captures across 10 viewports (320px–1920px).
  - Performance benchmarking (< 100ms response times).
  - Final acceptance report authored and approved.
- **Exit Criteria:** All 6 quality gates green; zero defects; formal owner authorization.

---

## 3. Dependency Graph & Risk Mitigation

| Identified Risk | Impact | Mitigation Strategy |
|---|:---:|---|
| **Public Site Layout Regression** | High | CMS data feeds into existing, hardened layout components (`<CinematicHero />`, `<PricingTable />`). Fallback configs guarantee zero visual degradation. |
| **Pricing Table Client Discrepancy** | High | Refactor `PricingTable` in Phase 10.3 to accept server-fetched `packages` as a prop while preserving static `@/config/pricing` as the default fallback. |
| **Unpublished Draft Search Indexing** | Critical | Mandatory `<meta name="robots" content="noindex, nofollow" />` and `X-Robots-Tag: noindex, nofollow` emitted whenever Draft Mode is active. |
| **Concurrent Editorial Overwrites** | Medium | Monotonic integer `version` OCC locking aborts conflicting saves and triggers side-by-side visual diff resolution. |
| **Serverless Ephemeral Storage** | Medium | Implement abstracted `StorageProvider` interface supporting Cloudflare R2 / S3 for persistent cloud storage with local filesystem fallback for development. |
| **Testimonial Legal Liability** | High | Dual-gate verification: Requires both `isVerified = true` (admin action) AND `clientConsentConfirmed = true` before publication can succeed. |
