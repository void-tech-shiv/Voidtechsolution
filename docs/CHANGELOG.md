# CHANGELOG.md — VOIDTECH SOLUTION

All notable changes to the VOIDTECH SOLUTION platform are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.10.0] — 2026-11-13
### Phase 10.0: Admin CMS Discovery & Architecture

#### Added
- **Comprehensive CMS Discovery & Codebase Audit Report (`docs/phases/PHASE_10_0_CMS_DISCOVERY_REPORT.md`):**
  - Read-only audit of existing data layer, repositories, public routes, admin pages, RBAC framework, and test infrastructure.
  - Identification of reusable assets, codebase discrepancies, and media storage options.
  - Documented CodeRabbit limitation (signed out) and manual architectural/security review findings.
- **CMS Architecture & System Blueprint (`docs/architecture/CMS_ARCHITECTURE.md`):**
  - Full hybrid content strategy: normalized relational entities for structured catalogs combined with `PageSection` blocks for editorial page narrative.
  - 4-stage content lifecycle: `DRAFT` -> `REVIEW` -> `PUBLISHED` -> `ARCHIVED`.
  - Immutable revision snapshotting and atomic Optimistic Concurrency Control (OCC) versioning engine.
  - Next.js Draft Mode preview system with signed secret tokens, `__prerender_bypass` cookies, and `noindex, nofollow` safeguards.
  - Pluggable media storage provider architecture (local filesystem default; Cloudflare R2 production recommendation with zero egress fees).
- **CMS Database Design & Schema Specifications (`docs/architecture/CMS_DATABASE_DESIGN.md`):**
  - Proposed enhancements for `Service`, `PricingPackage`, `PortfolioProject`, and `FAQ` models with publication timestamps, version counters, and SEO fields.
  - Proposed new models: `PageSection`, `ContentRevision`, `Testimonial`, and `MediaAsset`.
  - Detailed Entity-Relationship Diagram (ERD), index strategies, and audit action mappings.
- **CMS Server Action & API Contracts (`docs/architecture/CMS_API_DESIGN.md`):**
  - Strict Server Action interfaces across services, pricing, portfolio, FAQs, page sections, revisions, and media.
  - Discriminated union response envelope and error taxonomy (`UNAUTHENTICATED`, `FORBIDDEN`, `VALIDATION_FAILED`, `CONFLICT_DETECTED`).
- **CMS Role-Based Access Control Matrix (`docs/architecture/CMS_RBAC_PERMISSION_MATRIX.md`):**
  - Fine-grained permission keys mapping across `SUPER_ADMIN`, `ADMIN`, and `EDITOR`.
  - Strict commercial protections: `EDITOR` denied from modifying pricing, publishing live content, or altering SEO directives.
- **CMS Security Review & Threat Analysis (`docs/architecture/CMS_SECURITY_REVIEW.md`):**
  - Comprehensive threat model covering Stored XSS, RCE via file uploads, CSRF, draft leakage, and commercial defamation.
  - AST-based Markdown and SVG DOMPurify sanitization rules, magic-byte MIME sniffing, SHA-256 file renaming.
- **CMS Quality Assurance & Testing Strategy (`docs/architecture/CMS_TESTING_STRATEGY.md`):**
  - 5-tier testing blueprint spanning unit validation, real PostgreSQL repository integration, RBAC security, public integration, and Playwright E2E browser tests across 10 viewports.
- **Phase 10 Execution Roadmap (`docs/phases/PHASE_10_ROADMAP.md`):**
  - Detailed execution phases 10.0 through 10.4 with concrete deliverables, dependencies, and exit criteria.

---

## [0.9.3] — 2026-11-13
### Phase 9.3: CRM End-to-End Testing, Security Validation & Visual Acceptance

#### Added
- **Real PostgreSQL Lead Lifecycle Integration Suite (`tests/integration/crm-lifecycle.integration.test.ts`):**
  - 9 automated tests validating the complete lifecycle on an isolated PostgreSQL test database (`voidtech_test_concurrency`).
  - Covers public website contact form intake, operational lead assignment, in-app notification dispatch, internal note creation & pinning, follow-up task scheduling with automatic `nextFollowUpAt` cache synchronization, progressive 5-stage pipeline transitions, and 3 distinct commercial outcomes (WON with revenue recognition, LOST with mandatory `lostReason` validation, ON_HOLD).
- **Multi-Role RBAC Security Matrix Suite (`tests/integration/crm-rbac-security.integration.test.ts`):**
  - 19 automated security tests validating `SUPER_ADMIN`, `ADMIN`, and `EDITOR` authorization rules across pages, Server Actions, and REST routes.
  - Enforces notification recipient isolation (`where: { recipientId: user.id }`), cross-admin mark-read rejection, note deletion restriction to `SUPER_ADMIN`, session cookie signature verification, and sensitive credential (`passwordHash`) scrubbing.
- **PostgreSQL Concurrency & Data Integrity Suite (`tests/integration/crm-concurrency.integration.test.ts`):**
  - 4 automated integration tests validating Optimistic Concurrency Control (OCC) timestamp drift detection, atomic assignment unique index constraints, and append-only activity audit logging.
- **Synthetic Performance & Query Profiling Benchmarks (`tests/integration/crm-performance.integration.test.ts`):**
  - 5 automated benchmark tests evaluating CRM aggregation, 8-stage grouping, search filtering, and category queries across 10, 100, 500, and 1,000 synthetic leads.
  - Validates zero N+1 queries during full 5-tab drawer hydration (7.54 ms response time).
- **Playwright E2E Browser Acceptance & Visual Proofs (`tests/e2e/crm-acceptance.spec.ts`):**
  - 21 automated browser acceptance tests running on Microsoft Edge.
  - Captures 12 high-resolution screenshots across 10 responsive viewports (320px, 360px, 375px, 390px, 430px, 768px, 1024px, 1280px, 1440px, 1920px) and 2 drawer states (375px mobile and 1440px desktop).
- **Comprehensive Milestone Acceptance Report (`docs/PHASE_9_3_CRM_ACCEPTANCE_REPORT.md`):**
  - Complete documentation of methodology, test matrices, benchmark timings, accessibility review, defect register, CodeRabbit status, and final sign-off verdict.

#### Changed
- Fixed TypeScript optional property strictness and unused imports across test suites.
- Updated `playwright.config.ts` webServer command to use `npm.cmd` on Windows.
- Increased overall automated test suite count from 429 to **462 tests** (30 suites, 100% passing).

---

## [0.9.2] — 2026-11-13
### Phase 9.2: Admin Lead Management & CRM Pipeline — Dashboard UI, Kanban Board & Integrated Lead Workflows

#### Added
- **CRM Dashboard & Authenticated Route (`src/app/admin/(dashboard)/crm/page.tsx`):**
  - Full-featured administrative CRM dashboard at `/admin/crm` with server prefetching of KPI metrics, 8-stage Kanban columns, active admins, and unread notification counts.
  - Edge middleware and RBAC protection enforcing `enquiries:view` permission.
  - Integrated into administrative navigation in `AdminSidebar` with `LayoutGrid` icon and `AdminHeader` with `AdminNotificationsBell`.
- **Commercial Performance KPIs (`src/components/admin/crm/crm-dashboard-kpis.tsx`):**
  - 6 real-time aggregated metric cards: Total Leads, New Leads, Active Pipeline Value (INR), Won Revenue (INR), Win Rate (%), and Overdue Follow-ups.
  - Interactive stage distribution bar visualizing counts and revenue across all 8 pipeline stages.
  - Formatted Indian Rupee currency representation (`₹X,XX,XXX`).
- **8-Stage Kanban Pipeline Board (`src/components/admin/crm/crm-kanban.tsx`, `crm-stage-column.tsx`, `crm-lead-card.tsx`):**
  - Horizontal scrolling board supporting `NEW`, `CONTACTED`, `QUALIFIED`, `PROPOSAL_SENT`, `NEGOTIATION`, `WON`, `LOST`, `ON_HOLD`.
  - HTML5 native drag-and-drop combined with accessible quick-action kebab menus.
  - Optimistic UI updates with column totals recalculation.
  - Concurrency Conflict Recovery: atomic Optimistic Concurrency Control (OCC) enforcing `expectedUpdatedAt`; automatically rolls back optimistic updates on conflict and displays an amber notification banner with a "Refresh Board" control.
  - Mandatory Lost Reason Dialog (`src/components/admin/crm/crm-lost-reason-modal.tsx`): requires a non-empty `lostReason` with presets before moving any lead to `LOST`.
- **Deep Lead Inspection Drawer (`src/components/admin/crm/crm-lead-drawer.tsx`):**
  - 5-tab slide-over sheet: Overview, Internal Notes, Activity Timeline, Follow-ups, and Assignments.
  - Pinned and confidential internal notes engine with `SUPER_ADMIN` deletion capability.
  - Immutable activity history tracking stage movements, assignments, and notes.
  - Follow-up task scheduling with priority badges (`URGENT`, `HIGH`, `MEDIUM`, `LOW`) and checkbox completion.
  - Lead reassignment to active administrators with assignment notes.
- **Dedicated Follow-up Management View (`src/components/admin/crm/crm-followups-view.tsx`):**
  - Task management view with tabs: Upcoming, Overdue, Completed, All.
  - Priority filter dropdown and direct deep-linking into parent lead drawer.
- **Recipient-Isolated Notifications Bell (`src/components/admin/admin-notifications-bell.tsx`):**
  - Header bell with unread count badge.
  - Popover action feed displaying new lead arrivals, assignment notices, and overdue task alerts.
  - Strictly isolated to the calling administrator's ID (`recipientId === auth.admin.id`).
- **CRM Server Actions & Validation Layer:**
  - `src/validations/crm.ts`: Zod validation schemas with refined mandatory `lostReason` invariant.
  - `src/server/actions/crm.actions.ts`: 12 secure server operations enforcing RBAC, origin verification, and audit logging.
- **Verification & Documentation:**
  - Authored `tests/unit/crm-actions.test.ts` (18 tests) and `tests/unit/crm-ui.test.tsx` (12 tests).
  - All 429 Vitest tests passing across 27 suites.
  - 30 production routes built cleanly with 0 TypeScript and 0 ESLint errors.
  - Comprehensive milestone report: `docs/PHASE_9_2_CRM_IMPLEMENTATION_REPORT.md`.

---

## [0.9.1] — 2026-11-13
### Phase 9.1: Database Schema Migration & Model Hydration

#### Added
- **Database Schema Migration (`prisma/migrations/20261113000000_crm_lead_pipeline/migration.sql`):**
  - Expanded `EnquiryStatus` enum from legacy 6 values to the approved 8 CRM stages: `NEW`, `CONTACTED`, `QUALIFIED`, `PROPOSAL_SENT`, `NEGOTIATION`, `WON`, `LOST`, `ON_HOLD`.
  - Added CRM tracking fields to `enquiries`: `assignedAdminId`, `estimatedValueInr`, `source` (default `WEBSITE_CONTACT_FORM`), `lastContactedAt`, `nextFollowUpAt`, and `lostReason`.
  - Added new models: `LeadNote`, `LeadFollowUp`, `LeadActivity`, `LeadAssignment`, and `AdminNotification`.
  - Created partial unique index `lead_assignments_single_active_unique` on `(enquiryId) WHERE isActive = true` guaranteeing at most one active administrator per lead.
  - Backfilled existing legacy `internalNotes` into `LeadNote` rows with `"LEGACY_MIGRATION"` author attribution.
  - Authored comprehensive disaster recovery guide `docs/MIGRATION_ROLLBACK_CRM.md`.
- **Domain Repositories (`src/server/repositories/`):**
  - `src/server/repositories/lead-notes.repo.ts`: `createLeadNote`, `getLeadNotes` (pinned first), `togglePinLeadNote`, `deleteLeadNote`.
  - `src/server/repositories/lead-followups.repo.ts`: `createLeadFollowUp` (auto-updates `enquiry.nextFollowUpAt`), `getLeadFollowUps`, `getOverdueFollowUps`, `toggleFollowUpComplete`, `deleteLeadFollowUp`.
  - `src/server/repositories/lead-activities.repo.ts`: `createLeadActivity` (immutable activity logging with metadata), `getLeadActivities`.
  - `src/server/repositories/lead-assignments.repo.ts`: `assignLeadToAdmin` (atomic transaction deactivating previous assignments), `unassignLead`, `getLeadAssignmentHistory`, `getActiveAssignment`.
  - `src/server/repositories/notifications.repo.ts`: `createAdminNotification`, `getAdminNotifications` (strict recipient isolation), `getUnreadNotificationCount`, `markNotificationAsRead`, `markAllNotificationsAsRead`.
  - Extended `src/server/repositories/enquiries.repo.ts`: added safe relational hydration (strictly omitting `passwordHash`), Optimistic Concurrency Control (OCC via `expectedUpdatedAt`), 8-stage metrics aggregation (`getEnquiryStats`), and filters for `assignedAdminId` and `hasOverdueFollowUp`.
- **Quality Assurance & Verification:**
  - Authored `tests/unit/crm-models.test.ts` (25 tests covering all 6 repositories, constraints, OCC, and recipient isolation).
  - All 393 Vitest unit & integration tests passing across 24 test files.
  - TypeScript strict typecheck: 0 errors (`npm run typecheck`).
  - ESLint: 0 warnings, 0 errors (`npm run lint`).
  - Next.js production build: 29 routes built cleanly (`npm run build`).

---

## [0.9.0] — 2026-11-13
### Phase 9.0: Admin Lead Management & CRM Pipeline — Discovery & Architecture

#### Added
- **GitHub Remote Connection & Safe Backup:**
  - Configured Git remote `origin` pointing to `https://github.com/void-tech-shiv/Voidtechsolution.git`.
  - Verified remote repository is accessible and clean.
  - Performed deep secret audit: verified zero live production database strings, real SMTP passwords, or actual credentials committed in Git history.
  - Documented branch strategy (`main` release baseline and `session/phase-7-admin-auth` active development branch).
- **CRM Specification Suite:**
  - `docs/LEAD_MANAGEMENT_REQUIREMENTS.md`: Detailed functional and non-functional requirements covering 8 operational KPIs, 8-stage Kanban pipeline, lead inspection drawer, multi-author internal notes, follow-up scheduling, multi-channel notifications, faceted search/filtering, and sales velocity analytics.
  - `docs/LEAD_MANAGEMENT_ARCHITECTURE.md`: Layered system architecture specification defining client presentation components, Server Action layer, domain state machine, optimistic concurrency control (OCC via `updatedAt`), and anti-leakage isolation boundary between internal notes and customer emails.
  - `docs/LEAD_MANAGEMENT_DATABASE_DESIGN.md`: Relational schema design with normalized child entities (`lead_notes`, `lead_follow_ups`, `lead_activities`, `admin_notifications`), extended `enquiries` columns (`assignedAdminId`, `estimatedValueInr`, `source`, `nextFollowUpAt`, `lostReason`), performance indexing, and zero-downtime two-phase enum migration script with complete rollback strategy.
  - `docs/LEAD_MANAGEMENT_RBAC.md`: Granular permission taxonomy (`leads:view`, `leads:update_status`, `leads:assign`, `leads:notes_create`, `leads:notes_delete`, `leads:followup_manage`, `leads:analytics_view`, `leads:export`, `leads:delete`), 11-operation RBAC permission matrix across `SUPER_ADMIN`, `ADMIN`, and `EDITOR`, and server-side assertion patterns.
  - `docs/LEAD_MANAGEMENT_API_DESIGN.md`: Server Action and REST API interface specifications, standard `ApiResponse<T>` envelopes, machine-readable error codes (`CONFLICT_DETECTED`, `INVALID_TRANSITION`, etc.), and strict Zod validation schemas.
- **Strict Boundary Compliance:**
  - Zero database modifications or migrations applied in Milestone 9.0.
  - Zero production emails dispatched; zero application code changes made.
  - All existing code, tests, and invariants 100% preserved.

---

## [0.8.4] — 2026-11-13
### Phase 8.4: Complete Website Visual & Functional Acceptance

#### Added
- **Canonical Domain & Technical SEO Files:**
  - Configured `siteConfig.url` to strictly default to the approved production canonical domain: `https://voidtechsolution.codedev.co.in`.
  - Added dynamic standard Next.js metadata routes:
    - `src/app/robots.ts`: Allows public crawler indexing (`/`), disallows sensitive endpoints (`/admin/`, `/api/`), and declares XML sitemap location (`https://voidtechsolution.codedev.co.in/sitemap.xml`).
    - `src/app/sitemap.ts`: Generates compliant XML sitemap indexing all 6 core public routes plus dynamic portfolio case studies (`/portfolio/[slug]`).
  - Added unit test suite `tests/unit/seo.test.ts` (4 tests) verifying canonical domain enforcement, robots disallow rules, and sitemap entries.
  - Added canonical links and OpenGraph URL normalization across `/`, `/about`, `/services`, `/pricing`, `/portfolio`, `/portfolio/[slug]`, and `/contact`.
  - Added production canonical fallback in request origin CSRF defense (`src/server/security/origin.ts`).
- **Comprehensive 10-Viewport & 6-User-Journey Acceptance Suite (`tests/e2e/phase-8-4-acceptance.spec.ts`):**
  - 48 automated Playwright tests covering:
    - Zero horizontal overflow across all 6 public routes at 10 target viewports: 320px, 360px, 375px, 390px, 430px, 768px, 1024px, 1280px, 1440px, 1920px.
    - User Journey A: Services catalog, category filtering, keyword search, prefilled inquiry routing.
    - User Journey B: 10 INR starting pricing tiers, interactive calculator accessibility, package prefill routing.
    - User Journey C: Portfolio concept prototype disclosures, case study blueprints, and simulated benchmark metrics.
    - User Journey D: 3-step contact form validation, error states, and submission flow.
    - User Journey E: Mobile navigation drawer lifecycle, keyboard focus trap, Escape key, backdrop click, and single header brand logo.
    - User Journey F: Unauthenticated administrative portal protection and safe callback URL redirects.
- **CodeRabbit Review Protocol Documentation:**
  - Audited CodeRabbit CLI status (`coderabbit --version` = 0.9.5).
  - Documented CLI authentication failure (`coderabbit auth status` returned `Status: signed out`) as an environment boundary blocker per system guidelines.
  - Performed manual deep code, security, and responsive review fallback.

---

## [0.8.3] — 2026-11-13
### Phase 8.3: Mobile UI Bug Fixes & Responsive Polish

#### Fixed
- **Mobile Header Overlap & Squashed Navigation Drawer (Bug 1 & Bug 5):**
  - Resolved `position: fixed` containment bug caused by `<header>`'s CSS `backdrop-filter: blur(...)`.
  - Migrated `#mobile-nav-drawer` to React `createPortal(drawer, document.body)` with client mounting check to avoid hydration mismatch.
  - Unified mobile header to guarantee strictly ONE visible brand logo and ONE accessible menu/close toggle button in a single 64px row.
  - Implemented keyboard focus trap, Esc key dismissal, backdrop click closing, and body scroll locking.
- **Button Arrow Wrapping on Mobile (Bug 2):**
  - Removed internal redundant unstyled `<span>` wrapping `{children}` inside `src/components/ui/button.tsx`.
  - Added `whitespace-nowrap flex-nowrap` to `buttonBaseStyles` design system tokens.
  - Hardened Step 1 "Continue: Technical Specs" button with `min-h-12 w-full sm:w-auto px-5 sm:px-6` and `shrink-0` on SVG icons.
- **Excessive Vertical Whitespace on `/contact` (Bug 3):**
  - Balanced vertical rhythm in `PublicPageHero` and `/contact` page sections (`py-8 sm:py-14 lg:py-20`, `mt-3.5 sm:mt-6`, `p-4 sm:p-5`).
  - Updated hero aside component colors from legacy cyan to approved purple/violet brand tokens.
- **Viewport Overflow & Narrow Layout Constraints (Bug 4):**
  - Validated and guaranteed zero horizontal page overflow across 320px, 360px, 375px, 390px, 430px, 768px, 1024px, and 1440px.

#### Added
- **Automated Regression Suite (`tests/e2e/mobile-ui-bugs.spec.ts`):**
  - 16 automated Playwright tests verifying single brand logo, single toggle button, button text/arrow single-line alignment, zero horizontal overflow, and full drawer interaction behavior.

---

## [0.8.2] — 2026-11-12
### Phase 8.2: Global Brand Identity & Complete Multi-Page UI Correction

#### Added
- **Official Brand Logo System (`src/components/ui/brand-logo.tsx`):**
  - Integrated the official VOIDTECH SOLUTION brand identity derived from the owner's master asset.
  - Extracted transparent origami ribbon `V` symbol with antialiased alpha channel.
  - Generated production brand assets in `public/brand/`: `voidtech-symbol.webp`, `voidtech-emblem.webp`, `voidtech-icon-512.webp`, `apple-icon.png`, `favicon-32x32.png`, `favicon-16x16.png`, `favicon.ico`, and `og-image.jpg`.
  - Reusable `<BrandLogo />` component supporting `header`, `footer`, `symbol`, and `emblem` variants with semantic accessibility (`<span className="sr-only">VOIDTECH SOLUTION</span>`).
  - Replaced legacy placeholder `[V]` badge everywhere: Header, Footer, Mobile Drawer, Admin Login, and 404 pages.
- **Global Purple/Violet Semantic Design System (`globals.css` & `tailwind.config.ts`):**
  - Applied owner's exact approved color palette across all public and administrative surfaces:
    - Backgrounds: `#050507` (Canvas), `#0A0912` (Bars), `#100D1B` (Cards), `#171126` (Elevated)
    - Accents: `#8B5CF6` (Primary Violet), `#A855F7` (Bright Purple), `#C084FC` (Highlight)
    - Text: `#F8F7FC` (Display), `#B8B3C7` (Body), `#858096` (Muted)
    - Borders: `rgba(168, 85, 247, 0.20)`
- **Expansive 1440px Container Grid:**
  - Removed narrow layout bottlenecks (`max-w-5xl`, `max-w-6xl`, `max-w-7xl`).
  - Standardized all content containers to `max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-12`.
  - Eliminated excessive side gutters on wide desktop displays (1440px–1920px).
- **Dedicated 3D Visual Identity Across Every Page:**
  - Generated and integrated 5 distinct 16:9 Octane 3D visuals for dedicated public routes:
    - `/` (Home): 3D Digital Infrastructure & Glass Headquarters (`voidtech-hero-violet.webp`)
    - `/about` (About): 3D Global Telemetry Wireframe Globe (`voidtech-about-3d.webp`)
    - `/services` (Services): Modular Floating Microservice Cubes & APIs (`voidtech-services-3d.webp`)
    - `/pricing` (Pricing): Holographic Calculation Prism & Concentric Rings (`voidtech-pricing-3d.webp`)
    - `/portfolio` (Portfolio): Concept Lab Showroom & Glass Display Panels (`voidtech-portfolio-3d.webp`)
    - `/contact` (Contact): Cybernetic Communication Beacon Spire (`voidtech-contact-3d.webp`)
- **Replacement of Misleading Telemetry:**
  - Replaced decorative production metrics (99.9% uptime, 12ms latency, 0.00% packet loss) with clearly labeled architectural UI panels (`ARCHITECTURE BLUEPRINT`, `NETWORK TOPOLOGY`, `VERIFICATION PIPELINE`).
- **Comprehensive Visual Proofs:**
  - 19 automated Playwright screenshots captured and verified in `test-results/screenshots/`.

#### Verified
- 364 / 364 Vitest tests passing across all 22 test files.
- All Playwright E2E suites passing (multipage, mobile navigation, responsive design, screenshots).
- Clean Next.js production build across all 27 static and dynamic routes.
- Zero TypeScript and ESLint warnings or errors.

---

## [0.8.1] — 2026-11-12
### Phase 8.1: Cinematic 3D Hero Technology Background Upgrade

#### Added
- **Cinematic 3D Hero Technology Background (`src/components/sections/cinematic-hero.tsx`):**
  - Replaced the framed SVG architecture card with a full-bleed, cinematic 3D digital infrastructure environment (`/hero/voidtech-hero-3d.webp` with `/hero/voidtech-hero-3d.jpg` fallback).
  - Features luminous isometric cybernetic architecture, glowing multi-tiered crystalline server structures, cyan (`#00D4FF`) and cobalt (`#168BFF`) neon data pathways, and ambient global data mesh.
  - Multi-layer dark navy gradients ensuring WCAG AAA text contrast across desktop, tablet, and mobile:
    - Left-to-right gradient (`#020914` to 95% opacity to transparent) protecting headline, description, and dual CTAs.
    - Responsive dark wash (`bg-[#020914]/75` on `<lg` viewports) ensuring crisp legibility on compact screens.
    - Seamless top and bottom vertical fade masks blending into the frosted glass header and `#about` section.
  - 3 floating animated holographic HUD chips on desktop viewports:
    - `99.9% HIGH AVAILABILITY SLA` with pulsating beacon.
    - `12ms EDGE LATENCY • 0.00% LOSS` live mesh telemetry monitor.
    - `98% VERIFIED • ZERO VULNERABILITIES` system security posture badge.
  - Added `floatSlow` and `floatSlowReverse` CSS keyframes and animations to `tailwind.config.ts`, respecting `prefers-reduced-motion`.
  - Preserved 100% of approved content: Headline, Subtitle, Dual CTAs, and the 4 commercial trust cards.
- **Responsive Screenshot Captures:**
  - Automated visual captures across 320px, 375px, 768px, 1440px, and 1920px viewports archived in `docs/screenshots/`.

#### Verified
- 364 / 364 Vitest unit and integration tests passing.
- 47 / 47 Playwright E2E tests passing (including 7 visual proofs across all 5 viewports).
- 25 / 25 routes compiling cleanly with `next build`.
- Zero TypeScript and ESLint errors.

---

## [0.8.0] — 2026-11-12
### Phase 8: Complete UI/UX Redesign — Reference-Inspired Cybernetic Engineering Experience

#### Added
- **SmartStruct-Inspired Visual Design System:**
  - Ultra-deep dark navy background canvas (`#020914`, `#061321`, `#081A2B`, `#0B2033`).
  - Electric cyan (`#00D4FF`), bright highlight (`#43E8FF`), and vibrant blue (`#168BFF`) luminous accents.
  - Thin precision glowing borders (`rgba(70, 180, 230, 0.18)` and `rgba(0, 212, 255, 0.4)` on hover).
  - Preserved backward-compatible CSS token aliases (`--accent-purple: #00D4FF`) ensuring existing test suites pass seamlessly.
- **3D Isometric Software Architecture & HUD Visual (`src/components/sections/hero-architecture-visual.tsx`):**
  - Pure SVG & CSS perspective grid visualization of layered microservices, neural AI core, edge API nodes, and glowing cyan data highways.
  - Three floating HUD widgets:
    1. Circular SVG Radial Status Gauge (`99.9% Uptime SLA • High Availability`).
    2. Live Telemetry Monitor Card (`12ms Edge Latency • 0.00% Packet Loss`).
    3. Real-time Animated Waveform Health Index (`98% Verified`).
  - Bottom technical category pill tabs: `[NEXT.JS & REACT]`, `[AI AGENTS & RAG]`, `[POSTGRESQL & APIS]`, `[DEVOPS & DOCKER]`.
- **Hero 4-Metric Trust Strip:**
  - Directly beneath primary hero CTAs: `18+` Specialized Tracks, `100%` Code Handover, `₹999` Starting Rate (INR), and `30-Day` Bug-Fix Warranty Shield.
- **Technology Ecosystem Ribbon (`src/components/sections/tech-ecosystem-ribbon.tsx`):**
  - "Powered by Modern Technology" dark glass ribbon featuring Next.js 15, React 19, TypeScript, Node.js, Python, PostgreSQL, Prisma, Flutter, Docker, AWS, GCP, and Tailwind CSS.
- **High-Impact Conversion Banner (`src/components/sections/quick-inquiry.tsx`):**
  - Upgraded with concentric rotating cybernetic holographic SVG emblem, dual CTAs, and an Engineering Readiness HUD widget (`2-4h Average Response`, `100% NDA Protection`).
- **Dedicated 404 Experience (`src/app/not-found.tsx`):**
  - Dark navy and cyan styled not-found experience resolving Next.js 15 App Router invariant.
- **Comprehensive Documentation Suite:**
  - `docs/UI_UX_AUDIT.md`: Visual and architectural gap analysis against the reference benchmark.
  - `docs/DESIGN_DIRECTION.md`: Design vision, color architecture, typography scale, and layout guidelines.
  - `docs/RESPONSIVE_QA.md`: Cross-device verification across 320px, 375px, 768px, 1280px, and 1920px.
  - `docs/VISUAL_QA_REPORT.md`: Comprehensive visual inspection and verification scorecards.

#### Verified
- 364 / 364 Vitest unit and integration tests passing.
- 40 / 40 Playwright E2E tests passing (25 core + 15 responsive design smoke).
- 25 / 25 routes compiling cleanly with `next build`.
- Zero ESLint warnings or errors (`npm run lint`).

---

## [0.7.5] — 2026-11-12
### Phase 7: Secure SUPER_ADMIN Bootstrap CLI & Append-Only Audit Logging Engine

#### Added
- **Initial SUPER_ADMIN Bootstrap CLI (`scripts/create-admin.ts`):**
  - Interactive terminal provisioning utility executed via `npm run admin:create`.
  - Hidden terminal input via `process.stdin.setRawMode(true)` ensuring master password entry is never echoed on screen (cross-platform Windows & POSIX support with non-TTY CI fallback).
  - Pre-flight database connectivity diagnostics (`SELECT 1`) with connection string credential sanitization.
  - Enforces the **Strictly Exactly One `SUPER_ADMIN`** invariant: halts immediately with exit code 1 if a `SUPER_ADMIN` account is already registered.
  - Input validation with Zod (`bootstrapInputSchema`): full name (2–100 chars), valid email format, high-entropy password requirements (12–128 chars, uppercase, lowercase, number, symbol), and password confirmation matching.
  - Constant-time Scrypt password hashing with 16-byte cryptographically secure random salt.
  - PostgreSQL advisory transaction locking (`SELECT pg_advisory_xact_lock(hashtext('super_admin_lifecycle_lock'))`) guaranteeing atomic serialization against race conditions.
  - Comprehensive runbook authored at [`docs/ADMIN_BOOTSTRAP.md`](./docs/ADMIN_BOOTSTRAP.md).
- **Centralized Append-Only Audit Logging Engine (`src/server/security/audit.ts`):**
  - Type-safe audit action registry (`AUDIT_ACTIONS`) for administrative, authentication, and content lifecycle events.
  - Recursive credential scrubbing (`sanitizeAuditDetails`): deeply scrubs sensitive fields (`password`, `passwordHash`, `rawToken`, `sessionToken`, `secret`, `cookie`, `otp`, `databaseUrl`, etc.) replacing values with `"[REDACTED]"`.
  - Defensive recursion depth cap (maximum 6 levels) preventing payload-induced stack overflow DoS attacks.
  - Transaction-aware log generation (`recordAuditEvent`): supports Prisma transaction clients (`tx`), guaranteeing atomic commit or rollback alongside administrative entity modifications.
  - Read-only audit query APIs (`getAuditHistory`, `getAuditLogById`).
  - Zero exposed delete or update operations, enforcing append-only tamper-resistant persistence.
  - Decoupled relational schema in Prisma (`actorId` and `actorEmail` stored as scalar strings without cascading foreign keys), preserving audit trails even if administrative accounts are modified or removed.
- **Automated Verification Test Suites:**
  - `tests/unit/audit.test.ts` (10 unit tests): verifies credential scrubbing, nested redaction, recursion depth capping, transaction participation, append-only guarantees, and paginated query filtering.
  - `tests/unit/admin-bootstrap.test.ts` (14 unit tests): verifies CLI input validation, password complexity, database pre-flight checks, existing account rejection, scrypt hashing, and audit log generation.
  - `tests/unit/bootstrap-concurrency.test.ts` (3 unit tests): verifies PostgreSQL advisory xact lock execution, concurrent bootstrap serialization (exactly one succeeds, duplicate rejected), and atomic transaction rollback on audit failure.
  - Vitest test suite expanded to **273 / 273 tests passing (100% across 17 test suites)**.

---

## [0.6.0] — 2026-11-12
### Phase 6: Interactive Pricing Calculator, Contact System & Enquiry Management Backend

#### Added
- **Dedicated Pricing Page (`src/app/pricing/page.tsx`):**
  - Hero header: *"Predictable Investment. Zero Hidden Costs."* with 50/50 payment terms breakdown.
  - Interactive Pricing Table (`<PricingTable />`) with category filter tabs (All, Websites, Platforms & E-Commerce, Enterprise & AI) rendering all 10 approved INR packages (₹999 to ₹59,999+) with deliverables and package selection CTAs.
  - Interactive Pricing Calculator (`<PricingCalculator />`) embedded at `#calculator`.
  - 4 Engineering & Billing Guarantees: Full IP & Source Handover, 50/50 Payment Terms (50% Advance / 50% Prior to Handover), Locked Scope & Change Orders (Two Revision Rounds), Limited 30-Day Bug-Fix Warranty.
  - Pricing FAQs powered by `FaqRepo.getActiveFaqs()` via `<FaqAccordion />`.
  - Dynamic SEO metadata for `/pricing`.
- **Interactive Project Pricing Calculator (`src/components/sections/pricing-calculator.tsx`):**
  - 8 Project Disciplines (Website, E-commerce, Mobile App, SaaS, AI Automation, API & Backend, ERP & CRM, Custom Software).
  - 10 Starting Package Baselines with real-time recalculation in Indian Rupees (INR ₹).
  - 8 Architectural Add-On Modules (Auth/RBAC, Payments, APIs, AI/RAG, WebSockets, Localization, Legacy Migration, WebGL).
  - Design Complexity selector (Standard Dark vs WebGL / 3D Custom Quote).
  - Delivery Urgency selector (Standard Schedule vs Priority Sprint +25% optional estimate, subject to availability).
  - Live estimate summary card with subtotal range, non-binding disclaimer, and direct "Continue to Enquiry Form" CTA serializing parameters to `/contact` query string.
  - Calculator Reset button restoring baseline state.
- **Dedicated Contact Page (`src/app/contact/page.tsx`):**
  - Hero header: *"Let's Build Something Exceptional."*
  - Agency Consultation Standards: Operating Model (Distributed/Remote-First), Working Hours (Mon–Sat 9AM–7PM IST), Scoping Review (Responsive Enquiry Review), Confidentiality (NDA discussed & signed upon request).
  - Multi-Step Project Intake Form wrapped in Suspense boundary.
  - Direct communication desk (`voidtechsolutionsupport@gmail.com`).
  - Dynamic SEO metadata for `/contact`.
- **Interactive Multi-Step Lead Intake Form (`src/components/sections/contact-enquiry-form.tsx`):**
  - 3-step progressive layout: Step 1 (Scope & Category), Step 2 (Technical Specifications & Timeline), Step 3 (Contact & Organization Details).
  - Auto-prefill from Pricing Calculator query parameters (`category`, `package`, `addons`, `timeline`).
  - Form validation with Zod schemas and real-time character counters.
  - Full data preservation on server interruption with accessible error alert banner and "Retry Submission" button.
  - Engaging Success Screen: Unique Reference ID (`ENQ-...`), 3-step onboarding guide, and reset action.
  - Hidden honeypot anti-spam trap (`website_url`).
- **Server-Side Enquiry Processing & Persistence:**
  - Server Action `submitEnquiryAction` (`src/server/actions/enquiry.actions.ts`).
  - Next.js API Route Handler `POST /api/enquiries` (`src/app/api/enquiries/route.ts`).
  - Parameterized persistence via `EnquiriesRepo.createEnquiry()` with safe database failure handling.
  - Token-bucket rate limiting (5 per 10 minutes per IP/email) and SHA-256 duplicate submission cooldown guard (60 seconds).
  - Transactional email dispatch via Nodemailer SMTP (`dispatchEnquiryNotifications()`) with customer confirmation and admin alert notifications.
- **Prisma Schema Update & Migration Proposal:**
  - Extended `Enquiry` model with `selectedPackage`, `additionalConfig`, `referenceUrl`, `consentGiven`.
  - Authored `.gsd/phases/06-pricing-contact/MIGRATION_PROPOSAL.md` with exact SQL and zero remote execution.
- **Test Suite Expansion (`tests/unit/pricing-contact.test.tsx` & `tests/unit/email.test.ts`):**
  - Added 18 comprehensive unit tests covering the pricing table, interactive calculator, multi-step contact form, server action, rate limiting, duplicate rejection, and API routes.
  - Added automated security guard tests across all customer-facing email templates (Enquiry Confirmation, Enquiry Status Update, OTP Verification, Password Reset, Security Notification) enforcing `voidtechsolutionsupport@gmail.com` and guaranteeing zero unverified addresses (`security@...`, `contact@...`, etc.) exist in either HTML or plain-text.
  - Test suite now stands at **136 passing tests** across 9 test suites (100% passing).
- **Email Security Footer Consolidation:**
  - Standardized security footer message across all customer-facing email templates: *"If you did not initiate this action, please contact VOIDTECH SOLUTION support at voidtechsolutionsupport@gmail.com."*
  - Updated `src/server/email/templates/base-layout.ts`, `otp-verification.template.ts`, `password-reset.template.ts`, `security-notification.template.ts`, and `docs/SECURITY.md`.

---

## [0.5.0] — 2026-11-12
### Phase 5: About Page, Portfolio & Detailed Project Case Studies

#### Added
- **Dedicated About Page (`src/app/about/page.tsx`):**
  - Section 1 (Hero): Approved headline *"Engineering Ideas Into Digital Reality."*, supporting statement, and dual CTA navigation to `/portfolio` and `/#contact`.
  - Section 2 (Who We Are): Authentic statement establishing VOIDTECH SOLUTION's engineering-first focus with zero fabricated client counts, employee statistics, or awards.
  - Section 3 (Mission & Vision): Approved mission (*"Transform ideas into reliable, useful and maintainable digital solutions."*) and vision (*"Make modern technology more accessible to businesses and innovators through thoughtful software engineering."*).
  - Section 4 (Core Values): 6 fundamental pillars (Engineering Quality, Transparent Communication, Practical Innovation, Maintainable Architecture, User-Centered Design, Continuous Improvement).
  - Section 5 (Our Approach): 6 structured engineering phases (Understand the requirement, Define the architecture, Design the experience, Develop the solution, Test thoroughly, Deliver and support).
  - Section 6 (Technology Matrix): 7 categorized technical domains (Frontend, Backend, Database, AI & Automation, Mobile, Cloud & DevOps, Design) without unverified partner claims.
  - Section 7 (Closing CTA): *"Have an idea worth building?"* linking directly to `/#contact`.
- **Dedicated Portfolio Discovery Page (`src/app/portfolio/page.tsx`):**
  - Hero header with approved headline *"Selected Work & Engineering Concepts."* and authentic lab prototype positioning.
  - Server-side data retrieval via `PortfolioRepo.getAllProjects()` with resilient try/catch fallback.
  - Client component `PortfolioFilter` (`src/components/sections/portfolio-filter.tsx`) with category pills, live keyword search, dynamic project counter, and accessible empty state.
- **Dynamic Case Study Route (`src/app/portfolio/[slug]/page.tsx`):**
  - Next.js 15 App Router dynamic route with asynchronous `params` resolution.
  - Static generation via `generateStaticParams()` and dynamic SEO metadata via `generateMetadata()`.
  - Safe 404 handling via `notFound()`.
  - Comprehensive 11-section case study layout: Breadcrumb navigation, Hero with quick metadata banner, Concept transparency notice, Problem & Constraints, Design & Architecture, Architecture Blueprint schematic, Simulated Benchmark metrics, Tech Stack, Code Access Brief, Related Engineering Concepts, and Closing Conversion CTA.
- **Data Layer Expansion (`src/server/repositories/portfolio.repo.ts`):**
  - Expanded concept prototypes to 5 verified technical domains: FinTech, DevOps/AI, Data Engineering, Cybersecurity, and IoT/Embedded systems.
- **Test Suite Expansion (`tests/unit/about-portfolio.test.tsx`):**
  - Added 16 unit and integration tests covering the About page, Portfolio discovery and live filtering, dynamic case study rendering, and 404 handling.
  - Test suite now stands at **112 passing tests** across 8 test suites.

---

## [0.4.0] — 2026-11-12
### Phase 4: Public Marketing Website — Homepage, Services & Dynamic Showcase

#### Added
- **Full Responsive 9-Section Homepage (`src/app/page.tsx`):**
  - Section 1 (Hero): Headline "Turning Ideas Into Powerful Digital Products.", supporting copy, dual CTA navigation ("Start Your Project" & "Explore Our Services"), and authentic capability highlights.
  - Section 2 (Brand Introduction): Authentic statement regarding pragmatic engineering, purpose-driven architecture, zero vendor lock-in, and high-assurance code.
  - Section 3 (Services Showcase): Complete 18-service catalog with category filter tabs, keyword search, deliverables, tech tags, and INR pricing.
  - Section 4 (Why Choose VoidTech): 6 practical differentiators focused on custom architecture, accessibility, and clean code.
  - Section 5 (Development Process): 7-stage delivery lifecycle (Discovery, Planning, UI/UX Design, Development, Testing, Deployment, Support).
  - Section 6 (Featured Projects): Concept Lab architecture prototypes with prominent `CONCEPT` badge and benchmark metrics.
  - Section 7 (Pricing Preview): All 10 approved starting price tiers in INR (₹999 to ₹59,999+) with preserved plus signs.
  - Section 8 (FAQ Preview): WAI-ARIA accessible accordion with smooth transitions and keyboard navigation.
  - Section 9 (Final Closing CTA): Direct project inquiry banner with one-click email copy utility.
- **UI & Section Components:**
  - `src/components/ui/accordion.tsx`: Accessible, keyboard-navigable Accordion primitive.
  - `src/components/sections/service-icon.tsx`: Dynamic Lucide React icon mapper for services.
  - `src/components/sections/services-filter.tsx`: Client-side interactive category filter and keyword search.
  - `src/components/sections/faq-accordion.tsx`: Interactive FAQ accordion with graceful empty state.
  - `src/components/sections/quick-inquiry.tsx`: Direct consultation component with clipboard copy functionality.
- **Verification & Test Suite (`tests/unit/homepage.test.tsx`):**
  - Added 14 unit and integration tests covering all 9 sections, 18 services, 10 pricing tiers, concept badge verification, and accordion toggling.
  - Total test suite now stands at **96 passing tests** across 7 test suites.
- **Pre-Flight Verification Script (`scripts/verify-live-env.ts`):**
  - Added non-destructive live environment audit utility (`npm run verify:env`) verifying PostgreSQL connection (`SELECT 1`), SMTP verification handshake (`transporter.verify`), authentication keys, and security guards.

---

## [0.3.2] — 2026-11-12
### Phase 3: Environment Configuration & Credential Readiness

#### Added & Standardized
- **Centralized Environment Schema Validation (`src/config/env.ts`):**
  - Added comprehensive Zod validation for all application environment variables (`DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `OTP_PEPPER_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SMTP_*`, `NEXT_PUBLIC_SITE_URL`, `NODE_ENV`).
  - Implemented strict production mode guardrails rejecting localhost database strings, development dummy passwords, and placeholder auth secrets when `NODE_ENV === "production"`.
- **Cryptographic Password Security (`src/server/security/password.ts`):**
  - Added `hashPassword()` using Node.js `crypto.scryptSync` with unique 16-byte random salts.
  - Added `verifyPassword()` using `crypto.timingSafeEqual` to prevent timing attacks.
  - Updated `prisma/seed.ts` to securely hash `ADMIN_PASSWORD` before storage.
- **Environment Contract Standardized (`.env.example` & `.env`):**
  - Standardized `.env.example` with detailed setup instructions for PostgreSQL and Nodemailer SMTP (Gmail App Password, Mailgun, SendGrid).
  - Pre-generated strong 256-bit cryptographically secure keys (`AUTH_SECRET`, `OTP_PEPPER_SECRET`) in local `.env`.
  - Prepared local `.env` with clearly marked placeholders ready for user credential entry.
  - Verified `.env` is ignored by Git (`.gitignore`).
  - Safely deprecated and removed legacy Phase 1 placeholders (`EMAIL_PROVIDER_API_KEY`, `EMAIL_FROM`, `ENQUIRY_NOTIFICATION_RECIPIENT`).
- **Test Suite Expansion (`tests/unit/env.test.ts`):**
  - Added 9 unit tests verifying environment validation, production constraint enforcement, and scrypt password hashing/verification.
  - Total test suite expanded to **82 passing tests** across 6 test suites.

---

## [0.3.1] — 2026-11-12
### Phase 3: Database Architecture & Data Layer — Closure Audit

#### Added & Completed
- **Prisma Schema Audit & Expansion (`prisma/schema.prisma`):**
  - Added all 10 required domain models: `Enquiry`, `Service`, `PortfolioProject`, `AdminUser`, `PricingPackage`, `FAQ`, `SiteSetting`, `AuditLog`, `OtpVerification`, `EmailDelivery`.
  - Enums: `OtpPurpose` (`LOGIN`, `PASSWORD_RESET`, `ENQUIRY_VERIFICATION`, `ADMIN_ACTION`), `EmailDeliveryStatus` (`PENDING`, `SENT`, `FAILED`).
  - Complete indexes, constraints, and table mappings (`@@map`).
- **Approved INR Pricing Catalog (10 Tiers):**
  - Established `src/config/pricing.ts` with all 10 approved VoidTech starting prices in INR (Basic Static: ₹999, Standard Business: ₹2,999, Professional: ₹5,999, Premium Custom: ₹12,999+, E-commerce: ₹19,999+, SaaS: ₹24,999+, LMS: ₹29,999+, Marketplace: ₹34,999+, ERP & CRM: ₹49,999+, AI-Powered: ₹59,999+).
  - Replaced `startingPriceUsd` with `startingPriceInr` and `currency: "INR"` across schema, types, repositories, and seeders.
- **Nodemailer + SMTP Transactional Email Subsystem (`src/server/email/`):**
  - Environment schema validation via Zod for `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM_NAME`, `SMTP_FROM_EMAIL`, `ADMIN_ALERT_EMAIL`.
  - Singleton reusable connection pool transporter with `verifySmtpConnection()`.
  - Central `sendEmail()` function with bounded exponential retries (3 max attempts) and persistence to `EmailDelivery`.
  - 6 VoidTech dark-styled HTML & plain-text templates:
    1. `OTP Verification`
    2. `Password Reset`
    3. `Enquiry Confirmation`
    4. `New Enquiry Admin Alert`
    5. `Enquiry Status Update`
    6. `Security Notification`
  - Zero-credential logging with masked email addresses in error traces.
- **Cryptographic OTP Engine (`src/server/security/otp.service.ts`):**
  - 6-digit uniform numerical token generation using `crypto.randomInt`.
  - HMAC-SHA256 secure hash storage with server-side pepper and salt.
  - 5-minute default expiration window.
  - Maximum 5 verification attempts before permanent lockout.
  - 60-second resend cooldown against rapid token spamming.
  - Single-use consumption via constant-time comparison (`crypto.timingSafeEqual`).
  - Purpose isolation and previous OTP invalidation.
- **Portfolio Data Integrity:**
  - Seeded portfolio projects explicitly designated as internal `CONCEPT` / architecture prototypes without fabricated client names ("Aether Capital", "Synthex Networks") or unverified production metrics.
- **Repository Safety Guardrails:**
  - Added `PricingRepo`, `FaqRepo`, `AuditRepo`, `DeliveryRepo`.
  - Database write operations strictly throw observable, descriptive errors without leaking credentials.
- **Quality Assurance & Verification:**
  - Vitest test suite expanded to 73 tests passing across 5 test suites.
  - Full TypeScript strict typecheck (`tsc --noEmit`) passing with 0 errors.
  - ESLint (`next lint`) passing with 0 warnings/errors.
  - Next.js production build (`next build`) passing.
- **Documentation:**
  - Authored `docs/EMAIL_SYSTEM.md`.
  - Synchronized `docs/DATABASE_DESIGN.md`, `docs/ARCHITECTURE.md`, `docs/API_DOCUMENTATION.md`, `docs/SECURITY.md`, `docs/TESTING.md`, `docs/DEPLOYMENT.md`, `docs/PROJECT_STATUS.md`.

---

## [0.3.0] — 2026-11-11
### Phase 3: Database Design, Schema Setup & Data Layer

#### Added
- **Prisma Schema Optimization (`prisma/schema.prisma`):**
  - Finalized entity models: `Enquiry`, `Service`, `PortfolioProject`, `AdminUser`, `SystemSetting`.
  - Added indexes for status lookups, category lookups, order indices, and timestamps.
  - Verified schema with `npx prisma validate` and regenerated client via `npx prisma generate`.
- **Repository Pattern Abstraction Layer (`src/server/repositories/`):**
  - `enquiries.repo.ts`: Querying with pagination, multi-field search, status filtering, status updates, note appending, and aggregated status metrics.
  - `services.repo.ts`: Querying all services, active services, featured services, slug lookups, and administrative mutations with static fallback resilience.
  - `portfolio.repo.ts`: Querying case studies, featured projects, industry filtering, and slug lookups with static fallback resilience.
  - `users.repo.ts`: Admin lookup by normalized email, ID lookup, admin creation, and login audit tracking.
  - `settings.repo.ts`: Generic type-safe settings getter, upsert setter, and key-value map queries.
  - `index.ts`: Centralized barrel export.
- **Database Seeding Engine (`prisma/seed.ts`):**
  - Script populates all 18 registered business services from `src/config/site.ts`.
  - Seeds default system settings (agency email, notification dispatch hooks, maintenance mode).
  - Seeds initial case studies (`algorithmic-liquidity-engine` and `autonomous-ai-ops-agent`) with quantified metrics.
  - Added `npm run db:seed` and `npm run db:validate` npm scripts with `tsx` runner.
- **Resilient Database Client (`src/lib/prisma.ts`):**
  - Added `checkDatabaseConnection()` utility for health checks and graceful fallback.
- **Test Suite Expansion (`tests/unit/database.test.ts`):**
  - Added 11 tests verifying services repository, portfolio repository, settings repository, and connection resilience.
  - Total test count expanded to 43 passing tests.

#### Verified
- Prisma schema validation: `npx prisma validate` passed with 0 errors.
- TypeScript validation: `tsc --noEmit` passed with 0 errors.
- ESLint: `next lint` passed with 0 warnings/errors.
- Automated tests: `vitest run` passed with 43/43 tests.
- Production build: `next build` compiled with 0 errors.

---

## [0.2.0] — 2026-11-11
### Phase 2: Design System, Brand Identity & Reusable UI Components

#### Added
- Semantic CSS custom properties and Tailwind color mappings.
- Typography with Next.js Google font optimization (Inter + JetBrains Mono).
- Reusable UI component library (Buttons, Cards, Forms, Feedback, Layout).
- Header with mobile navigation drawer and enhanced Footer.
- Internal design system preview route at `/design-system`.
- 24 unit and component tests (total 32 passing tests).

---

## [0.1.0] — 2026-11-11
### Phase 1: Project Initialization, Specification & Foundation

#### Added
- GSD Mission Control specification lock and 12-phase roadmap.
- Next.js 15 App Router scaffolding with strict TypeScript.
- Prisma ORM PostgreSQL schema for 5 domain entities.
- Initial UI layout shells and health check Route Handler.
- Complete documentation suite in `docs/` and `.env.example`.
