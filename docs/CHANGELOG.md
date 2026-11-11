# CHANGELOG.md — VOIDTECH SOLUTION

All notable changes to the VOIDTECH SOLUTION platform are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0] — 2026-11-11
### Phase 1: Project Initialization, Specification & Foundation

#### Added
- **GSD Mission Control Integration:**
  - Initialized canonical GSD specifications (`.gsd/SPEC.md` with Planning Lock status `FINALIZED`).
  - Created complete 12-phase roadmap in `.gsd/ROADMAP.md` covering public marketing pages, 18 services, and admin portal.
  - Initialized `.gsd/STATE.md`, `.gsd/DECISIONS.md` (ADR-001 through ADR-004), `.gsd/JOURNAL.md`, `.gsd/TODO.md`, and `.gsd/RESEARCH.md`.
  - Authored Phase 1 execution files in `.gsd/phases/01-foundation/` (`DISCUSS.md`, `01-01-PLAN.md`).
- **Core Technology Scaffolding:**
  - Configured Next.js 15 with App Router and React 19.
  - Enforced TypeScript strict mode (`tsconfig.json`) with path aliases (`@/*`).
  - Configured Tailwind CSS with custom VOIDTECH color tokens (`void-black`, `void-dark`, `void-charcoal`, `electric-purple`, `electric-violet`, `electric-neon`), glassmorphism utilities, and controlled glow effects.
  - Added Lucide React iconography and Framer Motion animation tooling.
  - Set up PostgreSQL schema with Prisma ORM (`prisma/schema.prisma`) defining `Enquiry`, `Service`, `PortfolioProject`, `AdminUser`, and `SystemSetting` models (marked as pending physical connection in Phase 3).
  - Implemented Zod enquiry validation schema (`src/validations/enquiry.ts`).
  - Configured Vitest test runner with jsdom environment and React Testing Library (`tests/setup.ts`, `tests/unit/smoke.test.ts`).
  - Established system health route handler (`src/app/api/health/route.ts`).
  - Created reusable atomic UI components (`Button`, `Card`, `Header`, `Footer`).
  - Built clean foundation landing page (`src/app/page.tsx`) showcasing brand identity, active foundation badge, and 18 pre-registered business services.
- **Documentation Suite:**
  - `README.md`
  - `.env.example`
  - `docs/PROJECT_OVERVIEW.md`
  - `docs/REQUIREMENTS.md`
  - `docs/ARCHITECTURE.md`
  - `docs/DATABASE_DESIGN.md`
  - `docs/API_DOCUMENTATION.md`
  - `docs/DESIGN_SYSTEM.md`
  - `docs/SECURITY.md`
  - `docs/TESTING.md`
  - `docs/DEPLOYMENT.md`
  - `docs/CHANGELOG.md`
  - `docs/PROJECT_STATUS.md`

#### Verified
- Dependency installation: 537 packages installed cleanly.
- Prisma client generation: `npx prisma generate` completed with exit code 0.
- Vitest test suite: 8 passing unit tests (utilities, schemas, services registry).
- TypeScript validation: `tsc --noEmit` passed with 0 errors.
- ESLint quality check: `next lint` passed with 0 warnings/errors.
- Production build: `next build` compiled all routes cleanly with zero static generation errors.
