# Discuss Phase 3 — Database Design, Schema Setup & Data Layer

## Objective
Establish the robust, type-safe data access layer for VOIDTECH SOLUTION utilizing **PostgreSQL** and **Prisma ORM**. This includes schema finalization, index optimization, connection pooling resilience, repository abstraction patterns for all domain entities, an automated seed engine for the 18 registered agency services, and comprehensive unit tests.

---

## 1. Scope Clarification & Technical Alignments

### In Scope for Phase 3:
- **Prisma Schema Optimization (`prisma/schema.prisma`):**
  - Verify and optimize entity models: `Enquiry`, `Service`, `PortfolioProject`, `AdminUser`, `SystemSetting`.
  - Ensure proper indexes on foreign lookup keys, enum filtering (`status`, `category`), and timestamps (`createdAt`).
  - Strict type generation via `prisma generate`.
- **Database Client & Connection Strategy (`src/lib/prisma.ts`):**
  - Resilient singleton Prisma Client that gracefully handles pooled connections (PgBouncer/Neon/Supabase) and offline fallback during build-time static page pre-rendering.
- **Repository Pattern Layer (`src/server/repositories/`):**
  - `enquiries.repo.ts`: CRUD, filtering by status, pagination, and note attachment.
  - `services.repo.ts`: Fetching active services, retrieval by slug, featured service lookups, and administrative mutations.
  - `portfolio.repo.ts`: Fetching case studies, filtering by industry, featured project queries, and management.
  - `users.repo.ts`: Admin user lookup by email, session retrieval, password hash storage, and login audit tracking.
  - `settings.repo.ts`: Dynamic agency settings key-value retrieval and updates.
- **Database Seeding Engine (`prisma/seed.ts`):**
  - Programmatic seeder that populates all 18 business services with verified technical data from `src/config/site.ts`.
  - Seeds baseline system settings (contact details, lead notifications, auto-reply flags).
  - Configured in `package.json` for deterministic execution via `npx prisma db seed`.
- **Testing & Verification:**
  - Automated tests validating repository contracts, Prisma type safety, query construction, and seed data integrity.
  - Verification with `tsc --noEmit`, `next lint`, `vitest run`, and `next build`.

### Strictly Out of Scope:
- No public marketing UI implementation (Home, About, Services catalog UI remain scheduled for Phases 4-6).
- No admin dashboard UI implementation (scheduled for Phases 7-10).
- No hardcoded remote database credentials in source code.

---

## 2. Technical Decisions & Patterns

### 1. Repository Pattern over Direct Model Access
- **Why:** Wrapping Prisma operations in domain repositories isolates database query logic from Next.js route handlers and server actions. This provides a single location for input sanitization, caching headers, error handling, and test mocking.

### 2. Build-Time Resilience
- **Context:** During Next.js production builds (`next build`), static pages pre-render without necessarily having a live production database connected.
- **Decision:** The repository functions must catch connection errors gracefully and provide fallback data (e.g. from static configuration in `src/config/site.ts`) during static generation, ensuring builds are deterministic and zero-downtime friendly.

### 3. Connection Pooling Strategy
- **Prisma Datasource Configuration:**
  - `url = env("DATABASE_URL")` (Pooled connection string e.g. PgBouncer on port 6543)
  - `directUrl = env("DIRECT_URL")` (Direct connection string on port 5432 for migrations)

