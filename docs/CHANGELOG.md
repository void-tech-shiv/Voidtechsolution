# CHANGELOG.md — VOIDTECH SOLUTION

All notable changes to the VOIDTECH SOLUTION platform are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.2.0] — 2026-11-11
### Phase 2: Design System, Brand Identity & Reusable UI Components

#### Added
- **Semantic CSS Token System:**
  - Defined CSS custom properties in `src/app/globals.css` for void backgrounds (`--bg-primary`, `--bg-secondary`, `--bg-surface`, `--bg-surface-elevated`), text tiers, electric purple luminescence (`--accent-purple`, `--accent-neon`, `--accent-glow`), structural borders, and semantic status colors (`success`, `warning`, `error`, `info`).
  - Integrated tokens with `tailwind.config.ts` under `void.*`, `electric.*`, and `status.*`.
- **Typography & Next.js Font Optimization:**
  - Integrated `next/font/google` for `Inter` (`--font-sans`) and `JetBrains Mono` (`--font-mono`) with zero layout shift and system fallbacks.
- **Button Primitives Suite (`src/components/ui/button.tsx`):**
  - Created polymorphic `Button` supporting `primary`, `secondary`, `outline`, `ghost`, and `glow` variants.
  - Exported named convenience components: `PrimaryButton`, `SecondaryButton`, `OutlineButton`, `GhostButton`, and `GlowButton`.
  - Added support for sizes (`sm`, `md`, `lg`), `isLoading` state, left and right icon slots, and active scale transitions.
- **Card Primitives Suite (`src/components/ui/card.tsx`):**
  - Implemented `BaseCard` (elevated surface) and `GlassCard` (frosted glass with inner highlight and glow).
  - Implemented specialized agency cards: `ServiceCard`, `PricingCard`, and `ProjectCard`.
- **Form Primitives Suite (`src/components/ui/form.tsx`):**
  - Implemented `FormLabel`, `Input`, `Textarea`, `Select`, and `Checkbox`.
  - Handled unconditional `React.useId()` bindings, `aria-invalid`, `aria-describedby`, error state text, and helper labels.
- **Feedback Primitives Suite (`src/components/ui/badge.tsx` & `src/components/feedback/index.tsx`):**
  - Implemented `Badge` with semantic variants (`default`, `purple`, `success`, `warning`, `error`, `outline`) and optional pulsing dot.
  - Implemented `LoadingState`, `EmptyState`, and `ErrorState` with retry callbacks.
- **Layout Primitives Suite (`src/components/layout/index.tsx`):**
  - Implemented `Container` (narrow, default, wide, full), `Section` (vertical padding tiers), and `SectionHeading`.
- **Responsive Navigation Header & Enhanced Footer:**
  - Upgraded `Header` to a client component with interactive mobile navigation drawer, animated hamburger/close toggle, focus management, body scroll locking, and Escape key listeners.
  - Enhanced `Footer` with multi-column layout, brand introduction, core capabilities links, configurable contact placeholders, and social links.
- **Internal Design System Preview Route:**
  - Created `/design-system` (`src/app/design-system/page.tsx`) showcasing all tokens, typography, buttons, cards, forms, and feedback states.
- **Test Suite Expansion:**
  - Created `tests/unit/design-system.test.tsx` containing 24 comprehensive unit and component tests.
  - Total passing tests expanded from 8 to 32.

#### Verified
- TypeScript validation: `tsc --noEmit` passed with 0 errors.
- ESLint: `next lint` passed with 0 warnings/errors.
- Automated tests: `vitest run` passed with 32/32 tests.
- Production build: `next build` compiled with 0 errors, generating `/design-system` static page cleanly.

---

## [0.1.0] — 2026-11-11
### Phase 1: Project Initialization, Specification & Foundation

#### Added
- GSD Mission Control specification lock and 12-phase roadmap.
- Next.js 15 App Router scaffolding with strict TypeScript.
- Prisma ORM PostgreSQL schema for 5 domain entities.
- Initial UI layout shells and health check Route Handler.
- Complete documentation suite in `docs/` and `.env.example`.
