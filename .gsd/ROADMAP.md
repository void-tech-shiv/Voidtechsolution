---
milestone: Milestone 2 - Design System & Brand UI
version: 1.2.0
updated: 2026-11-11T23:54:45+05:30
---

# ROADMAP.md — VOIDTECH SOLUTION

> **Current Phase:** Phase 3 — Database Design, Schema Setup & Data Layer
> **Status:** ✅ Complete
> **Milestone:** Milestone 2 (Design System & Brand UI — Completed)

## Must-Haves (from SPEC)
- [x] Enterprise-grade Next.js App Router codebase with strict TypeScript configuration
- [x] Centralized design system foundations (Tailwind palette, typography, glassmorphism tokens)
- [x] Reusable UI component library (Buttons, Cards, Forms, Layout, Feedback)
- [x] Responsive Header with mobile drawer & enhanced Footer
- [x] Dedicated /design-system preview route for verification
- [x] Validated PostgreSQL Prisma schema and resilient singleton client
- [x] Type-safe repository abstraction layer for all domain entities
- [x] Automated database seeding script for all 18 business services
- [x] Comprehensive documentation suite in `docs/`
- [x] Production-ready environment contract (`.env.example`)
- [x] Verified clean builds, linting, and 43 unit/component tests passing

---

## Complete 12-Phase Roadmap

### Phase 1: Project Initialization, Specification & Foundation (Milestone 1)
**Status:** ✅ Complete
**Objective:** Establish foundational engineering architecture, GSD specifications, Next.js scaffolding, strict TypeScript rules, testing setup, and complete documentation suite.
**Dependencies:** None
**Plans:**
- [x] Plan 1.1: Workspace inspection, Git setup, GSD specification & project registration
- [x] Plan 1.2: Next.js + Tailwind + TypeScript strict + Prisma schema scaffold & tooling
- [x] Plan 1.3: Architectural documentation suite & verification

---

### Phase 2: Design System, Brand Theme & UI Components (Milestone 2)
**Status:** ✅ Complete
**Objective:** Build out semantic design tokens, Next.js optimized typography, dark charcoal/black theme, electric purple glow accents, glassmorphic card containers, button primitives, form inputs, feedback elements, responsive navigation header with mobile drawer, enhanced footer, and the /design-system preview route.
**Dependencies:** Phase 1
**Plans:**
- [x] Plan 2.1: Semantic Design Tokens & Next.js Typography
- [x] Plan 2.2: Reusable UI Component Library & Layout Primitives
- [x] Plan 2.3: Design Preview Route (/design-system), Tests & Documentation

---

### Phase 3: Database Design, Schema Setup & Data Layer (Milestone 2)
**Status:** ✅ Complete
**Objective:** Finalize PostgreSQL schema via Prisma ORM, configure connection pooling (Accelerate/PgBouncer), create migration scripts, seed initial data for services and settings, and build database client abstractions.
**Dependencies:** Phase 2
**Plans:**
- [x] Plan 3.1: Schema Optimization, Repository Layer & Seeding Engine

---

### Phase 4: Public Marketing Pages — Home, Services & Dynamic Showcase (Milestone 3)
**Status:** ⬜ Not Started
**Objective:** Implement the high-converting homepage (Hero, dynamic particle/glow background, value propositions, client logos, testimonials) and dynamic `/services` listing with individual detail pages for all 18 services.
**Dependencies:** Phase 3

---

### Phase 5: Public Marketing Pages — About, Portfolio & Case Studies (Milestone 3)
**Status:** ⬜ Not Started
**Objective:** Construct `/about` agency story, engineering philosophy, and the `/portfolio` showcase with interactive filtering by category, live preview links, and detailed case study pages.
**Dependencies:** Phase 4

---

### Phase 6: Public Marketing Pages — Pricing Calculator, Contact & Enquiry Flow (Milestone 4)
**Status:** ⬜ Not Started
**Objective:** Build `/pricing` with interactive tier selector, bespoke project estimation calculator, and full `/contact` multi-step enquiry form with Zod validation, rate limiting, and email dispatch hooks.
**Dependencies:** Phase 5

---

### Phase 7: Authentication, Session Management & Role-Based Access Control (Milestone 5)
**Status:** ⬜ Not Started
**Objective:** Implement secure credentials-based admin authentication with protected route middleware, session rotation, CSRF protection, and audit logging.
**Dependencies:** Phase 6

---

### Phase 8: Admin Dashboard — Core Architecture, Overview & Metrics (Milestone 5)
**Status:** ⬜ Not Started
**Objective:** Create authenticated admin shell layout, sidebar navigation, top metrics (total enquiries, conversion rates, active projects, pipeline value), and recent activity feed.
**Dependencies:** Phase 7

---

### Phase 9: Admin Dashboard — Enquiry Management & Lead Pipeline (Milestone 6)
**Status:** ⬜ Not Started
**Objective:** Develop the enquiry management Kanban/table, status updates (New, Contacted, In Review, Converted, Closed), client notes, and automated email reply triggers.
**Dependencies:** Phase 8

---

### Phase 10: Admin Dashboard — Content Management & System Settings (Milestone 6)
**Status:** ⬜ Not Started
**Objective:** Implement CRUD capabilities for Portfolio items, Service offerings, Pricing tiers, and global agency settings (contact details, notification endpoints, social links).
**Dependencies:** Phase 9

---

### Phase 11: End-to-End Testing, Security Hardening, SEO & Performance (Milestone 7)
**Status:** ⬜ Not Started
**Objective:** Write Playwright E2E tests, audit security headers (CSP, HSTS), configure metadata/OpenGraph/sitemap/robots.txt, and tune Core Web Vitals (LCP < 2.0s, CLS < 0.1).
**Dependencies:** Phase 10

---

### Phase 12: Production Readiness, CI/CD, Deployment & Launch (Milestone 7)
**Status:** ⬜ Not Started
**Objective:** Setup GitHub Actions CI workflows, automated Vercel preview & production deployments, production PostgreSQL database provisioning, domain verification, and operational runbooks.
**Dependencies:** Phase 11

---

## Progress Summary

| Phase | Milestone | Status | Plans | Complete |
|-------|-----------|--------|-------|----------|
| 1. Foundation | M1 | 🔄 In Progress | 3 | 1/3 |
| 2. Design System | M2 | ⬜ Not Started | TBD | — |
| 3. Database Layer | M2 | ⬜ Not Started | TBD | — |
| 4. Home & Services | M3 | ⬜ Not Started | TBD | — |
| 5. About & Portfolio | M3 | ⬜ Not Started | TBD | — |
| 6. Pricing & Contact | M4 | ⬜ Not Started | TBD | — |
| 7. Authentication | M5 | ⬜ Not Started | TBD | — |
| 8. Admin Shell & Metrics | M5 | ⬜ Not Started | TBD | — |
| 9. Enquiry Pipeline | M6 | ⬜ Not Started | TBD | — |
| 10. Admin Content & Settings | M6 | ⬜ Not Started | TBD | — |
| 11. Testing & SEO | M7 | ⬜ Not Started | TBD | — |
| 12. Deployment & Launch | M7 | ⬜ Not Started | TBD | — |

