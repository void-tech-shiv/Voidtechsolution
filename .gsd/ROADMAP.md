---
milestone: Milestone 1 - Project Foundation
version: 1.0.0
updated: 2026-11-11T23:14:00+05:30
---

# ROADMAP.md — VOIDTECH SOLUTION

> **Current Phase:** Phase 1 — Project Initialization, Specification & Foundation
> **Status:** 🔄 In Progress
> **Milestone:** Milestone 1 (Foundation)

## Must-Haves (from SPEC)
- [ ] Enterprise-grade Next.js App Router codebase with strict TypeScript configuration
- [ ] Centralized design system foundations (Tailwind palette, typography, glassmorphism tokens)
- [ ] Comprehensive documentation suite in `docs/`
- [ ] Production-ready environment contract (`.env.example`)
- [ ] Verified clean builds, linting, and typecheck passes

---

## Complete 12-Phase Roadmap

### Phase 1: Project Initialization, Specification & Foundation (Milestone 1)
**Status:** 🔄 In Progress
**Objective:** Establish the foundational engineering architecture, GSD specifications, Next.js application scaffolding, strict TypeScript rules, testing setup, and complete documentation suite.
**Dependencies:** None
**Plans:**
- [x] Plan 1.1: Workspace inspection, Git setup, GSD specification & project registration
- [ ] Plan 1.2: Next.js + Tailwind + TypeScript strict + Prisma schema scaffold & tooling
- [ ] Plan 1.3: Architectural documentation suite & verification

---

### Phase 2: Design System, Brand Theme & UI Components (Milestone 2)
**Status:** ⬜ Not Started
**Objective:** Build out the design tokens, dark charcoal/black theme, electric purple glow accents, glassmorphic card containers, button primitives, navigation headers, and footer components.
**Dependencies:** Phase 1

---

### Phase 3: Database Design, Schema Setup & Data Layer (Milestone 2)
**Status:** ⬜ Not Started
**Objective:** Finalize PostgreSQL schema via Prisma ORM, configure connection pooling (Accelerate/PgBouncer), create migration scripts, seed initial data for services and settings, and build database client abstractions.
**Dependencies:** Phase 2

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
