# CHANGELOG.md — VOIDTECH SOLUTION

All notable changes to the VOIDTECH SOLUTION platform are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
