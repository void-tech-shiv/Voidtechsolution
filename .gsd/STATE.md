---
updated: 2026-11-13T19:04:00+05:30
---

# Project State — VOIDTECH SOLUTION

## Current Position

**Milestone:** 10.1 — CMS Database Schema & Content Repositories (Task 10.1.2.1 COMPLETE)  
**Phase:** 10 — Admin CMS  
**Status:** active (Phase 10.1 In Progress: Task 10.1.2.1 Integrity Closure Complete. Designed and verified declarative Composite Foreign Keys on `content_items` and `protect_revision_immutability()` trigger on `content_revisions`. Proved published snapshot immutability, revision reassignment rejection, cross-item pointer defense, and draft pruning on isolated local test DB `voidtech_test_concurrency` with 100% pass rate. Classified rollback data loss taxonomy; documented Prisma tracking state without unauthorized modification. Production Neon completely isolated and untouched)  
**Visual Reference:** SmartStruct Cybernetic Layout + Official Purple/Violet Brand Identity  

## Last Action

- Executed Task 10.1.2.1 — PostgreSQL Migration Integrity Closure Audit:
  - Authored audit report: `docs/phases/PHASE_10_1_2_1_INTEGRITY_CLOSURE_REPORT.md`.
  - Added unique composite index `content_revisions_contentItemId_id_key` on `content_revisions("contentItemId", "id")`.
  - Added declarative composite foreign keys on `content_items`:
    - `content_items_published_revision_ownership_fkey` (`ON DELETE RESTRICT ON UPDATE RESTRICT`).
    - `content_items_working_revision_ownership_fkey` (`ON DELETE SET NULL ("currentWorkingRevisionId") ON UPDATE RESTRICT`).
  - Added custom PostgreSQL trigger function `protect_revision_immutability()` and trigger `trg_protect_revision_immutability` on `content_revisions` (BEFORE UPDATE) blocking unpublishing, content mutation on snapshots, and revision reassignment.
  - Updated `down.sql` to drop composite foreign keys, unique index, and immutability trigger.
  - Verified 10 empirical tests: snapshot mutation rejected, snapshot unpublishing rejected, revision reassignment rejected, cross-item pointers rejected, draft pruning verified with automatic pointer NULLing, and rollback/re-apply verified.
  - Formalized rollback taxonomy: `down.sql` explicitly documented as data-destructive (schema-reversible only).
  - Inspected and honestly reported Prisma migration tracking: `_prisma_migrations` does not exist in local test DB; zero modifications made without authorization.
  - Maintained strict database safety: production Neon was never accessed, migrated, or modified.

## Next Steps

1. Present Task 10.1.2.1 Final Integrity Closure Report to Owner.
2. Await Owner Authorization before beginning Task 10.1.3 (Prisma Client Generation & Type Export).

## Active Decisions

| Decision | Choice | Made | Affects |
|---|---|---|---|
| Super Admin Invariant | Strictly EXACTLY ONE SUPER_ADMIN across lifecycle | 2026-11-12 | RBAC, Repo, Bootstrap |
| Concurrency Lock | PostgreSQL advisory xact lock `super_admin_lifecycle_lock` | 2026-11-12 | `users.repo.ts`, DB |
| Master Protection | Master account cannot be deleted, demoted, or deactivated | 2026-11-12 | `rbac.ts`, `users.repo.ts` |
| Non-Escalation | Self-role change, self-deactivation, and admin creation by non-super blocked | 2026-11-12 | `rbac.ts`, `users.repo.ts` |
| Admin Portal | Single unified `/admin/login` for all roles | 2026-11-12 | Route, UI, Auth actions |
| Edge Verification | Web Crypto HMAC cookie check in middleware; DB check in Server Components | 2026-11-12 | `cookie.ts`, `middleware.ts` |
| Open Redirect Guard | Strict relative URL validator for all callback redirects | 2026-11-12 | `cookie.ts`, Middleware, Form |
| Bootstrap Protocol | Interactive CLI only (`npm run admin:create`) | 2026-11-12 | Provisioning, Seeds, Docs |
| Hidden Input | Raw mode terminal input without echo across platforms | 2026-11-12 | `create-admin.ts`, CLI |
| Non-TTY Rejection | Abort immediately if stdin is not a TTY; zero visible fallback | 2026-11-12 | `create-admin.ts`, Security |
| Real Integration DB | Isolated local PostgreSQL `voidtech_test_concurrency` on port 5432 | 2026-11-12 | Concurrency Tests |
| Audit Integrity | Three-tier taxonomy: app append-only, decoupled DB FKs, external WORM | 2026-11-12 | `audit.ts`, `audit.repo.ts`, Docs |
| Admin 404 Remediation | All 8 sidebar destinations mapped to active server routes with RBAC protection | 2026-11-12 | Admin App Router, Navigation |
| Authenticated RBAC Testing | Full 11-operation matrix verified across unit, integration, and Playwright E2E | 2026-11-12 | QA, Security, Admin Routes |
| CRM Lifecycle Model | 8-stage state machine (`NEW`, `CONTACTED`, `QUALIFIED`, `PROPOSAL_SENT`, `NEGOTIATION`, `WON`, `LOST`, `ON_HOLD`) | 2026-11-13 | Architecture, DB, UI |
| Relational Note Threading | Normalized `LeadNote` child entity replacing single string `internalNotes` | 2026-11-13 | DB Schema, Repos, UI |
| Internal Note Isolation | Internal notes strictly excluded from customer email templates | 2026-11-13 | Email System, Security |
| Atomic Database OCC | `updateMany({ where: { id, updatedAt } })` eliminating TOCTOU & tolerance window | 2026-11-13 | `enquiries.repo.ts`, Integration |
| Single Active Assignment | Partial unique index `lead_assignments_single_active_unique` on `(enquiryId) WHERE isActive = true` | 2026-11-13 | DB Schema, LeadAssignmentsRepo |
| Recipient Isolation | `AdminNotification` strictly partitioned by `recipientId` | 2026-11-13 | NotificationsRepo, Security |
| Dynamic Follow-up Sync | `syncEnquiryNextFollowUpAt` computes earliest active uncompleted task | 2026-11-13 | `lead-followups.repo.ts` |
| GitHub Remote Backup | Verified fast-forward push to `https://github.com/void-tech-shiv/Voidtechsolution.git` | 2026-11-13 | Version Control, Backup |
| CMS Content Model | Hybrid Model: Normalized relational entities + `PageSection` blocks | 2026-11-13 | CMS Architecture, DB |
| CMS Lifecycle States | 4-stage machine: `DRAFT`, `REVIEW`, `PUBLISHED`, `ARCHIVED` | 2026-11-13 | CMS Architecture, UI |
| CMS Concurrency Engine | Monotonic integer `version` OCC counter + immutable `ContentRevision` snapshots | 2026-11-13 | Database, Server Actions |
| Media Storage Strategy | Pluggable `StorageService`: local `/public/uploads` dev + Cloudflare R2 production | 2026-11-13 | Media Management, Storage |
| Trust & Anti-Fabrication | Mandatory `isVerified` record on testimonials; concept lab disclaimers enforced | 2026-11-13 | Database, Content Governance |
| CMS Draft Isolation (Decision 1) | Public queries read materialized published records only; unpromoted drafts isolated in Draft Mode | 2026-11-13 | CMS Architecture, Repos |
| CMS Architecture Evaluation (Decision 2) | Approach C selected: Materialized Snapshots + Canonical ContentItem + Relational Revisions | 2026-11-13 | CMS Database Design, Repos |
| CMS Revision Retention (Decision 3) | Retain up to 20 working draft revisions; published snapshots permanently exempt; rollbacks append v=max+1 | 2026-11-13 | Database, Revision Engine |
| Testimonial Verification & Consent (Decision 4) | Dual gate: Decoupled verification & consent; requires consent=true AND status=VERIFIED to publish | 2026-11-13 | Database, Testimonials Repo, RBAC |
| Provider-Abstracted Storage (Decision 5) | `StorageProvider` interface; local filesystem dev; Cloudflare R2 production; restricted SVG uploads | 2026-11-13 | Storage, Media Service, Security |
| Markdown Sanitization (Decision 6) | AST-based GFM pipeline: `unified` + `remark-gfm` + `rehype-sanitize`; strips scripts, handlers, iframes | 2026-11-13 | Markdown Utilities, Security |
| Pricing Publication RBAC (Decision 7) | `pricing:publish` restricted to `SUPER_ADMIN` and `ADMIN`; `EDITOR` limited to `pricing:edit_draft` | 2026-11-13 | RBAC, Server Actions, UI |
| Dual-Pointer Revision Separation (Safeguard 1) | `currentPublishedRevisionId` + `currentWorkingRevisionId` on ContentItem; simultaneous draft editing & live view | 2026-11-13 | CMS Architecture, Database, Repos |
| Referential Integrity Invariants (Safeguard 2) | Database FKs on parent links, pointers, uniqueness; Step 4 asserts revision ownership; trigger verification | 2026-11-13 | Database Design, Publishing Engine |
| 9-Step Atomic Publishing Transaction (Safeguard 3) | Strict 9-step atomic transaction; failure rolls back all; OCC conflict triggers visual diff without overwrite | 2026-11-13 | Server Actions, API Design |
| Testimonial Verification & Legal Consent (Safeguard 4) | Single authoritative `verificationStatus` + `clientConsentStatus`; consent revocation immediately unlists at SQL level | 2026-11-13 | Testimonials Repo, DB, Security |
| Hardened Media Security Defaults (Safeguard 5) | Strictly JPEG/PNG/WebP; SVG disabled by default; Sharp raster sanitization; zero ephemeral serverless storage | 2026-11-13 | Media Service, Storage, Security |
| Comprehensive Static Fallback Matrix (Safeguard 6) | 5 operational scenarios; `X-Voidtech-Content-Source` header & `isFallback` flag; never silently present stale data | 2026-11-13 | Public RSC, Repos, Error Handling |
| Task 10.1.1 Schema Implementation | Approach C Prisma schema implemented with dual pointers, 6 enums, 5 models, and validated with 0 errors | 2026-11-13 | `prisma/schema.prisma`, Phase 10.1 |
