# Phase 4: Public Marketing Website — Homepage, Services & Dynamic Showcase
## Scope Discussion & Engineering Alignment

**Phase:** Phase 4  
**Milestone:** Milestone 3 — Public Marketing Website  
**Date:** 2026-11-12  
**Brand Identity:** VOIDTECH SOLUTION ("Build. Launch. Grow Online.")  
**Authorized Scope:** Homepage (9 strategic sections), Services Showcase, Development Process, Why Choose VoidTech, Concept Portfolio Integration, INR Pricing Preview, FAQ Accordion, and Closing Conversion Section.

---

### 1. Scope & Core Objectives
1. **Homepage Architecture (`src/app/page.tsx`):**
   - Section 1 — Hero: Headline "Turning Ideas Into Powerful Digital Products.", supporting copy, primary CTA "Start Your Project", secondary CTA "Explore Our Services", authentic badges.
   - Section 2 — Brand Introduction: Authentic message on technology advancing business, bespoke engineering, and pragmatic development.
   - Section 3 — Services Showcase: Data-driven service catalog rendering all 18 approved services via `ServicesRepo.getAllServices()` with safe fallback, category tags, Lucide icons, and INR starting prices.
   - Section 4 — Why Choose VoidTech: 6 practical engineering differentiators (custom requirements, modern stack, accessible UI, thoughtful process, direct communication, maintainable architecture).
   - Section 5 — Development Process: 7-stage development methodology (Discovery, Planning, UI/UX Design, Development, Testing, Deployment, Support).
   - Section 6 — Featured Projects: Sourced from `PortfolioRepo`, displaying verified internal CONCEPT prototypes (`algorithmic-liquidity-engine`, `autonomous-ai-ops-agent`) with prominent "CONCEPT" badge.
   - Section 7 — Pricing Preview: Sourced from `PricingRepo`, highlighting 10 approved starting price tiers in INR (₹999 to ₹59,999+) with "Starting from" notation and preserved `+` symbols.
   - Section 8 — FAQ Preview: Sourced from `FaqRepo`, featuring an accessible keyboard-navigable accordion with ARIA attributes and smooth animations.
   - Section 9 — Final CTA: Headline "Have an Idea? Let's Build It.", supporting copy, and direct inquiry CTA.

2. **Component & Design System Additions:**
   - Accessible `Accordion` primitive in `src/components/ui/accordion.tsx` with full keyboard navigation and WAI-ARIA compliance.
   - Dynamic Lucide Icon mapper for services (`src/components/sections/service-icon.tsx`).
   - Interactive client-side category filter for services (`src/components/sections/services-filter.tsx`).
   - FAQ Accordion interactive client component (`src/components/sections/faq-accordion.tsx`).
   - Quick Project Consultation component for Section 9 (`src/components/sections/quick-inquiry.tsx`).

3. **Strict Constraints & Boundaries:**
   - Zero database mutations (no migrations, no `prisma db push`, no seed).
   - Remote database empty condition handled safely via existing repository fallbacks.
   - Strictly NO separate `/about`, `/portfolio`, `/pricing`, `/contact` form submission, or admin portal implementations (future phases).
   - Zero real emails sent.
   - No fabricated metrics, testimonials, or fake social proof.
   - Strict TypeScript, ESLint, Vitest, and Next.js build verification.
