# DESIGN_SYSTEM.md — VOIDTECH SOLUTION Brand & UI Design System

## 1. Brand Identity & Visual Philosophy
**VOIDTECH SOLUTION** embodies high-assurance software engineering, architectural precision, and futuristic elegance. Designed specifically to present a world-class technology agency, the interface avoids generic freelancer tropes in favor of an authoritative, dark-mode-first aesthetic.

- **Brand Name:** VOIDTECH SOLUTION
- **Tagline:** Build. Launch. Grow Online.
- **Design Core:** Deep obsidian canvas (`#050507`), elevated surfaces (`#100D1B`, `#171126`), luminous purple/violet accents (`#8B5CF6`, `#A855F7`, `#C084FC`), sophisticated glassmorphism, controlled neon glow, 1440px wide architectural layout, and purposeful micro-interactions.

---

## 2. Official Brand Logo System

The official brand identity centers on the dimensional origami ribbon `V` symbol and precision typography:

### Logo Variants & Component API (`src/components/ui/brand-logo.tsx`)
- **`header`:** Horizontal lockup with ribbon V mark + bold `VOID` (white) + `TECH` (electric purple `#A855F7`) + tracked `SOLUTION` submark.
- **`footer`:** Stacked lockup with ribbon mark + wordmark + tagline (`Build. Launch. Grow Online.`).
- **`symbol`:** Standalone high-contrast transparent ribbon mark with ambient violet drop-shadow (`drop-shadow-[0_0_12px_rgba(168,85,247,0.45)]`).
- **`emblem`:** Full circular brand medallion with luminous border ring and dimensional ribbons.

### Generated Production Brand Assets
| Asset Path | Resolution | Format | Purpose |
|---|---|---|---|
| `public/brand/voidtech-symbol.webp` | 445x355 | WebP | Transparent primary mark |
| `public/brand/voidtech-emblem.webp` | 1254x1254 | WebP | Circular brand medallion |
| `public/brand/voidtech-icon-512.webp`| 512x512 | WebP | PWA & high-res app icon |
| `public/apple-icon.png` | 180x180 | PNG | iOS home screen bookmark |
| `public/favicon-32x32.png` | 32x32 | PNG | Browser tab icon |
| `public/favicon-16x16.png` | 16x16 | PNG | Browser tab icon (small) |
| `public/favicon.ico` | Multi-size | ICO | Fallback root favicon |
| `public/og-image.jpg` | 1200x630 | JPEG | Open Graph social sharing card |

---

## 3. Semantic Color Architecture & Tokens

All colors are defined as semantic CSS custom properties in `src/app/globals.css` and mapped to Tailwind CSS utilities in `tailwind.config.ts`.

### Void Neutral Foundations (Backgrounds & Surfaces)
| Token Name | CSS Custom Property | Value / Hex | Purpose |
|---|---|---|---|
| `bg-void-black` | `--bg-primary` | `#050507` | Primary root canvas; abyss obsidian |
| `bg-void-dark` | `--bg-secondary` | `#0A0912` | Headers, footers, secondary sections |
| `bg-void-charcoal` | `--bg-surface` | `#100D1B` | Standard card surfaces, input containers |
| `bg-void-surface` | `--bg-surface-elevated`| `#171126` | Elevated modal dialogs, flyouts |
| `border-void-border`| `--border-primary` | `rgba(168, 85, 247, 0.20)` | Structural borders, card outlines |
| `border-void-subtle`| `--border-subtle` | `rgba(168, 85, 247, 0.12)` | Inner divider rules |
| `text-void-white` | `--text-primary` | `#F8F7FC` | High-emphasis display titles, headers |
| `text-void-light` | `--text-secondary` | `#B8B3C7` | Primary readable body text |
| `text-void-muted` | `--text-muted` | `#858096` | Secondary labels, descriptions, timestamps |

### Electric Luminescent Accents
| Token Name | CSS Custom Property | Value / Hex | Purpose |
|---|---|---|---|
| `text-electric-purple` | `--accent-purple` | `#8B5CF6` | Primary brand accent; CTA buttons |
| `bg-electric-violet` | `--accent-purple-hover` | `#7C3AED` | Gradient roots, button hover states |
| `text-electric-neon` | `--accent-neon` | `#A855F7` | Active status indicators, glowing pings |
| `text-electric-highlight`| `--accent-highlight` | `#C084FC` | Highlights, badges, hover accents |
| `shadow-glow-md` | `--accent-purple-glow` | `rgba(168, 85, 247, 0.35)` | Controlled luminescent drop shadows |

---

## 4. Multi-Page 3D Visual Asset Architecture

Every public route features its own dedicated, bespoke 3D technology visual rendered in the brand's purple/violet palette:

| Route | Page | Visual Asset Path | Theme / Composition |
|---|---|---|---|
| `/` | Homepage Hero | `/hero/voidtech-hero-violet.webp` | Cinematic 3D digital infrastructure with luminous central glass architecture and violet data nodes |
| `/about` | About Agency | `/hero/voidtech-about-3d.webp` | 3D wireframe globe with orbital rings, holographic telemetry, and interconnected global engineering nodes |
| `/services` | Capabilities | `/hero/voidtech-services-3d.webp` | Modular floating 3D microservice cubes with violet fiber-optic data buses and glowing API interfaces |
| `/pricing` | Investment | `/hero/voidtech-pricing-3d.webp` | Holographic 3D calculation prism with floating concentric tier rings and transparent pricing metrics |
| `/portfolio`| Concept Lab | `/hero/voidtech-portfolio-3d.webp` | Futuristic gallery display showroom with curved glass holographic product panels and violet accents |
| `/contact` | Scoping Desk | `/hero/voidtech-contact-3d.webp` | Cybernetic communication beacon spire broadcasting harmonic violet holographic signal waves |

---

## 5. Spacing & Responsive Grid Conventions

### Container Sizes
- `Container size="default"`: `max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12` (Standard wide desktop canvas)
- `Container size="narrow"`: `max-w-4xl mx-auto px-4 sm:px-6 lg:px-8` (Articles, single-column forms)
- `Container size="wide"`: `max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12` (Expansive showcases)

### Responsive Breakpoints
- **Mobile (320px – 767px):** Single-column stacked layouts, minimum touch targets ≥48px, horizontal overflow zero.
- **Tablet (768px – 1023px, `md:`):** 2-column card grids, responsive header collapse.
- **Desktop (1024px – 1439px, `lg:`):** 3-column service catalog, horizontal navigation.
- **Ultra-Wide Desktop (1440px+, `xl:`):** Expansive 1440px container, 4-column metrics, no awkward side gutters.

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
