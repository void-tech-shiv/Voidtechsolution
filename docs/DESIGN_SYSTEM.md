# DESIGN_SYSTEM.md — VOIDTECH SOLUTION Brand & UI Design System

## 1. Brand Identity & Philosophy
**VOIDTECH SOLUTION** embodies technical precision, high-velocity engineering, and futuristic elegance. It represents high-end software craftsmanship for serious founders and enterprise leaders.

- **Brand Name:** VOIDTECH SOLUTION
- **Tagline:** Build. Launch. Grow Online.
- **Design Philosophy:** Dark-mode first, content-prioritized, subtle glassmorphism, controlled neon luminescence, clean typography, and restrained micro-animations.

---

## 2. Color Palette & Tokens

### Core Void Neutrals (Backgrounds & Surfaces)
| Token Name | Hex Code | Purpose |
|---|---|---|
| `void-black` | `#050507` | Root background; deep abyss black |
| `void-dark` | `#0a0a0f` | Header, footer, secondary section backgrounds |
| `void-charcoal`| `#121218` | Elevated card interiors, sidebars |
| `void-surface` | `#181822` | Form input surfaces, badges, hover fills |
| `void-border` | `#262636` | Subtle structural dividers and component borders |
| `void-muted` | `#88889c` | Secondary copy, metadata, timestamps |
| `void-light` | `#e2e2ec` | Primary body text |
| `void-white` | `#f8f8fc` | High-contrast headers, bold emphasis |

### Electric Accent Tones (Glow & Highlights)
| Token Name | Hex Code | Purpose |
|---|---|---|
| `electric-purple` | `#8b5cf6` | Primary brand accent; CTA buttons, active links |
| `electric-violet` | `#7c3aed` | Gradient roots, deep glowing edges |
| `electric-neon` | `#a855f7` | Active glow states, particle accents |
| `electric-cyan` | `#06b6d4` | Secondary tech accent; API & data badges |
| `electric-glow` | `rgba(139, 92, 246, 0.4)` | Radial glow shadows and ambient light |

---

## 3. Typography Scale & Hierarchy

- **Primary Sans Font:** System Modern Sans (Inter / Geist / SF Pro Display)
- **Code & Tech Font:** JetBrains Mono / SF Mono / Consolas

| Hierarchy | Classes | Line Height | Usage |
|---|---|---|---|
| Display / H1 | `text-4xl sm:text-6xl font-extrabold tracking-tight` | `leading-none` | Hero main headlines |
| Section H2 | `text-2xl sm:text-4xl font-bold tracking-tight` | `leading-tight` | Section headings |
| Subsection H3 | `text-lg sm:text-xl font-semibold` | `leading-snug` | Card titles, feature headers |
| Body Regular | `text-sm sm:text-base font-normal leading-relaxed` | `1.65` | Paragraphs, documentation |
| Micro / Meta | `text-xs sm:text-[11px] font-mono uppercase tracking-wider` | `1.4` | Category pills, tech badges |

---

## 4. Glassmorphism & Depth Layers

VOIDTECH uses controlled glassmorphism without blurring artifacts or legibility penalties:
- **Surface Layer:** `bg-void-card-gradient backdrop-blur-md`
- **Border Treatment:** `border border-void-border/80 hover:border-electric-purple/50`
- **Inner Reflection:** `box-shadow: inset 0 1px 1px 0 rgba(255, 255, 255, 0.08)`
- **Ambient Glows:** `shadow-glow-sm`, `shadow-glow-md`, `shadow-glow-lg`

```css
/* Glass Panel Class */
.glass-panel {
  background: linear-gradient(180deg, rgba(24, 24, 34, 0.7) 0%, rgba(10, 10, 15, 0.85) 100%);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(139, 92, 246, 0.18);
}
```

---

## 5. UI Component Primitives

### Buttons (`Button`)
- **`primary`:** Violet-to-purple gradient with subtle purple glow.
- **`secondary`:** Dark surface with border hover glow.
- **`outline`:** Transparent background with electric purple border.
- **`glow`:** Dark charcoal container with glowing electric border.
- **States:** `hover:brightness-110`, `active:scale-[0.98]`, `focus-visible:ring-2`.

### Cards (`Card`)
- Clean padding (`p-6`), rounded corners (`rounded-xl`), and responsive grid arrangements.
- Subtle transition on hover (`transition-all duration-300`).

---

## 6. Iconography & Motion Standards
- **Icons:** Standardized on `lucide-react` with 1.75px stroke width.
- **Motion:** Framer Motion / CSS transitions strictly restrained (200ms–350ms duration, `ease-out`). Avoid disorienting bouncing or high-frequency loops.
