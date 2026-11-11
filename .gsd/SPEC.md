# SPEC.md — Project Specification

> **Status**: `FINALIZED`
>
> ⚠️ **Planning Lock**: Requirements are finalized for Phase 1 and the full 12-phase roadmap scope.

## Project Identity
- **Project Name:** VoidTech Solution Website
- **Brand:** VOIDTECH SOLUTION
- **Tagline:** Build. Launch. Grow Online.
- **Visual Identity:**
  - Primary Background: Deep Black / Charcoal (`#0a0a0c`, `#050507`)
  - Accent Palette: Electric Purple / Violet (`#8b5cf6`, `#7c3aed`, `#a855f7`)
  - Aesthetics: Premium, modern, futuristic, professional software development agency (not a generic freelancer template).
  - Characteristics: Subtle glassmorphism, controlled neon glow, clean typography, consistent spacing, smooth restrained animations.

## Vision
Build a world-class, premium, high-performance software agency website and operations portal for VOIDTECH SOLUTION. The platform showcases 18 core software development, automation, and AI service offerings, captures client leads through a multi-step enquiry pipeline, and provides an authenticated, PostgreSQL-backed admin management portal for business operations.

## Primary Goals
1. **Brand Authority & Conversion:** Present VOIDTECH SOLUTION as an elite software engineering agency with responsive, dark-mode-first aesthetic, crisp typography, and interactive service showcases.
2. **Comprehensive Service Catalog:** Feature all 18 core services with clear technical offerings, tiered engagement models, and interactive estimation/enquiry touchpoints.
3. **High-Integrity Enquiry System:** Provide resilient lead generation with client-side & server-side validation (Zod + React Hook Form), spam protection, and database persistence.
4. **Secure Admin Dashboard:** Deliver an authenticated portal for lead management, content administration (services, portfolio, pricing), and system settings.
5. **Rock-Solid Engineering Foundation:** Modern Next.js App Router, strict TypeScript, Prisma ORM with PostgreSQL, Vitest/RTL/Playwright testing infrastructure, and Vercel/GitHub CI/CD readiness.

## Non-Goals (Out of Scope for Initial Version)
- Self-serve credit-card checkout or automatic instant software delivery (agency services are consultation-driven and contract-based).
- Multi-tenant client portals with invoice generation (reserved for post-launch v2.0 roadmap).
- Complex custom CMS engine replacing static/database content pipelines.
- Mocking or faking business statistics, bogus reviews, or dead interactive elements.

## Users & Personas
1. **Prospective Enterprise / Startup Clients:** Seeking bespoke software engineering, AI agent workflows, web/mobile development, or automation; needing rapid evaluation of capabilities, portfolio proof, and seamless contact.
2. **Agency Administrators / Founders:** Internal team managing inbound enquiries, triaging leads, updating project case studies, and monitoring agency performance metrics.

## Registered Business Services (18 Offerings)
1. Website Development (Corporate, Web Apps, Portals)
2. App Development (iOS, Android, Cross-platform React Native / Flutter)
3. Custom API Development (REST, GraphQL, Webhooks, Integrations)
4. AI Automation (LLM workflows, process automation, workflow scripts)
5. AI Agents (Autonomous multi-agent architectures, tool calling, cognitive bots)
6. Telegram Bots (Trading bots, community management, automated responders)
7. WhatsApp Automation (Business API, customer support flows, notifications)
8. YouTube Automation (Metadata generation, processing pipelines, automated uploads)
9. UI/UX Design (Wireframes, high-fidelity Figma prototypes, design systems)
10. Graphic Design (Brand identities, marketing collaterals, digital assets)
11. Hosting & Deployment (Cloud infrastructure, AWS/GCP/Vercel, Docker, CI/CD)
12. E-commerce Development (Shopify, WooCommerce, custom headless storefronts)
13. SaaS Development (Multi-tenant SaaS architectures, subscription billing, RBAC)
14. LMS Development (Learning Management Systems, course platforms, quizzes)
15. Marketplace Development (Multi-vendor platforms, escrow/payout workflows)
16. ERP & CRM Development (Custom enterprise resource & relationship tooling)
17. UPI & Payment Solutions (Payment gateways, Razorpay/Stripe, QR code automation)
18. Custom Software Solutions (Bespoke internal tools, desktop apps, utilities)

## Registered System Architecture & Scope

### Public Pages
- `/` — Home (Hero, Value Proposition, Featured Services, Proof/Metrics, Testimonials, CTA)
- `/about` — About Us (Company philosophy, engineering standards, team capabilities)
- `/services` & `/services/[slug]` — Comprehensive service catalog and detailed offerings
- `/pricing` — Transparent package tiers, custom project cost estimator
- `/portfolio` & `/portfolio/[slug]` — Case studies, tech stacks, problem-solution breakdowns
- `/contact` — Interactive enquiry form with service selection and timeline requirements

### Admin System
- `/admin/login` — Secure credentials-based authentication
- `/admin` (Dashboard) — Inbound pipeline overview, conversion rate, enquiry volume
- `/admin/enquiries` — Status Kanban / table (New, Reviewing, Contacted, Converted, Archived)
- `/admin/services` — Manage active offerings and descriptions
- `/admin/portfolio` — Add/edit case studies and deployment links
- `/admin/pricing` — Adjust package baselines and addon pricing
- `/admin/settings` — Profile, notification hooks, system preferences

## Success Criteria for Phase 1 (Foundation)
- [x] Workspace inspected, Git initialized, clean branching established.
- [x] GSD Mission Control specifications, roadmap, state, decisions, and todos registered.
- [x] Next.js App Router application initialized with TypeScript strict mode, Tailwind CSS, Lucide icons, Framer Motion.
- [x] Prisma ORM configuration and database schema design established (marking DB implementation as pending Phase 3).
- [x] Validation tooling (Zod, React Hook Form) and testing frameworks (Vitest, RTL, Playwright) structured.
- [x] Scalable folder structure adhering to senior software engineering standards.
- [x] Comprehensive documentation suite created in `docs/` matching all project specifications.
- [x] Environment configuration established in `.env.example` with zero secrets committed.
- [x] Verification checks clean: TypeScript check (`tsc --noEmit`), ESLint, and Production build passing without error.
- [x] Strict stop condition respected: No premature Phase 2 code, no unverified database connections, no fake functionality.

---
*Last updated: 2026-11-11*
