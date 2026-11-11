# CHANGELOG.md — VOIDTECH SOLUTION

All notable changes to the VOIDTECH SOLUTION platform are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
