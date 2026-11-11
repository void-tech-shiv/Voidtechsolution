# Architecture Decision Records (ADR) — VOIDTECH SOLUTION

## ADR-001: Next.js App Router for Unified Full-Stack Architecture
- **Date:** 2026-11-11
- **Status:** Accepted
- **Context:** The application requires a fast, SEO-optimized public website alongside an authenticated admin management dashboard and backend API route handlers.
- **Decision:** Use Next.js App Router with TypeScript strict mode. It provides native React Server Components for performance, Server Actions for form submissions, and Route Handlers for API endpoints within a single maintainable repository.
- **Consequences:** Eliminates the operational complexity of maintaining separate frontend and backend microservices while preserving clear boundaries between client and server layers.

## ADR-002: Tailwind CSS with Glassmorphism and Custom Glow Utility Tokens
- **Date:** 2026-11-11
- **Status:** Accepted
- **Context:** The brand identity mandates a premium, futuristic aesthetic with black/charcoal backgrounds (`#0a0a0c`, `#050507`), electric violet/purple accents (`#8b5cf6`, `#7c3aed`), subtle glassmorphism, and controlled glow effects.
- **Decision:** Configure Tailwind CSS with custom color extensions, glassmorphism border/background utilities, and radial glow gradients.
- **Consequences:** Consistent design language, zero CSS runtime overhead, and rapid component authoring.

## ADR-003: Prisma ORM with PostgreSQL
- **Date:** 2026-11-11
- **Status:** Accepted
- **Context:** Relational consistency is required for leads, client inquiries, service offerings, portfolio items, and admin users.
- **Decision:** Standardize on PostgreSQL with Prisma ORM. For Phase 1, define the schema architecture and client configuration while deferring physical database provisioning and migrations to Phase 3.
- **Consequences:** Type-safe database queries, declarative schema migrations, and compatibility with standard serverless/hosted Postgres providers (Supabase, Neon, AWS RDS).

## ADR-004: Vitest & Playwright Testing Strategy
- **Date:** 2026-11-11
- **Status:** Accepted
- **Context:** Fast unit/component feedback loops and end-to-end browser testing are needed without slowing down developer velocity.
- **Decision:** Use Vitest with React Testing Library for lightning-fast unit and component test execution, paired with Playwright for browser-level E2E integration tests.
- **Consequences:** Unified ESM support, native TypeScript execution, and high test confidence.
