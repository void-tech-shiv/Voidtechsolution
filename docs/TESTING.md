# TESTING.md — Quality Assurance & Testing Strategy

## 1. Testing Philosophy
VOIDTECH SOLUTION adheres to the **Empirical Validation Principle**:
> *No "trust me, it works." Every change requires captured proof from automated test runners, compilers, or linters.*

The testing strategy is organized into a four-tiered pyramid:
1. **Unit & Validation Tests (Vitest):** Millisecond-speed testing of utility functions, Zod schema constraints, and business logic.
2. **Component & Integration Tests (React Testing Library + Vitest):** Verification of component rendering, user interactions, accessible role queries, and event handlers.
3. **Repository & Data Layer Tests (Vitest):** Verification of database repository abstraction contracts, offline fallback handling, and schema integrity.
4. **Email & Security Service Tests (Vitest):** Verification of SMTP configuration, bounded retries, email templates, delivery tracking, and cryptographic OTP policies.

---

## 2. Test Execution Commands

```bash
# Run all unit, component, email, otp & repository test suites
npm test

# Run tests in interactive watch mode
npm run test:watch

# Run tests with test coverage reporting
npm run test:coverage

# Run Playwright End-to-End browser tests (Phase 11)
npm run test:e2e

# Run TypeScript compiler strict typecheck
npm run typecheck

# Run ESLint code quality checks
npm run lint

# Run Next.js production build check
npm run build
```

---

## 3. Test Suites & Coverage (Phase 3 Credential Readiness: 82 Tests Passing)

### Active Test Suites:
1. **`tests/unit/smoke.test.ts` (8 tests):**
   - Utility functions (`cn`, `formatCurrency`, `truncate`).
   - Project specifications and 18-service registry verification.
   - Zod enquiry form validation schema constraints.
2. **`tests/unit/design-system.test.tsx` (24 tests):**
   - **Buttons:** Renders `Button`, `PrimaryButton`, `SecondaryButton`, `OutlineButton`, `GhostButton`, `GlowButton`, loading spinners, disabled states, and click triggers.
   - **Badges:** Renders `default`, `purple`, `success`, `warning`, `error`, `outline` badges and pulse dots.
   - **Cards:** Renders `BaseCard`, `GlassCard`, `ServiceCard`, `PricingCard`, and `ProjectCard`.
   - **Forms:** Renders `FormLabel`, `Input`, `Textarea`, `Select`, `Checkbox`, and validation error alerts.
   - **Feedback:** Renders `LoadingState`, `EmptyState`, and `ErrorState` with retry buttons.
   - **Layout:** Renders `Container`, `Section`, and `SectionHeading`.
3. **`tests/unit/database.test.ts` (19 tests):**
   - **Services Repository:** Retrieves all 18 registered business services with full metadata, enforces INR currency (`currency: "INR"`), queries active offerings, filters featured offerings, lookups by slug, and handles non-existent slugs.
   - **Portfolio Repository:** Verifies projects marked as `projectType: "CONCEPT"`, confirms complete removal of fabricated client names ("Aether Capital", "Synthex Networks"), verifies simulated benchmark metrics, queries featured projects, filters by industry, and queries by slug.
   - **Approved INR Pricing Packages:** Retrieves exactly 10 approved packages, strictly asserts the 10 approved starting prices (₹999, ₹2,999, ₹5,999, ₹12,999, ₹19,999, ₹24,999, ₹29,999, ₹34,999, ₹49,999, ₹59,999), and queries packages by slug.
   - **FAQ Repository:** Retrieves baseline FAQs and tests category filtering (`PRICING`, `TECHNICAL`, `GENERAL`).
   - **Settings & Write Safety:** Verifies default value returns, tests fallback site settings map, verifies non-crashing database connection checks, verifies safe error throwing on database write failure without leaking credentials, and verifies enquiry stats aggregation without crashing.
4. **`tests/unit/email.test.ts` (14 tests):**
   - **SMTP Configuration:** Zod validation of `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM_NAME`, `SMTP_FROM_EMAIL`, `ADMIN_ALERT_EMAIL`, and failure on invalid env inputs.
   - **Template Rendering (6 Templates):** Renders OTP verification (with 6-digit code and VoidTech branding), password reset (with secure CTA link), enquiry confirmation (with responsive review notice), new enquiry admin alert (with full structured lead brief), enquiry status update (with state pill badge), and security notification (with event details and IP).
   - **Transporter & Service:** Mocked SMTP connection verification, transient failure retry loop with bounded exponential backoff (retries = 2), permanent delivery failure logging (`status: "FAILED"`), and typed convenience dispatchers.
5. **`tests/unit/otp.test.ts` (8 tests):**
   - **Generation & Hashing:** Cryptographically secure 6-digit numerical string verification (`^\d{6}$`), uniform distribution, deterministic HMAC-SHA256 hashing with salt and pepper isolation.
   - **Lifecycle & Security Policies:** 5-minute expiration verification, 60-second resend cooldown enforcement against rapid token spamming, single-use consumption preventing replay attacks, max 5 attempts lockout policy, expiration rejection, and strict purpose isolation (LOGIN code cannot reset PASSWORD).
6. **`tests/unit/env.test.ts` (9 tests):**
   - **Environment Validation:** Comprehensive Zod validation in development mode.
   - **Production Hardening:** Rejects development dummy passwords and placeholder auth secrets when `NODE_ENV === "production"`.
   - **Password Security:** Scrypt password hashing with unique random salts, constant-time verification against timing attacks, rejection of short passwords (< 8 chars), and graceful error handling on malformed hashes.

---

## 4. Verification Gate Summary
- **Vitest Unit & Component Tests:** 6 test files, 82 tests passing (0 failures).
- **TypeScript Strict Mode:** `tsc --noEmit` passed with 0 errors.
- **ESLint:** `next lint` passed with 0 warnings or errors.
- **Next.js Production Build:** `next build` passed with all static and dynamic routes compiled.


---

## 5. Phase 5 Test Suite — About, Portfolio & Case Studies

- **Test File:** `tests/unit/about-portfolio.test.tsx` (16 tests)
- **Total Project Tests:** 112 passing across 8 test suites.
- **Coverage Areas:**
  1. **About Page Hero:** Approved headline *"Engineering Ideas Into Digital Reality."*, subtext, and portfolio CTA.
  2. **Who We Are Section:** Authentic studio statement without fabricated statistics, employee counts, or fake certifications.
  3. **Mission & Vision Statements:** Exact verification of approved mission and vision copy.
  4. **Core Values:** All 6 pillars (Engineering Quality, Transparent Communication, Practical Innovation, Maintainable Architecture, User-Centered Design, Continuous Improvement).
  5. **Engineering Approach:** All 6 structured phases (Understand the requirement, Define the architecture, Design the experience, Develop the solution, Test thoroughly, Deliver and support).
  6. **Technology Matrix:** Categorized 7-domain tech stack matrix without unauthorized partnerships.
  7. **About Conversion CTA:** *"Have an idea worth building?"* linking to `/#contact`.
  8. **Portfolio Hero:** Approved headline *"Selected Work & Engineering Concepts."* and lab prototype positioning.
  9. **Portfolio Project Cards:** Prominent `CONCEPT` badges and simulated benchmark tags.
  10. **Interactive Industry Filtering:** Client-side category pill selection and filtering.
  11. **Live Keyword Search:** Full-text search across titles, summaries, and tech tags.
  12. **Empty State:** Friendly empty state rendering when search matches 0 projects with reset filter trigger.
  13. **Dynamic Route Static Params:** `generateStaticParams()` returns all known project slugs.
  14. **Dynamic Metadata:** `generateMetadata()` produces dynamic titles, descriptions, and OpenGraph data.
  15. **Full Case Study Layout:** Renders Breadcrumbs, Hero, Challenge, Solution, Architecture Blueprint, Simulated Benchmarks, Tech Stack, Related Concepts, and CTA.
  16. **404 Handling:** `notFound()` correctly invoked when project slug does not exist.

- **Test File:** `tests/unit/homepage.test.tsx` (14 tests)
- **Total Project Tests:** 96 passing across 7 test suites.
- **Coverage Areas:**
  1. Complete Homepage rendering with all 9 strategic sections.
  2. Hero headline, supporting copy, and dual CTA navigation.
  3. Brand introduction quote and 3 core engineering commitments.
  4. Services Showcase rendering with all 18 approved services.
  5. Category filtering and live keyword search in `ServicesFilter`.
  6. Practical differentiators in Why Choose VoidTech.
  7. 7-stage delivery lifecycle steps.
  8. Concept Lab projects with explicit `CONCEPT` badge.
  9. All 10 approved pricing tiers in INR (₹999 to ₹59,999+) with preserved plus signs.
  10. Accessible `Accordion` keyboard toggle, ARIA attributes, and empty fallback state.
  11. Direct email copy-to-clipboard functionality in `QuickInquiry`.
  12. Header and Footer navigation link consistency.

---

## 6. Phase 6 Test Suite — Pricing, Calculator & Contact System

- **Test File:** `tests/unit/pricing-contact.test.tsx` (18 tests)
- **Total Project Tests:** 130 passing across 9 test suites (100% pass rate).
- **Coverage Areas:**
  1. **Pricing Table Rendering:** All 10 approved packages with INR pricing (₹999 to ₹59,999+) and deliverable lists.
  2. **Category Filter Tabs:** Correct filtering across Websites, Platforms & E-Commerce, Enterprise & AI, and All Tiers.
  3. **Package Selection Links:** Valid `/contact?package=[slug]` navigation targets.
  4. **Calculator Baseline Price:** Instant calculation for default category (₹999 for Basic Static).
  5. **Category Switch:** Automatic baseline recalculation on discipline change (e.g. SaaS -> ₹24,999+).
  6. **Add-On Selection:** Incremental recalculation when selecting architectural modules.
  7. **Custom Quotation Handling:** Sets custom quote flag when bespoke modules (e.g. Legacy Migration, 3D WebGL) are selected.
  8. **Delivery Priority Urgency:** Calculates +25% sprint acceleration multiplier.
  9. **Calculator Reset Action:** Restores baseline configuration and clears add-ons.
  10. **Progressive Form Navigation:** Step 1 -> Step 2 -> Step 3 transitions.
  11. **Step-by-Step Validation:** Enforces category, budget, timeline, minimum brief length, name, email, and consent before progressing/submitting.
  12. **Success Screen Rendering:** Unique Reference ID (`ENQ-...`), 3-step onboarding guide, and reset action.
  13. **Data Preservation on Server Failure:** Form inputs retained when database or network encounters error, rendering accessible alert with "Retry Submission" button.
  14. **Honeypot Bot Trap:** Fast-path silent rejection when `website_url` is populated.
  15. **Duplicate Prevention:** Rejects identical submissions within 60-second cooldown window.
  16. **Non-Blocking Email Notifications:** Asynchronously invokes `dispatchEnquiryNotifications()`.
  17. **API Route Status 201:** `POST /api/enquiries` returns created status and enquiry ID.
  18. **API Route Status 400:** `POST /api/enquiries` returns structured validation error envelope.

---

## 7. Phase 7 Test Suite — Authentication, Session Engine & CSRF Security

- **Test File:** `tests/unit/auth.test.ts` (35 tests)
- **Total Project Tests:** 171 passing across 10 test suites (100% pass rate).
- **Coverage Areas:**
  1. **Zod Input Validation:** Valid credentials parsing, email format checks, min 8-character password enforcement, and max 128-character cap to mitigate algorithmic scrypt/bcrypt CPU DoS attacks.
  2. **Scrypt Password Verification:** Formatted `salt:hash` generation with 16-byte random salt, constant-time `crypto.timingSafeEqual` comparison, incorrect password rejection, and malformed hash string tolerance.
  3. **High-Entropy Token Generation:** Cryptographically secure 256-bit random session tokens (`generateRawSessionToken`).
  4. **SHA-256 Token Storage Security:** Deterministic SHA-256 hashing (`hashSessionToken`) ensuring raw tokens are never stored in PostgreSQL.
  5. **Web Crypto Dual-Layer Cookie Signing:** HMAC-SHA256 signing (`signSessionCookie`) and verification (`verifySessionCookie`) via Web Crypto API (`crypto.subtle`), payload tampering detection, incorrect secret rejection, and cryptographic timestamp expiration.
  6. **Authoritative Server-Side Validation:** Validates active session against PostgreSQL, enforces 8-hour absolute maximum lifetime, enforces 30-minute server-side idle timeout (`lastActiveAt`), and checks administrator active status (`user.isActive`).
  7. **CSRF & Origin Security:**
     - Accepts legitimate same-origin requests in development (`localhost:3000`) and production (`voidtechsolution.com`).
     - Rejects forged `Origin` headers from unauthorized domains.
     - Rejects missing `Origin` and `Referer` headers on state-changing operations.
     - Rejects cross-origin Server Action requests.
     - Rejects forged `Host` headers where an attacker crafts matching `Host` and `Origin` (host injection defense).
     - Rejects untrusted `x-forwarded-host` headers when reverse proxy trust is unconfigured or disabled.
     - Accepts properly configured trusted proxy arrangements with validated application hostnames.
     - Rejects untrusted forwarded hostnames even when proxy trust is enabled.
     - Accepts legitimate `Referer` fallback when browser omits `Origin`.
  8. **Session Invalidation & Revocation Lifecycle:**
     - Guarantees raw tokens never enter database records.
     - Rejects nonexistent or revoked database sessions (`SESSION_NOT_FOUND`).
     - Rejects absolute lifetime expiration (`ABSOLUTE_TIMEOUT`) and purges database record.
     - Revokes database session upon logout (`revokeAdminSession`).
     - Revokes all active sessions upon password modification (`updateAdminPassword`).
     - Revokes all active sessions upon role modification (`updateAdminRole`).
     - Revokes all active sessions upon account deactivation (`setAdminActiveStatus`).
     - Throttles session `lastActiveAt` touch to prevent database write amplification within `TOUCH_INTERVAL_MS` (5 minutes).
  9. **Sliding-Window Rate Limiting:** Verifies initial attempt allowances and throttles upon 5 failed attempts with active cooldown window.

---

## 8. Milestone 7.3 Test Suite — RBAC, Exactly One SUPER_ADMIN Invariant & Advisory Locks

- **Test File:** `tests/unit/rbac.test.ts` (33 tests)
- **Coverage Areas:**
  1. Role permissions mapping matrix across all 14 `PermissionKey` permissions for `SUPER_ADMIN`, `ADMIN`, and `EDITOR`.
  2. `hasPermission`, `requirePermission`, `requireRole` guards.
  3. Non-escalation invariants: `ADMIN` and `EDITOR` prohibited from user management or role elevation.
  4. Self-modification guard: Administrators cannot alter own roles, deactivate self, or delete self.
  5. Exactly One `SUPER_ADMIN` Invariant: Only `isBootstrap: true` creates a `SUPER_ADMIN`; standard creation rejected with `ExactlyOneSuperAdminError`.
  6. Sole `SUPER_ADMIN` Protection: Demotion, deactivation, or deletion of the master account rejected across all paths (`SoleSuperAdminProtectionError`).
  7. PostgreSQL advisory lock integration (`SELECT pg_advisory_xact_lock(hashtext('super_admin_lifecycle_lock'))`).
  8. Server Actions authorization and immutable audit logging.

---

## 9. Milestone 7.4 Test Suite — Route Protection Middleware & Shared Admin UI

- **Test Files:**
  - `tests/unit/middleware.test.ts` (14 tests)
  - `tests/unit/cookie.test.ts` (14 tests)
  - `tests/unit/admin-ui.test.tsx` (11 tests)
  - `tests/e2e/auth.spec.ts` (18 Playwright E2E tests across 3 viewports: mobile-375, mobile-320, desktop)
- **Coverage Areas:**
  1. Edge middleware route protection: Unauthenticated visits to `/admin/*` redirect to `/admin/login?callbackUrl=...`.
  2. Unauthenticated API calls to `/api/admin/*` receive HTTP 401 Unauthorized.
  3. Tampered or expired cookie rejection.
  4. Open redirect protection (`sanitizeCallbackUrl`): Strips protocol-relative URLs (`//evil.com`), Windows backslashes (`/\evil.com`), control characters, and external URI schemes.
  5. Single shared login UI: Form rendering, accessible labels, generic error banner (`data-testid="auth-error-banner"`), password visibility toggle.
  6. Role-aware admin dashboard shell: `AdminSidebar` dynamically adjusts navigation items based on `SUPER_ADMIN`, `ADMIN`, or `EDITOR` role.

---

## 10. Milestone 7.5 Test Suite — Bootstrap CLI & Audit Logging Engine

- **Test Files:**
  - `tests/unit/admin-bootstrap.test.ts` (18 tests)
  - `tests/unit/bootstrap-concurrency.test.ts` (3 tests — Unit & Mocked Simulation)
  - `tests/unit/audit.test.ts` (11 tests)
  - `tests/integration/bootstrap-concurrency.integration.test.ts` (2 tests — Real PostgreSQL Concurrency Integration)
- **Total Project Tests:** **280 passing across 18 test suites (100% pass rate)**.
- **Coverage Areas:**
  1. **Bootstrap Input Validation (`bootstrapInputSchema`):** Full name length constraints, valid email format, master password strength (min 12 chars, uppercase, lowercase, digit, symbol), and confirmation match.
  2. **Strict Interactive TTY & Hidden Input Enforcement:** Verifies `promptHidden` and `runBootstrapCli` immediately reject non-TTY execution or redirected stdin with `NonInteractiveTerminalError` (exit code 1). Proves visible readline input is never used as a password fallback. Verifies safe terminal mode restoration.
  3. **Database Pre-Flight Diagnostics:** Connection readiness, table detection, existing `SUPER_ADMIN` count check, and sanitized error reporting (`[REDACTED_CREDENTIALS]`).
  4. **Bootstrap Execution & Invariant Enforcement:** Single initial account creation holding `isBootstrap: true`, scrypt hashing with 16-byte random salt, and atomic transaction commit.
  5. **Real PostgreSQL Concurrency & Transaction Serialization (`tests/integration/bootstrap-concurrency.integration.test.ts`):**
     - Executed against an isolated local PostgreSQL database (`voidtech_test_concurrency` on `localhost:5432`). Zero contact with production Neon.
     - Spawns two independent `PrismaClient` instances executing simultaneous bootstrap transactions.
     - Proves PostgreSQL serializes execution via `SELECT pg_advisory_xact_lock(hashtext('super_admin_lifecycle_lock'))`.
     - Confirms exactly one transaction succeeds (`fulfilled`), creating 1 `SUPER_ADMIN` and 1 `ADMIN_BOOTSTRAP_SUCCESS` audit log.
     - Confirms the competing concurrent transaction is rejected (`rejected`) with `ExactlyOneSuperAdminError`.
     - Forces an audit logging failure inside the transaction and confirms PostgreSQL completely rolls back user creation, leaving 0 accounts and 0 audit logs.
  6. **Automated Credential Redaction (`sanitizeAuditDetails`):** Recursively redacts passwords, hashes, tokens, secrets, cookies, OTPs, and connection strings from audit metadata, capping recursion depth at 6 levels.
  7. **Append-Only Immutability & Decoupled Historical Preservation:** Verifies zero update or delete methods exist in the audit engine, and proves historical audit logs persist intact even when an administrator account is deleted.

---

## 11. Admin Console Route Remediation & Content Action Test Suites

- **Test Files:**
  - `tests/unit/admin-content-actions.test.tsx` (17 tests)
  - `tests/unit/admin-ui.test.tsx` (11 tests — enhanced with exact URL navigation assertions)
  - `tests/e2e/admin-routes.spec.ts` (30 Playwright E2E tests across `mobile-375`, `mobile-320`, `desktop`)
- **Total Project Tests:** **297 passing unit & integration tests across 19 test suites (100% pass rate) + 30 passing Playwright E2E tests**.
- **Coverage Areas:**
  1. **Admin Access Denied Primitive (`<AdminAccessDenied />`):**
     - Renders HTTP 403 Forbidden state badge, active role indicator, required permission badge, and "Return to Overview" CTA (`/admin`).
  2. **Admin Content Server Actions Authorization & Execution (`src/server/actions/admin-content.actions.ts`):**
     - `updateEnquiryStatusAction`: Origin verification, authentication guard, role enforcement (EDITOR denied, ADMIN allowed), and automatic `ENQUIRY_STATUS_UPDATED` audit log generation.
     - `appendEnquiryNoteAction`: Origin verification, authentication guard, role enforcement (EDITOR denied, ADMIN allowed), reviewer attribution.
     - `deleteEnquiryAction`: Restricted strictly to `SUPER_ADMIN` (`enquiries:delete`), rejected for `ADMIN`/`EDITOR`, automatic `ENQUIRY_DELETED` audit log.
     - `updateSiteSettingAction`: Restricted strictly to `SUPER_ADMIN` (`settings:manage`), rejected for `ADMIN`, atomic `SiteSetting` persistence, and `SETTINGS_UPDATED` audit log.
     - `toggleServiceActiveAction`: Allowed for `SUPER_ADMIN`, `ADMIN`, and `EDITOR` (`services:manage`).
     - `createFaqAction`: Input validation, allowed for all 3 roles (`faqs:manage`).
     - `togglePricingPackageActiveAction`: Allowed for `SUPER_ADMIN` and `ADMIN`, restricted from `EDITOR` (`pricing:manage`).
  3. **Playwright E2E Route Verification (`tests/e2e/admin-routes.spec.ts`):**
     - All 8 remediated admin routes (`/admin/users`, `/admin/audit-logs`, `/admin/settings`, `/admin/enquiries`, `/admin/services`, `/admin/pricing`, `/admin/portfolio`, `/admin/faqs`) tested across 3 viewports (`mobile-375`, `mobile-320`, `desktop`).
     - Verifies unauthenticated visits redirect with HTTP 307 to `/admin/login` preserving the exact `callbackUrl` parameter.
     - Confirms zero 404 Not Found HTTP status responses or Next.js 404 page content across all 8 routes.
     - Verifies responsive admin portal layout with zero horizontal viewport overflow on narrow mobile screens (320px and 375px).

---

## 12. Authenticated Admin Route & Server-Side RBAC Acceptance Test Suite

- **Test Files:**
  - `tests/integration/admin-rbac-acceptance.integration.test.ts` (35 tests — Isolated PostgreSQL Integration)
  - `tests/unit/admin-authenticated-pages.test.tsx` (20 tests — Page Component & RBAC Isolation Unit)
  - `tests/e2e/admin-authenticated.spec.ts` (60 Playwright E2E tests across `mobile-375`, `mobile-320`, `desktop`)
- **Total Project Tests:** **352 passing Vitest unit & integration tests across 21 test suites (100% pass rate) + 90 passing Playwright E2E tests (30 route-remediation + 60 authenticated RBAC)**.
- **Coverage Areas:**
  1. **Isolated Test Account Provisioning & Password Security:**
     - Runs against dedicated local PostgreSQL instance (`voidtech_test_concurrency`).
     - Generates isolated test accounts for `SUPER_ADMIN`, `ADMIN`, and `EDITOR`. Zero production accounts created or modified.
     - Enforces Scrypt password hashing with cryptographically random 16-byte salt (`salt:derivedKey`). Confirms passwords are never stored in plain text or logged.
     - Proves dual-layer session verification: opaque 256-bit raw token, SHA-256 token hash stored in PostgreSQL, and HMAC-signed session cookie (`vts_session`).
  2. **Authoritative 11-Operation Server-Side RBAC Matrix Verification (33 Checks):**
     - Full evaluation of all 11 operations across all 3 roles (`SUPER_ADMIN`, `ADMIN`, `EDITOR`):
       - `dashboard:view`: Allowed for SUPER_ADMIN, ADMIN, EDITOR.
       - `admins:manage`: Allowed strictly for SUPER_ADMIN; rejected with HTTP 403 for ADMIN and EDITOR.
       - `audit_logs:view`: Allowed strictly for SUPER_ADMIN; rejected with HTTP 403 for ADMIN and EDITOR.
       - `settings:manage`: Allowed strictly for SUPER_ADMIN; rejected with HTTP 403 for ADMIN and EDITOR.
       - `enquiries:view`: Allowed for SUPER_ADMIN, ADMIN, EDITOR.
       - `enquiries:update_status`: Allowed for SUPER_ADMIN and ADMIN; rejected with HTTP 403 for EDITOR.
       - `enquiries:delete`: Allowed strictly for SUPER_ADMIN; rejected with HTTP 403 for ADMIN and EDITOR.
       - `services:manage`: Allowed for SUPER_ADMIN, ADMIN, EDITOR.
       - `pricing:manage`: Allowed for SUPER_ADMIN and ADMIN; rejected with HTTP 403 for EDITOR.
       - `portfolio:manage`: Allowed for SUPER_ADMIN, ADMIN, EDITOR.
       - `faqs:manage`: Allowed for SUPER_ADMIN, ADMIN, EDITOR.
  3. **Direct Server Action Invocations & Zero-Leakage Invariants:**
     - Verifies rejected mutations leave database records completely untouched and produce zero audit logs.
     - Proves authorized mutations persist changes and atomically produce structured audit trail records attributing the authenticated actor.
  4. **Security Regressions & Boundary Defenses:**
     - **Session Revocation:** Revoking a session token immediately invalidates authentication.
     - **Idle Timeout (30 min):** Sessions idle for > 30 minutes are rejected with `IDLE_TIMEOUT`.
     - **Absolute Lifetime (8 hr):** Sessions older than 8 hours are rejected with `ABSOLUTE_TIMEOUT`.
     - **Inactive Administrator Guard:** Deactivated accounts (`isActive: false`) are rejected with `USER_INACTIVE`.
     - **Origin & CSRF Defense:** Cross-origin Server Action invocations without matching origin are rejected.
     - **Sole SUPER_ADMIN Defense:** Self-modification, demotion, deactivation, or deletion of the master account rejected across all paths (`SelfModificationError`, `SoleSuperAdminProtectionError`).
     - **Exactly-One-SUPER_ADMIN Invariant:** Secondary SUPER_ADMIN creation rejected via repository and action guards (`ExactlyOneSuperAdminError`).
     - **Audit Trail Immutability:** Audit repository contains zero update/delete exports, preventing tampering.
     - **Credential Scrubbing:** User repository `getAllAdmins` strictly strips `passwordHash` and `sessionToken`.
  5. **Component-Level Page Mounting Tests (`tests/unit/admin-authenticated-pages.test.tsx`):**
     - Mounts all 9 page server components under mocked `SUPER_ADMIN`, `ADMIN`, and `EDITOR` sessions.
     - Confirms SUPER_ADMIN receives unrestricted access to all 9 pages without `<AdminAccessDenied />`.
     - Confirms ADMIN is restricted from `/admin/users`, `/admin/audit-logs`, `/admin/settings`, rendering `<AdminAccessDenied />` with HTTP 403 Forbidden state and zero data leakage.
     - Confirms EDITOR is restricted from `/admin/pricing`, `/admin/users`, `/admin/audit-logs`, `/admin/settings`, and renders `/admin/enquiries` in Read-Only mode.
  6. **Playwright Authenticated Browser E2E Tests (`tests/e2e/admin-authenticated.spec.ts`):**
     - 60 test cases across 3 viewports (`mobile-375`, `mobile-320`, `desktop`).
     - Verifies interactive login flow at `/admin/login`, generic rejection of invalid credentials (`data-testid="auth-error-banner"`), and redirect to `/admin` upon successful authentication.
     - Verifies direct authenticated navigation with signed session cookies across all 9 routes and all 3 roles, proving responsive layout, correct role badge displays, and server-side access denials.




---

## 9. Phase 8.4: Full Website Visual & Functional Acceptance Test Suites

### 9.1 Technical SEO & Canonical Domain Unit Tests (`tests/unit/seo.test.ts`)
- **Suite Execution:** `npx vitest run tests/unit/seo.test.ts` (4 / 4 passing).
- **Verified Invariants:**
  1. `siteConfig.url` strictly defaults to `https://voidtechsolution.codedev.co.in`.
  2. `robots()` dynamically returns compliant rules: disallowing `/admin/` and `/api/`, allowing `/`, and referencing `${siteConfig.url}/sitemap.xml`.
  3. `sitemap()` dynamically indexes all 6 public routes (`/`, `/about`, `/services`, `/pricing`, `/portfolio`, `/contact`) and portfolio concept slugs (`/portfolio/[slug]`).
  4. All public route metadata declare `alternates.canonical` pointing to the canonical domain.

### 9.2 Comprehensive 10-Viewport & 6-User-Journey Acceptance Suite (`tests/e2e/phase-8-4-acceptance.spec.ts`)
- **Suite Execution:** `npx playwright test tests/e2e/phase-8-4-acceptance.spec.ts` (48 / 48 passing).
- **Scope Covered:**
  - **10 Viewports:** 320px, 360px, 375px, 390px, 430px, 768px, 1024px, 1280px, 1440px, 1920px. Proves `scrollWidth <= clientWidth` on all 6 public routes.
  - **User Journey A (Services Catalog & Prefill):** Filters 18 services, searches "AI" -> "AI Agents", navigates to `/contact?service=AI%20Agents` with prefilled focus banner.
  - **User Journey B (Pricing Packages & Estimator):** Displays all 10 INR starting pricing tiers, verifies `#calculator` section, selects package CTA -> `/contact?package=basic-static`.
  - **User Journey C (Portfolio Concepts):** Displays Concept Lab disclosures, opens case study, validates architecture blueprint and simulated benchmark metrics.
  - **User Journey D (Contact Intake & Validation):** 3-step intake form enforces validation at each boundary. Step 1 selects track; Step 2 validates brief text length (>= 10 chars); Step 3 validates name, work email, and consultation consent.
  - **User Journey E (Navigation & Mobile Drawer):** Single BrandLogo in mobile header; opens and closes drawer via menu button, Escape key, backdrop click, and link navigation; restores focus.
  - **User Journey F (Admin Security & RBAC):** Unauthenticated visits to 9 protected admin routes redirect to `/admin/login?callbackUrl=...` with HTTP 307.

### 9.3 Overall Regression Suite Status
- **Typecheck:** `npm run typecheck` — 0 errors.
- **Lint:** `npm run lint` — 0 warnings, 0 errors.
- **Unit & Integration Suite (Vitest):** 393 / 393 passing across 24 test files.
- **Playwright Regression Suite:** 118 / 118 passing across all viewports.
- **Visual Capture Suite:** 66 / 66 screenshots captured.
- **Production Compilation:** 29 routes built cleanly via `npm run build`.

---

## 10. Phase 9.1: CRM Lead Management & Pipeline Test Suites

### 10.1 CRM Models & Repositories Unit Suite (`tests/unit/crm-models.test.ts`)
- **Suite Execution:** `npx vitest run tests/unit/crm-models.test.ts` (25 / 25 passing).
- **Tested Modules & Invariants:**
  1. **`LeadNotesRepo`:**
     - Creates internal notes with author attribution and enquiry linkage.
     - Retrieves notes sorted with pinned notes first (`isPinned: desc`), then newest (`createdAt: desc`).
     - Toggles pinned flag and deletes notes securely.
  2. **`LeadFollowUpsRepo`:**
     - Schedules follow-ups and automatically updates `enquiry.nextFollowUpAt`.
     - Queries overdue follow-ups (`dueAt < now` and `isCompleted = false`).
     - Toggles completion state with `completedAt` timestamp recording.
     - Safely deletes follow-ups.
  3. **`LeadActivitiesRepo`:**
     - Logs immutable activity events (`STATUS_CHANGE`, `NOTE_ADDED`, etc.) with JSON metadata payloads.
     - Retrieves activity timelines in reverse chronological order with pagination limits.
  4. **`LeadAssignmentsRepo`:**
     - Atomically assigns leads inside a transaction, setting previous assignments to `isActive = false` with `unassignedAt` timestamps and updating `enquiry.assignedAdminId`.
     - Validates that target admin exists and is active before assigning.
     - Rejects assignment to deactivated administrators (`isActive: false`).
     - Unassigns leads and clears `enquiry.assignedAdminId`.
     - Hydrates active assignment with safe admin projection.
  5. **`NotificationsRepo` & Recipient Isolation:**
     - Creates notifications strictly targeted to `recipientId`.
     - Strictly filters queries by `where: { recipientId }` preventing cross-admin data leakage.
     - Accurately counts unread notifications per recipient.
     - Validates recipient ownership before marking notifications as read; rejects cross-admin modification attempts.
     - Bulk marks unread notifications as read for a specific recipient.
  6. **`EnquiriesRepo` CRM Extensions:**
     - Safe relational hydration: hydrates notes, followUps, activities, assignments, and assignedAdmin while strictly excluding `passwordHash`.
     - Optimistic Concurrency Control (OCC): enforces `expectedUpdatedAt`, rejecting stale concurrent updates with `ConcurrencyConflictError`.
     - Status aggregation: accurately calculates counts across all 8 CRM stages (`NEW`, `CONTACTED`, `QUALIFIED`, `PROPOSAL_SENT`, `NEGOTIATION`, `WON`, `LOST`, `ON_HOLD`).
     - Filters by `assignedAdminId` and `hasOverdueFollowUp`.
