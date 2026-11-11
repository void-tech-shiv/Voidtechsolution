# Phase 5: About Page, Portfolio & Detailed Project Case Studies — Discussion

## Context & Objectives

Phase 4 successfully delivered the complete 9-section responsive marketing homepage, verified section anchors, accessible FAQ accordion, dynamic service catalog, and commercial claim qualification.

Phase 5 is officially authorized to implement the core storytelling and proof-of-work pages:
1. **Dedicated About Page (`/about`)**: Complete agency narrative, engineering philosophy, mission, vision, 6 core values, 6-stage engineering approach, categorized technology matrix, and closing CTA.
2. **Dedicated Portfolio Listing Page (`/portfolio`)**: Hero banner, live client-side category filtering, full-text search, project cards with explicit classification badges (`CONCEPT`, `CLIENT PROJECT`, `OPEN SOURCE`), simulated benchmark metrics, and responsive grid.
3. **Dynamic Project Case Study Route (`/portfolio/[slug]`)**: In-depth case study layouts covering Problem/Opportunity (explicitly hypothetical for concept prototypes), Solution Architecture, Key Features, Technical Highlights, Architecture Diagrams/Visual Gallery, Simulated Benchmarks, Related Projects, and Conversion CTA.

## Architectural & Governance Principles

1. **Radical Authenticity & Anti-Fabrication**:
   - Zero fictitious client names, fake revenue numbers, invented customer logos, or fabricated testimonials.
   - Internal R&D projects and architecture prototypes are explicitly tagged as `CONCEPT` or `INTERNAL PROTOTYPE`.
   - Performance metrics on concept prototypes are strictly tagged as `SIMULATED BENCHMARK` (e.g. synthetic test harnesses, benchmark evaluation scenarios).
   - About page contains zero fabricated founding years, fictitious office addresses, or fake team counts.

2. **Next.js 15 App Router Dynamics**:
   - Asynchronous `params` in Next.js 15: `const { slug } = await params;` in dynamic routes and `generateMetadata`.
   - Static generation via `generateStaticParams()` for fast SSG rendering of known project slugs.
   - 404 handling via `notFound()` for unknown slugs.
   - Metadata generation for SEO: dynamic titles, OpenGraph meta, descriptions, canonical URLs.

3. **Data Layer Resiliency & Fallback**:
   - Safe database repository queries with try/catch returning rich fallback projects when the remote database is offline or unseeded.
   - Rich prototype projects in `PortfolioRepo`:
     1. `algorithmic-liquidity-engine` (FINTECH / Distributed Systems)
     2. `autonomous-ai-ops-agent` (DEV_OPS_AI / Multi-Agent LLMs)
     3. `enterprise-data-mesh-gateway` (DATA_ENGINEERING / Cloud Architecture)
     4. `pulse-iot-telemetry-pipeline` (IOT_EMBEDDED / Streaming Data)
   - Zero database mutations, no `prisma db push`, no seed commands.

4. **Component Design & Reusability**:
   - Reusable badges (`Badge` variant: `outline`, `neon`, etc.).
   - Interactive category pills + search bar on `/portfolio`.
   - Rich typography with Inter + JetBrains Mono for code/metrics.
   - Accessible breadcrumb navigation (`Home > Portfolio > [Project Name]`).
   - Deep obsidian & charcoal aesthetics with controlled neon violet accents.

5. **Navigation Alignment**:
   - Update `mainNav` in `src/config/site.ts`:
     - Home: `/`
     - About: `/about`
     - Services: `/#services`
     - Pricing: `/#pricing`
     - Portfolio: `/portfolio`
     - Contact: `/#contact`
   - Preserve homepage section anchors for Services, Pricing, and Contact (until dedicated phases).
