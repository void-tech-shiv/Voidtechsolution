# CHANGELOG.md — VOIDTECH SOLUTION

All notable changes to the VOIDTECH SOLUTION platform are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
