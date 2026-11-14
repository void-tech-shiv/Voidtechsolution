---
updated: 2026-11-15T04:42:00+05:30
---

# Project State — VOIDTECH SOLUTION

## Current Position

**Milestone:** Neon Database Deployment & Verification Complete (Option B Applied to Primary Branch `br-little-bird-bejretq1`)
**Phase:** Development Environment & Neon Repair — Complete
**Status:** complete (All 5 Prisma migrations deployed and verified on Neon PostgreSQL database `neondb` on endpoint `ep-little-credit-beuthfde`; database schema is 100% up to date; all 22 application tables exist; all CRM and CMS columns, enums, triggers, and foreign keys active; Next.js 15 dev server verified serving all core routes with HTTP 200; 741/741 regression tests passing; 0 TypeScript errors; 0 ESLint warnings).
**Visual Reference:** SmartStruct Cybernetic Layout + Official Purple/Violet Brand Identity  

## Last Action

- Executed Option B Live Neon Deployment:
  - Diagnosed historical failed record for `20261113000000_crm_lead_pipeline` (failed with PostgreSQL `55P04` due to uncommitted enum values being used in updates within the same transaction).
  - Resolved `55P04` by cleanly isolating DDL (`ALTER TYPE`, `ALTER TABLE`, `CREATE TABLE`, `CREATE INDEX`, note backfill) to `20261113000000` and all status mapping data updates (`IN_REVIEW -> CONTACTED`, `CONVERTED -> WON`, `ARCHIVED -> ON_HOLD`, `CLOSED -> ON_HOLD`) to `20261113010000`.
  - Cleared failed migration row using schema-engine resolution protocol.
  - Successfully ran `npx.cmd prisma migrate deploy`:
    - `20261113000000_crm_lead_pipeline` applied.
    - `20261113010000_crm_status_mapping_correction` applied.
    - `20261114000000_admin_cms_foundation` applied.
  - Confirmed with `prisma migrate status`: `Database schema is up to date!`.
  - Ran `npm.cmd run db:verify`: All tables, migration history, Prisma delegates, and seed counts passed.
  - Verified Next.js dev server live runtime on core routes: `/`, `/services`, `/portfolio`, `/pricing`, `/contact`, `/admin/login` all return HTTP 200.
  - Ran complete test suite: 741/741 tests passing across 58 test files; typecheck and lint passing with zero errors.

## Next Steps

1. Development environment is fully repaired and Neon PostgreSQL database is synchronized.
2. Proceed to next authorized phase / task.

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
