# Discuss Phase 2 — Design System, Brand Identity & Reusable UI Components

## Objective
Establish a comprehensive, accessible, dark-mode-first design system and reusable UI component library for VOIDTECH SOLUTION ("Build. Launch. Grow Online.") that elevates the agency above generic templates while maintaining strict performance, accessibility, and architectural standards.

---

## 1. Scope Clarification & Alignments

### In Scope for Phase 2:
- **Semantic CSS Token System:** CSS variables in `globals.css` mapped to Tailwind configuration for backgrounds, elevated surfaces, borders, text tiers, electric purple accents, glowing shadows, and status indicators (success, warning, error).
- **Typography Architecture:** Next.js font optimization (`next/font/google` with Inter and JetBrains Mono) with responsive typographic hierarchy for display, headings, body, labels, and buttons.
- **Component Inventory:**
  - **Buttons:** `PrimaryButton`, `SecondaryButton`, `OutlineButton`, `GhostButton` (with sizes, loading states, icons, and keyboard focus rings).
  - **Cards:** `BaseCard`, `GlassCard`, `ServiceCard`, `PricingCard`, `ProjectCard`.
  - **Layout:** `Container`, `Section`, `SectionHeading`, `Header` (with accessible mobile navigation drawer), `Footer` (with configurable contact and social placeholders).
  - **Form Elements:** `Input`, `Textarea`, `Select`, `Checkbox`, `FormLabel`.
  - **Feedback Elements:** `Badge` (semantic variants), `LoadingState`, `EmptyState`, `ErrorState`.
- **Dedicated Design System Preview Route:** `/design-system` for review and component testing.
- **Motion & Accessibility:** Restrained Framer Motion transitions with user reduced-motion checks, WCAG 2.1 AA color contrast, visible focus rings, and zero horizontal scroll.
- **Documentation & Tests:** Synchronized documentation in `docs/` and unit/component tests in `tests/`.

### Strictly Out of Scope:
- No complete homepage build (homepage remains a clean foundation shell).
- No database connection, migrations, or active queries (PostgreSQL / Prisma remains scheduled for Phase 3).
- No authentication or admin portal UI (scheduled for Phases 7-10).
- No active contact form API submission backend (scheduled for Phase 6).

---

## 2. Technical Decisions
- **Token Architecture:** Dual-layer token system: CSS variables define core RGB/HSL channels; Tailwind extends these into semantic utilities (`bg-void-black`, `bg-void-surface`, `text-electric-purple`, `border-void-border`).
- **Font Strategy:** Leverage `next/font/google` for zero-layout-shift font loading with CSS variables `--font-sans` (Inter) and `--font-mono` (JetBrains Mono).
- **Component Organization:** Organize components into clear architectural domains:
  - `src/components/ui/` (Atomic primitives: Button, Card, Badge, Input, Select, etc.)
  - `src/components/layout/` (Structural layout: Container, Section, SectionHeading, Header, Footer)
  - `src/components/feedback/` (Feedback states: LoadingState, EmptyState, ErrorState)
- **Design System Preview Route:** `src/app/design-system/page.tsx` showcasing all tokens, typography, button variants, card variants, form states, and feedback elements in an interactive responsive dashboard.

---

## 3. Verification Criteria
- `npm run typecheck` (`tsc --noEmit`) passes with 0 errors.
- `npm run lint` (`next lint`) passes with 0 warnings/errors.
- `npm test` (`vitest run`) executes all smoke and component tests cleanly.
- `npm run build` (`next build`) compiles static and dynamic pages including `/design-system` with 0 errors.
- Complete responsive inspection (320px to 1536px) with zero horizontal overflow.
- Accessible keyboard navigation and visible focus indicators across all interactive elements.
