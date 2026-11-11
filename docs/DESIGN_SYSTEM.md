# DESIGN_SYSTEM.md — VOIDTECH SOLUTION Brand & UI Design System

## 1. Brand Identity & Visual Philosophy
**VOIDTECH SOLUTION** embodies high-assurance software engineering, architectural precision, and futuristic elegance. Designed specifically to present a world-class technology agency, the interface avoids generic freelancer tropes in favor of an authoritative, dark-mode-first aesthetic.

- **Brand Name:** VOIDTECH SOLUTION
- **Tagline:** Build. Launch. Grow Online.
- **Design Core:** Deep black and charcoal foundation, electric purple and violet accents, sophisticated glassmorphism, controlled neon glow, clean typography, and purposeful micro-interactions.

---

## 2. Semantic Color Architecture & Tokens

All colors are defined as semantic CSS custom properties in `src/app/globals.css` and mapped to Tailwind CSS utilities in `tailwind.config.ts`.

### Void Neutral Foundations (Backgrounds & Surfaces)
| Token Name | CSS Custom Property | Value / Hex | Purpose |
|---|---|---|---|
| `bg-void-black` | `--bg-primary` | `#050507` | Primary root canvas; abyss black |
| `bg-void-dark` | `--bg-secondary` | `#0a0a0f` | Headers, footers, secondary sections |
| `bg-void-charcoal` | `--bg-surface` | `#121218` | Standard card surfaces, input containers |
| `bg-void-surface` | `--bg-surface-elevated`| `#181824` | Elevated modal dialogs, flyouts |
| `border-void-border`| `--border-primary` | `#262636` | Structural borders, card outlines |
| `border-void-subtle`| `--border-subtle` | `rgba(38, 38, 54, 0.6)`| Inner divider rules |
| `text-void-white` | `--text-primary` | `#f8f8fc` | High-emphasis display titles, headers |
| `text-void-light` | `--text-secondary` | `#e2e2ec` | Primary readable body text |
| `text-void-muted` | `--text-muted` | `#88889c` | Secondary labels, descriptions, timestamps|

### Electric Luminescent Accents
| Token Name | CSS Custom Property | Value / Hex | Purpose |
|---|---|---|---|
| `text-electric-purple` | `--accent-purple` | `#8b5cf6` | Primary brand accent; CTA buttons |
| `bg-electric-violet` | `--accent-purple-hover` | `#7c3aed` | Gradient roots, button hover states |
| `text-electric-neon` | `--accent-neon` | `#a855f7` | Active status indicators, glowing pings |
| `text-electric-cyan` | `--accent-cyan` | `#06b6d4` | Technology and API metadata tags |
| `shadow-glow-md` | `--accent-purple-glow` | `rgba(139, 92, 246, 0.35)` | Controlled luminescent drop shadows |

### Semantic Status Tokens
| State | Text Class | Background Class | Border Class | Hex |
|---|---|---|---|---|
| **Success** | `text-status-success` | `bg-status-success-bg` | `border-status-success-border` | `#10b981` |
| **Warning** | `text-status-warning` | `bg-status-warning-bg` | `border-status-warning-border` | `#f59e0b` |
| **Error** | `text-status-error` | `bg-status-error-bg` | `border-status-error-border` | `#ef4444` |
| **Info** | `text-status-info` | `bg-status-info-bg` | `border-status-info-border` | `#06b6d4` |

---

## 3. Typography Hierarchy

VOIDTECH uses optimized font delivery via `next/font/google`:
- **Sans Display & Body:** `Inter` (`--font-sans`), loaded with `display: "swap"` and system fallbacks.
- **Monospace & Code:** `JetBrains Mono` (`--font-mono`), loaded with `display: "swap"`.

| Element | Tailwind Classes | Tracking & Line Height | Usage |
|---|---|---|---|
| **Display H1** | `font-mono text-4xl sm:text-6xl font-extrabold` | `tracking-tight leading-none` | Hero main headlines |
| **Page H2** | `font-mono text-3xl sm:text-4xl font-bold` | `tracking-tight leading-tight` | Section titles |
| **Section H3** | `text-lg sm:text-xl font-semibold` | `tracking-tight leading-snug` | Card titles, category headers |
| **Lead / Subhead**| `text-base sm:text-lg font-medium` | `leading-relaxed` | Value propositions |
| **Body Regular** | `text-sm sm:text-base font-normal` | `leading-relaxed` | Descriptions, documentation |
| **Micro / Label** | `font-mono text-xs uppercase` | `tracking-wider leading-none` | Badges, tags, form labels |
| **Code / Data** | `font-mono text-xs` | `leading-normal` | Endpoints, metrics, slugs |

---

## 4. Spacing & Responsive Grid Conventions

### Container Sizes
- `Container size="default"`: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` (Standard pages)
- `Container size="narrow"`: `max-w-4xl mx-auto px-4 sm:px-6 lg:px-8` (Articles, forms)
- `Container size="wide"`: `max-w-8xl mx-auto px-4 sm:px-6 lg:px-8` (Dashboards)

### Vertical Section Rhythms
- `Section spacing="sm"`: `py-10 md:py-16` (Compact subsections)
- `Section spacing="md"`: `py-16 md:py-24 lg:py-28` (Standard content sections)
- `Section spacing="lg"`: `py-24 md:py-32 lg:py-40` (Hero sections)

### Responsive Breakpoints
- **Mobile (320px – 767px):** Single-column stacked layouts, minimum touch targets 44x44px.
- **Tablet (768px – 1023px, `md:`):** 2-column card grids, responsive header collapse.
- **Desktop (1024px – 1279px, `lg:`):** 3-column service catalog, horizontal navigation.
- **Wide Desktop (1280px+, `xl:`):** 4-column metrics, expansive container spacing.
- **Horizontal Overflow Prevention:** `overflow-x: hidden` enforced on `html` and `body`.

---

## 5. Component Inventory

### A. Buttons (`src/components/ui/button.tsx`)
- `PrimaryButton`: Violet-to-purple gradient, electric glow shadow, hover brightness.
- `SecondaryButton`: Dark charcoal surface, border hover glow.
- `OutlineButton`: Electric purple border, subtle hover tint.
- `GhostButton`: Muted text, surface hover highlight.
- `GlowButton`: Charcoal body with glowing violet border.
- **Shared Props:** `size: "sm" | "md" | "lg"`, `isLoading?: boolean`, `leftIcon?: ReactNode`, `rightIcon?: ReactNode`, `disabled?: boolean`.

### B. Cards (`src/components/ui/card.tsx`)
- `BaseCard`: Clean elevated surface for dashboards and configuration blocks.
- `GlassCard`: Frosted glassmorphism with subtle inner highlight and hover glow.
- `ServiceCard`: Specialized card for presenting agency services (icon, category pill, title, description, tech stack tags, CTA).
- `PricingCard`: Tier card with pricing, features checklist, and optional "Most Popular" highlight.
- `ProjectCard`: Case study card with client badge, industry, metrics summary, and live link.

### C. Form Primitives (`src/components/ui/form.tsx`)
- `FormLabel`: Accessible label with optional required asterisk indicator.
- `Input`: Accessible input with error state, helper text, and focus ring.
- `Textarea`: Multi-line text field with vertical resize and error styling.
- `Select`: Dropdown select with custom chevron indicator and accessible focus ring.
- `Checkbox`: Accessible checkbox with label and secondary description.

### D. Feedback Primitives (`src/components/ui/badge.tsx` & `src/components/feedback/index.tsx`)
- `Badge`: Variants `default`, `purple`, `success`, `warning`, `error`, `outline` with optional pulsing dot.
- `LoadingState`: Accessible animated SVG spinner with optional loading message.
- `EmptyState`: Empty container with icon, title, description, and action button.
- `ErrorState`: Alert box with error icon, title, message, and retry button.

### E. Layout Primitives (`src/components/layout/index.tsx`)
- `Container`: Responsive width limiter.
- `Section`: Vertical rhythm container.
- `SectionHeading`: Standardized section header with badge, title, highlight, and description.
- `Header`: Sticky navigation header with brand identity, desktop links, and mobile slide-over drawer with ESC key trap.
- `Footer`: Multi-column footer with brand introduction, capabilities links, navigation links, and configurable placeholders.

---

## 6. Internal Design Preview Route

The complete design system can be inspected interactively at:
**`/design-system`**

This internal route provides visual verification of:
1. All semantic color tokens.
2. Complete typography scales and weights.
3. Every button variant, size, and loading state.
4. All five card architectures (Base, Glass, Service, Pricing, Project).
5. All form controls with both valid and error states.
6. Feedback badges, loading states, empty states, and error alerts.
7. Responsive mobile and desktop layout behavior.


---

## 8. Phase 4 Component Extensions

### Accordion (`src/components/ui/accordion.tsx`)
- **Accessibility:** Built adhering to the WAI-ARIA Accordion Pattern (`aria-expanded`, `aria-controls`, `role="region"`).
- **Keyboard Navigation:** Enter/Space toggle, full focus indicator via `focus-visible:ring-2 focus-visible:ring-electric-purple`.
- **Modes:** Supports `type="single"` (default) or `type="multiple"`.
- **Styling:** Subtle glassmorphic container with electric purple accent borders upon expansion.

### Service Icon Mapper (`src/components/sections/service-icon.tsx`)
- Maps service icon name strings (`"Globe"`, `"Smartphone"`, `"Code"`, `"Cpu"`, `"Bot"`, etc.) to Lucide React components with electric purple accents and fallback.

### Services Filter (`src/components/sections/services-filter.tsx`)
- Client-side category pill tabs and keyword search.
- Responsive grid (1 col mobile, 2 cols tablet, 3 cols desktop).
- INR starting price tags with plus signs.

### Quick Inquiry (`src/components/sections/quick-inquiry.tsx`)
- Direct email trigger and one-click copy to clipboard with feedback badge.
- High-impact glassmorphic container with ambient radial glow.
