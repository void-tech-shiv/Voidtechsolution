# PHASE 10.0 — CMS DISCOVERY & ARCHITECTURE REPORT

**Project:** VOIDTECH SOLUTION ("Build. Launch. Grow Online.")  
**Milestone:** Phase 10.0 — CMS Discovery & Architecture (DISCOVERY ONLY)  
**Workspace:** `D:/voidtechsolution`  
**Active Branch:** `session/phase-7-admin-auth`  
**Git Author:** `SHIVANSHU SATYAJEET <satyajeetshivanshu@gmail.com>`  
**Canonical Domain:** `https://voidtechsolution.codedev.co.in/`  
**Execution Mode:** Read-Only Audit & Specification Authoring  
**Timestamp:** 2026-11-13  
**Status:** **DISCOVERY COMPLETE — AWAITING OWNER AUTHORIZATION FOR PHASE 10.1**

---

## 1. Executive Summary & Mission Scope

Phase 10.0 conducts an exhaustive discovery, codebase audit, architectural design, and specification mission for the VOIDTECH SOLUTION Content Management System (CMS). 

The primary objective is to design a secure, maintainable administrative CMS integrated into the existing Next.js App Router and PostgreSQL infrastructure. The CMS will empower authorized VOIDTECH administrators (`SUPER_ADMIN`, `ADMIN`, `EDITOR`) to curate and publish public website content—including services, pricing, portfolio case studies, FAQs, page sections, SEO metadata, and media assets—without touching source code or executing deployments.

### Strict Execution Boundary Adherence
In accordance with mission rules:
- **Zero application code changes:** No modifications were made to React components, Server Actions, Route Handlers, or utilities.
- **Zero Prisma schema or migration changes:** `prisma/schema.prisma` and database migrations were inspected strictly in read-only mode.
- **Zero database writes:** No records were altered, created, or deleted in development or production databases.
- **Zero auth/CRM alterations:** The existing CRM pipeline, session management, and RBAC security remain completely untouched.
- **Zero infrastructure or email operations:** No emails were dispatched; no cloud services were modified.

---

## 2. Initial Codebase & Infrastructure Audit Findings

### 2.1 Git & Version Control State
- **Active Branch:** `session/phase-7-admin-auth` tracking `origin/session/phase-7-admin-auth`.
- **Commit History:** History is linear with 43 verified commits. All author and committer metadata is strictly attributed to `SHIVANSHU SATYAJEET <satyajeetshivanshu@gmail.com>`.
- **Working Tree:** Clean, synchronized with remote origin.

### 2.2 Quality Gates & Existing Test Harness
- **Vitest Suites:** 30 test files, **462 / 462 tests passing** (100% passing across unit, repository, security, and integration suites).
- **Playwright E2E:** 21 CRM acceptance tests and 48 website acceptance tests passing on Microsoft Edge (`msedge`).
- **TypeScript:** Strict mode enabled (`tsconfig.json`), 0 errors.
- **ESLint:** Strict configuration (`next lint`), 0 warnings, 0 errors.
- **Production Build:** Next.js 15.5.29 App Router compiles cleanly with 30 distinct routes.

### 2.3 Existing Reusable Assets & Capabilities

| Capability / Subsystem | Current Implementation | Reusability for CMS |
|---|---|---|
| **Database Schema** | `Service`, `PortfolioProject`, `PricingPackage`, `FAQ`, `SiteSetting` already exist in `schema.prisma`. | **High**: Baseline tables exist. Can be enriched with lifecycle enums (`DRAFT`, `PUBLISHED`, `ARCHIVED`), SEO fields, and revision relations in Phase 10.1. |
| **Data Repositories** | `services.repo.ts`, `pricing.repo.ts`, `portfolio.repo.ts`, `faq.repo.ts`, `settings.repo.ts` implement offline fallbacks. | **High**: Architecture already queries Prisma first and falls back to static configurations when DB is unseeded or offline. |
| **Authentication & Sessions** | Dual-layer security: Web Crypto HMAC signed cookies checked in Edge Middleware; database session validation in Server Components. | **100% Reusable**: CMS routes under `/admin/*` automatically inherit edge-level session verification and sliding-window idle timeout (30m). |
| **RBAC Framework** | `src/server/security/rbac.ts` enforces `requirePermission(user, key)` across 3 roles (`SUPER_ADMIN`, `ADMIN`, `EDITOR`). | **100% Reusable**: Existing keys (`services:manage`, `pricing:manage`, `portfolio:manage`, `faqs:manage`, `settings:manage`) can be mapped directly or refined for granular publish/archive permissions. |
| **Audit Logging Engine** | `recordAuditEvent` in `src/server/security/audit.ts` records actor ID, email, IP, user-agent, entity, and JSON details to `audit_logs`. | **100% Reusable**: Every CMS mutation (create, edit, publish, archive, restore) will emit structured audit logs. |
| **Design System** | Tailored dark cybernetic aesthetic (`#050507`, `#8B5CF6`, `#A855F7`, glass cards, badges, dialogs, sheet drawers). | **100% Reusable**: Admin CMS views will reuse `GlassCard`, `Button`, `Badge`, `Input`, `Textarea`, and Lucide icons. |
| **Admin Shell** | `AdminSidebar` and `AdminHeader` in `src/components/admin/` already provide navigation links for Services, Pricing, Portfolio, FAQs, and Settings. | **100% Reusable**: Sidebar already routes to `/admin/services`, `/admin/pricing`, `/admin/portfolio`, `/admin/faqs`, and `/admin/settings`. |

### 2.4 Codebase Discrepancies & Current Limitations
1. **Rudimentary Admin Client Pages:**
   - `/admin/services`: Read-only catalog with a single toggle for `isActive` via `toggleServiceActiveAction`. No creation, editing, icon selection, reordering, or SEO management.
   - `/admin/pricing`: Read-only view with a toggle for `isActive` via `togglePricingPackageActiveAction`. No package editing, tier adjustments, feature list curation, or custom-quote configuration.
   - `/admin/portfolio`: Read-only view with an inspection modal. Zero mutation capabilities (no create, edit, draft/publish, or image upload).
   - `/admin/faqs`: Simple modal supporting `createFaqAction`. No editing, reordering, deletion, or category curation.
   - `/admin/settings`: Simple key-value string updates for 4 baseline keys (`site_name`, `site_tagline`, `contact_email`, `maintenance_mode`).
2. **Client-Side Hardcoded Pricing Table:**
   - `src/components/sections/pricing-table.tsx` imports static `approvedPricingPackages` from `@/config/pricing` directly in client state. It does not accept packages via props from `PricingRepo`, meaning database changes to pricing packages currently do not reflect on `/pricing`.
3. **Hardcoded Editorial Page Copy:**
   - Headlines, hero subtitles, core values, engineering steps, guarantees, and footer notices across `/`, `/about`, `/services`, `/pricing`, and `/contact` are hardcoded in JSX. The CMS currently has no mechanism to edit section copy without code commits.
4. **CodeRabbit Status:**
   - CodeRabbit CLI v0.9.5 is installed but signed out. External review tokens are unavailable in the local execution sandbox. A comprehensive manual architecture and security review has been performed as the compensating control.

---

## 3. High-Level CMS Architecture & Strategy

### 3.1 Content Architecture: The Hybrid Model
We evaluated three approaches for the VOIDTECH CMS:
1. **Pure Entity Models:** Rigid schema for every page. Inflexible for marketing sections.
2. **Pure Block/Page Builder:** Flexible JSON block stream. Complex for non-developers, prone to layout breaks, and poor relational integrity for structured offerings like services and pricing.
3. **Hybrid Model (RECOMMENDED):**
   - **Structured Relational Entities:** Used for catalog items with uniform fields, foreign relations, and business logic (`Service`, `PricingPackage`, `PortfolioProject`, `FAQ`, `Testimonial`, `MediaAsset`).
   - **Structured Content Blocks / Page Sections:** A normalized `PageSection` model mapping to page routes and section identifiers (e.g. `home.hero`, `about.values`, `pricing.guarantees`) storing strongly-typed JSON configuration and markdown content with draft/publish lifecycles.

### 3.2 Content Lifecycle State Machine
```
[DRAFT]  ---> (Submit for Review) --->  [REVIEW]  ---> (Approve & Publish) --->  [PUBLISHED]
   |                                       |                                         |
   |                                       +-------- (Reject / Revise)               |
   |                                                                                 v
   +------------------------------ (Decommission) -----------------------------> [ARCHIVED]
```
- **DRAFT:** Initial authoring state. Visible only to authenticated administrators within the CMS and via Next.js Draft Mode preview. Never indexed.
- **REVIEW:** Content authored by `EDITOR` awaiting review and approval by an `ADMIN` or `SUPER_ADMIN`.
- **PUBLISHED:** Active live version served to public visitors via SSR / ISR.
- **ARCHIVED:** Soft-deleted or retired content. Unlisted from public routes, preserved in database for historical audits, and restorable.

### 3.3 Robust Revision History & Content Restoration
Rather than relying on simple timestamp comparisons, Phase 10 introduces a dedicated `ContentRevision` model:
- Every save operation can generate a lightweight immutable snapshot (`snapshotData: Json`).
- Incrementing `versionNumber` per entity provides deterministic Optimistic Concurrency Control (OCC).
- Any `ADMIN` or `SUPER_ADMIN` can inspect the diff between revisions and perform a one-click rollback to any historical version.

---

## 4. Media Management Architecture & Low-Cost Storage Analysis

| Storage Solution | Cost Structure | Pros | Cons | Recommendation |
|---|---|---|---|---|
| **Local Filesystem (`/public/uploads`)** | 100% Free | Zero third-party dependencies; works out-of-the-box in local dev and VPS/Docker. | Ephemeral on serverless hosts (e.g. Vercel redeploys wipe local files). | **Default for Local/VPS** |
| **Cloudflare R2** | Free Tier: 10 GB storage, 1M Class A ops/mo, **$0 egress fees** | S3-compatible, global CDN distribution, zero egress fees, persistent on serverless. | Requires Cloudflare account & API tokens. | **Recommended for Production** |
| **Supabase Storage** | Free Tier: 1 GB storage, 2 GB egress/mo | S3/REST API, built-in image resizing, integrates with PostgreSQL. | Strict 1 GB storage cap on free tier. | Viable Alternative |
| **Database Blobs (Bytea / Base64)** | "Free" (uses DB storage) | Zero external setup. | **Severe Anti-pattern**: Bloats DB backups, slows queries, increases memory footprint. | **Strictly Rejected** |

### Proposed Storage Architecture: Storage Provider Adapter
We propose a pluggable `StorageService` interface:
```typescript
export interface StorageProvider {
  uploadFile(file: Buffer, path: string, mimeType: string): Promise<string>;
  deleteFile(path: string): Promise<boolean>;
  getPublicUrl(path: string): string;
}
```
- Defaults to `LocalStorageProvider` (`public/uploads`) for development.
- Allows seamless switching to `R2StorageProvider` via environment variables (`STORAGE_PROVIDER=r2`) with zero codebase refactoring.
- All media uploads validate:
  1. Magic byte MIME type verification (JPEG, PNG, WebP, AVIF, SVG).
  2. Maximum file size: 5 MB for images.
  3. SVG sanitization (stripping `<script>`, `onload`, `javascript:` vectors).
  4. Cryptographic hash-based filenames to defeat path traversal (`../`) attacks.

---

## 5. Trust Content & Anti-Fabrication Governance

In strict accordance with VOIDTECH project principles:
- **No fabricated case studies or simulated metrics:** Concept lab projects are permanently tagged as `projectType: "CONCEPT"` or `"INTERNAL_PROTOTYPE"` with explicit public disclaimers.
- **Testimonial Verification Controls:** The proposed `Testimonial` entity requires:
  - Mandatory `isVerified: Boolean` (default: `false`).
  - `verificationRecord`: Link to verified client contract, email confirmation, or verified review URL.
  - Testimonials cannot enter `PUBLISHED` status unless `isVerified === true` and approved by `SUPER_ADMIN`.
- **Client Logos:** Requires authenticated written consent documentation recorded in audit log details prior to publication.

---

## 6. Public Website Integration & Preview Strategy

### 6.1 Preserving Existing Design & Layouts
The CMS will serve as a headless content provider to the existing Next.js App Router components:
- `src/app/page.tsx` will continue rendering `<CinematicHero />`, `<ServicesFilter />`, `<FaqAccordion />`, etc.
- Instead of reading hardcoded text constants, Server Components will query repositories (`ServicesRepo.getActiveServices()`, `ContentBlocksRepo.getBlock("home.hero")`).
- If content is missing, unseeded, or the database is offline, repositories gracefully return the existing static configurations from `src/config/site.ts` and `src/config/pricing.ts`.

### 6.2 Next.js Draft Mode Preview
- Secure preview route: `/api/draft/preview?secret=...&slug=...&entity=...`.
- Sets secure, encrypted HTTP-only draft cookie via Next.js `draftMode().enable()`.
- Server Components inspect `(await draftMode()).isEnabled`:
  - When enabled: Query draft revisions and render an amber floating "PREVIEW MODE" badge.
  - Automatically emits `<meta name="robots" content="noindex, nofollow" />` to prevent search engine indexing of draft content.
- `/api/draft/exit` disables draft mode and returns to canonical production rendering.

---

## 7. Deliverables Index

The complete architectural specification suite for Phase 10 has been authored and indexed:

1. [docs/phases/PHASE_10_0_CMS_DISCOVERY_REPORT.md](file:///d:/voidtechsolution/docs/phases/PHASE_10_0_CMS_DISCOVERY_REPORT.md) — This discovery audit & architectural synthesis.
2. [docs/architecture/CMS_ARCHITECTURE.md](file:///d:/voidtechsolution/docs/architecture/CMS_ARCHITECTURE.md) — Comprehensive system architecture, content models, lifecycle, and preview engine.
3. [docs/architecture/CMS_DATABASE_DESIGN.md](file:///d:/voidtechsolution/docs/architecture/CMS_DATABASE_DESIGN.md) — Detailed relational schema, entity definitions, indexes, constraints, and audit mappings.
4. [docs/architecture/CMS_API_DESIGN.md](file:///d:/voidtechsolution/docs/architecture/CMS_API_DESIGN.md) — Complete Server Action and API Route contracts, input Zod schemas, output structures, and error codes.
5. [docs/architecture/CMS_RBAC_PERMISSION_MATRIX.md](file:///d:/voidtechsolution/docs/architecture/CMS_RBAC_PERMISSION_MATRIX.md) — Multi-role access control rules across `SUPER_ADMIN`, `ADMIN`, and `EDITOR`.
6. [docs/architecture/CMS_SECURITY_REVIEW.md](file:///d:/voidtechsolution/docs/architecture/CMS_SECURITY_REVIEW.md) — Threat model, XSS prevention, CSRF defense, file upload security, and audit logging.
7. [docs/architecture/CMS_TESTING_STRATEGY.md](file:///d:/voidtechsolution/docs/architecture/CMS_TESTING_STRATEGY.md) — Comprehensive QA plan spanning unit, repository, RBAC, E2E, and regression test suites.
8. [docs/phases/PHASE_10_ROADMAP.md](file:///d:/voidtechsolution/docs/phases/PHASE_10_ROADMAP.md) — Refined milestone roadmap and execution phases (10.0 through 10.4).

---

## 8. Open Decisions Requiring Owner Authorization

Before Phase 10.1 (Database Schema & Repository Hydration) begins, the following strategic decisions require owner sign-off:

1. **Media Storage Provider for Production:**
   - *Option A (Recommended):* Cloudflare R2 (10GB free, $0 egress) with local filesystem fallback for development.
   - *Option B:* Local filesystem exclusively (`/public/uploads`) with persistent disk volume.
2. **Pricing Table Component Integration:**
   - Authorize refactoring `src/components/sections/pricing-table.tsx` so that it accepts server-fetched `packages` as a prop from `PricingRepo.getActivePricingPackages()` rather than importing static `@/config/pricing` on the client.
3. **Content Revisions Retention Policy:**
   - *Policy A (Recommended):* Retain up to 20 historical revisions per entity, auto-pruning older drafts while preserving all publishing events in `audit_logs`.
   - *Policy B:* Unbounded revision history.
4. **Rich Text Authoring Format:**
   - *Format A (Recommended):* GitHub Flavored Markdown (GFM) with live side-by-side preview and strict HTML sanitization.
   - *Format B:* WYSIWYG rich text editor (e.g. Tiptap / ProseMirror).

---

## 9. Conclusion & Next Steps

Phase 10.0 discovery and architecture planning is **100% complete**. All specifications are documented and verified. In strict accordance with mission rules, no application code, schema, migrations, or database records were modified.

**Awaiting Owner Approval to proceed to Phase 10.1 (CMS Database Schema & Content Repositories).**
