# ARCHITECTURE.md — System Architecture & Technology Blueprint

## 1. System Overview
**VOIDTECH SOLUTION** is built as a unified full-stack web platform on the **Next.js App Router** paradigm, combining React Server Components (RSC) for zero-client-bundle rendering, Next.js Route Handlers for RESTful API services, Server Actions for transactional mutations, a **Repository Pattern Abstraction Layer**, a dedicated **Nodemailer SMTP Transactional Email Subsystem**, a **Cryptographic OTP Verification Engine**, and **Prisma ORM** interacting with a hosted **PostgreSQL** database.

```mermaid
flowchart TD
    Client["Client Browser / Device"]
    CDN["Edge CDN (Vercel Edge Network)"]
    
    subgraph NextServer["Next.js App Router Runtime"]
        Middleware["Edge Middleware (Auth & Rate Limit)"]
        RSC["React Server Components (HTML Streaming)"]
        Routes["API Route Handlers (/api/*)"]
        Actions["Server Actions (Mutation Layer)"]
        Validation["Zod Validation Layer"]
        EmailService["Nodemailer Email Service (src/server/email)"]
        OtpService["Cryptographic OTP Engine (src/server/security)"]
    end

    subgraph DataLayer["Persistence & Repository Layer"]
        Repo["Domain Repositories (src/server/repositories)"]
        PrismaClient["Prisma ORM Client Singleton (src/lib/prisma.ts)"]
        Postgres["PostgreSQL Database (Neon / Supabase / RDS)"]
        StaticFallback["Static Fallback (src/config/site.ts, src/config/pricing.ts)"]
    end

    subgraph External["External Infrastructure"]
        SmtpServer["SMTP Server (Port 587/465 TLS)"]
    end

    Client -->|HTTPS / WSS| CDN
    CDN --> NextServer
    NextServer --> Middleware
    Middleware --> RSC
    Middleware --> Routes
    Middleware --> Actions
    Routes --> Validation
    Actions --> Validation
    Validation --> OtpService
    Validation --> Repo
    Actions --> EmailService
    Routes --> EmailService
    EmailService --> SmtpServer
    Repo --> PrismaClient
    Repo -.->|Offline / Build-Time Fallback| StaticFallback
    PrismaClient --> Postgres
```

---

## 2. Directory Architecture & Layered Boundaries

```
src/
├── app/                  # Next.js App Router (pages, layouts, route handlers)
│   ├── api/health/       # System health check endpoint (/api/health)
│   ├── design-system/    # Internal Design System Preview (/design-system)
│   ├── globals.css       # Semantic tokens, CSS variables, reduced-motion rules
│   ├── layout.tsx        # Root HTML shell, Google fonts (Inter + JetBrains Mono)
│   └── page.tsx          # Homepage foundation entrypoint
├── components/           # Modular UI component library
│   ├── feedback/         # LoadingState, EmptyState, ErrorState
│   ├── layout/           # Container, Section, SectionHeading, Header, Footer
│   ├── sections/         # Feature blocks (scaffolded for future phases)
│   └── ui/               # Atomic primitives (Button, Card, Form, Badge)
├── config/               # Static configuration & catalogs
│   ├── env.ts            # Centralized Zod Environment Schema Validation
│   ├── pricing.ts        # Approved INR Pricing Packages (10 Tiers)
│   └── site.ts           # siteConfig, servicesRegistry, navigation
├── hooks/                # Custom client-side React hooks
├── lib/                  # Shared utilities (cn, formatters, prisma singleton)
│   ├── prisma.ts         # Resilient PrismaClient singleton & health check
│   └── utils.ts
├── server/               # Server-only business logic & subsystems
│   ├── email/            # Reusable Nodemailer + SMTP Transactional Service
│   │   ├── config.ts     # Zod-validated SMTP environment variables
│   │   ├── transporter.ts # Singleton connection pool & verifySmtpConnection
│   │   ├── email.service.ts # sendEmail with bounded retries & delivery tracking
│   │   └── templates/    # 6 Dark-styled HTML & plain-text email templates
│   ├── repositories/     # Type-safe domain repositories
│   │   ├── audit.repo.ts
│   │   ├── delivery.repo.ts
│   │   ├── enquiries.repo.ts
│   │   ├── faq.repo.ts
│   │   ├── portfolio.repo.ts
│   │   ├── pricing.repo.ts
│   │   ├── services.repo.ts
│   │   ├── settings.repo.ts
│   │   ├── users.repo.ts
│   │   └── index.ts      # Barrel export
│   └── security/         # Security operations & authentication helpers
│       ├── otp.service.ts # Cryptographic 6-digit OTP engine & rate limiting
│       ├── password.ts   # Cryptographic scrypt password hashing & verification
│       └── index.ts
├── types/                # Domain types, Prisma re-exports, API envelopes
└── validations/          # Zod validation schemas (enquiry, auth, content)

prisma/
├── schema.prisma         # Declarative PostgreSQL schema definitions (10 models)
└── seed.ts               # Programmatic seeder (18 services, 10 packages, FAQs, settings)

docs/                     # Architectural, system & operational documentation
tests/                    # Vitest unit/component tests & Playwright E2E suites
```

---

## 3. Data Access & Repository Layer

- **Decoupling from Direct ORM Calls:** Route Handlers and Server Actions never invoke Prisma directly. All access flows through domain repositories.
- **Offline & Build-Time Resilience:** Next.js static page generation runs deterministically without live PostgreSQL. Read queries catch connection errors and supply structured fallbacks.
- **Strict Write Error Guarantees:** Database write failures strictly throw observable, descriptive errors without leaking connection credentials.
- **Auditing & Delivery Logs:** Every transactional email and critical administrative action is recorded via `EmailDelivery` and `AuditLog` models.


---

## 7. Phase 4: Public Marketing Homepage Architecture

### Component Hierarchy & Data Flow

```mermaid
graph TD
    A[Next.js App Router Page: src/app/page.tsx] -->|Parallel Data Fetch| B[Repositories Layer]
    B -->|getServices| C[ServicesRepo]
    B -->|getProjects| D[PortfolioRepo]
    B -->|getPackages| E[PricingRepo]
    B -->|getFaqs| F[FaqRepo]
    
    C -->|Fallback Resilience| G[Static Registry Fallback]
    D -->|Fallback Resilience| H[Concept Prototypes Fallback]
    E -->|Fallback Resilience| I[Approved INR Tiers Fallback]
    F -->|Fallback Resilience| J[Approved FAQs Fallback]

    A --> S1[Section 1: Hero & Strategic CTAs]
    A --> S2[Section 2: Brand Introduction & Values]
    A --> S3[Section 3: Services Showcase & Interactive Filter]
    A --> S4[Section 4: Why Choose VoidTech]
    A --> S5[Section 5: 7-Stage Development Process]
    A --> S6[Section 6: Featured Projects / Concept Lab]
    A --> S7[Section 7: Transparent INR Pricing Preview]
    A --> S8[Section 8: Accessible FAQ Accordion]
    A --> S9[Section 9: Closing Conversion Banner]
```

### Key Public Architecture Invariants:
1. **Server Component Pre-rendering:** `src/app/page.tsx` runs as an async Server Component, fetching data on the server with zero client database exposure.
2. **Safe Fallback Resilience:** When database tables do not exist or are unpopulated, repositories catch query errors and immediately return static baseline configurations without crashing or throwing 500 errors.
3. **Interactive Client Boundary Isolation:** Only interactive elements (`ServicesFilter`, `FaqAccordion`, `QuickInquiry`) are marked with `"use client"`. They receive plain JSON props from the server component.
4. **Authenticity & Concept Isolation:** Internal prototypes are strictly tagged with `CONCEPT` badges to avoid misleading claims.

---

## 8. Phase 5: About, Portfolio & Dynamic Case Study Architecture

### Page Structure & Routing
- **`/about` (Server Component):** 7 structured sections: Hero, Who We Are narrative, Mission & Vision, 6 Core Values, 6-Stage Engineering Approach, 7-Domain Tech Stack Matrix, and Collaboration CTA.
- **`/portfolio` (Server Component + Client Boundary):** Server component fetching all projects via `PortfolioRepo.getAllProjects()`, passing data into `PortfolioFilter` client component for interactive client-side category filtering, full-text search, and empty state rendering.
- **`/portfolio/[slug]` (Dynamic Route):** Next.js 15 async route with `generateStaticParams()` and `generateMetadata()`, resolving `await params`, handling 404s via `notFound()`, and rendering 11 structured case study sections.

### Architecture Topology

```mermaid
graph TD
    P1["/about Page"] --> A1["Hero Section"]
    P1 --> A2["Who We Are Narrative"]
    P1 --> A3["Mission & Vision Cards"]
    P1 --> A4["6 Core Values Grid"]
    P1 --> A5["6-Stage Approach"]
    P1 --> A6["Tech Stack Matrix (7 Domains)"]
    P1 --> A7["Collaboration CTA"]

    P2["/portfolio Page"] --> Repo["PortfolioRepo.getAllProjects()"]
    Repo --> PF["PortfolioFilter (Client Boundary)"]
    PF --> C1["Category Pills Filter"]
    PF --> C2["Live Keyword Search"]
    PF --> C3["Project Cards Grid (CONCEPT Badges & Metrics)"]
    PF --> C4["Empty State"]

    P3["/portfolio/[slug] Dynamic Route"] --> Static["generateStaticParams()"]
    P3 --> Meta["generateMetadata()"]
    P3 --> S1["Breadcrumbs"]
    P3 --> S2["Hero Header & Quick Metadata"]
    P3 --> S3["Concept Transparency Notice"]
    P3 --> S4["Problem & Solution Cards"]
    P3 --> S5["Architecture Blueprint Schematic"]
    P3 --> S6["Simulated Benchmark Metrics"]
    P3 --> S7["Tech Stack & Code Access Brief"]
    P3 --> S8["Related Projects Grid"]
    P3 --> S9["Conversion CTA"]
```


---

## 9. Phase 6: Interactive Pricing Calculator, Contact System & Enquiry Pipeline Architecture

### System Topology

```mermaid
flowchart TD
    Client["Client Browser"]
    
    subgraph PricingArchitecture["/pricing Route"]
        P_Hero["Hero: Predictable Investment"]
        P_Table["PricingTable (10 Approved INR Tiers & Category Filters)"]
        P_Calc["PricingCalculator (Interactive Estimation Engine)"]
        P_Guarantees["Commercial Protections (Full IP, 50/50 Payment Terms, 30-Day Bug-Fix Warranty)"]
        P_FAQ["FaqAccordion (Pricing Clarifications)"]
    end

    subgraph ContactArchitecture["/contact Route"]
        C_Hero["Hero: Let's Build Something Exceptional"]
        C_Standards["Availability Standards (Remote-First, Scoping Review)"]
        C_Form["ContactEnquiryForm (3-Step Lead Intake)"]
        C_Alt["Direct Email Desk (voidtechsolutionsupport@gmail.com)"]
    end

    subgraph BackendProcessing["Server-Side Intake Engine"]
        Action["submitEnquiryAction (Server Action)"]
        ApiRoute["POST /api/enquiries (REST Route)"]
        Honeypot["Honeypot Bot Trap (website_url)"]
        RateLimiter["Token Bucket Rate Limiter (5 per 10m)"]
        Fingerprint["Duplicate Cooldown Guard (60s SHA-256)"]
        ZodParser["Zod enquirySubmissionSchema.strict()"]
        Repo["EnquiriesRepo.createEnquiry()"]
        Mailer["dispatchEnquiryNotifications()"]
    end

    subgraph PersistenceAndEmail["Storage & Notification Services"]
        DB["PostgreSQL (Enquiry Table)"]
        CustomerEmail["Customer Confirmation Email (Nodemailer)"]
        AdminAlert["Admin Lead Notification Email (Nodemailer)"]
        DeliveryLog["EmailDelivery Table (Audit Tracking)"]
    end

    Client -->|View Tiers & Calculate| PricingArchitecture
    P_Calc -->|URL Query Params /contact?category=...&package=...| ContactArchitecture
    P_Table -->|Select Package /contact?package=...| ContactArchitecture
    Client -->|Fill 3-Step Intake| C_Form
    C_Form -->|Execute Mutation| Action
    Client -->|External Form / API Client| ApiRoute
    ApiRoute --> Action
    Action --> Honeypot
    Honeypot -->|Clean| RateLimiter
    RateLimiter -->|Allowed| Fingerprint
    Fingerprint -->|Unique| ZodParser
    ZodParser -->|Valid| Repo
    Repo --> DB
    Repo -->|Success| Mailer
    Mailer --> CustomerEmail
    Mailer --> AdminAlert
    Mailer --> DeliveryLog
```

### Architectural Principles
1. **Dynamic Parameter Passing:** The calculator packages selected attributes (`category`, `package`, `addons`, `timeline`) into clean URL query params, seamlessly transferring context to `/contact` without client-side global state overhead.
2. **Resilient Data Preservation:** Form submissions catch server errors and preserve 100% of the prospect's entered data, displaying an accessible retry button and direct email alternative.
3. **Multi-Layer Bot & Spam Protection:**
   - Honeypot trap: Empty field check rejects bots before schema validation.
   - Token bucket rate limiter: Enforces a cap of 5 submissions per 10 minutes per IP/email.
   - SHA-256 fingerprinting: Rejects identical submissions within a 60-second cooldown window.
4. **Decoupled Notification Pipeline:** Confirmation and admin alert emails are dispatched asynchronously; email transit interruptions never abort database persistence or falsify client failure.

---

## 10. Phase 7: Administrative Architecture — Single SUPER_ADMIN Governance & Shared Login Pipeline

### System Topology & Unified Login Flow

```mermaid
flowchart TD
    AdminUser["Administrator (SUPER_ADMIN / ADMIN / EDITOR)"]
    
    subgraph ClientLayer["Client Layer (Browser)"]
        LoginPage["Unified Login Portal (/admin/login)"]
        AdminDashboard["Dynamic Admin Dashboard (/admin)"]
    end

    subgraph EdgeLayer["Edge Infrastructure (src/middleware.ts)"]
        EdgeGuard["Edge Route Guard (/admin/*)"]
        HmacVerify["Web Crypto HMAC-SHA256 Cookie Verification"]
    end

    subgraph ServerLayer["Server-Side Authentication & Session Layer"]
        LoginAction["loginAction (Server Action)"]
        RateLimit["Process Rate Limiter (5 per 15m)"]
        ScryptVerify["Constant-Time scrypt Verification (timingSafeEqual)"]
        SessionEngine["Session Engine (src/server/security/session.ts)"]
        RbacGuard["Authoritative RBAC Guard (requirePermission)"]
        AuditService["Audit Trail Logger (AuditLog Repo)"]
    end

    subgraph DataLayer["Persistence Layer (PostgreSQL / Neon)"]
        AdminUsersTable["admin_users (id, email, passwordHash, role, isActive)"]
        AdminSessionsTable["admin_sessions (sessionToken, userId, expiresAt, lastActiveAt)"]
        AuditLogsTable["audit_logs (actorId, action, entityId, details)"]
    end

    subgraph ProvisioningCLI["Controlled Bootstrap Layer"]
        CliScript["scripts/create-admin.ts (Interactive CLI Bootstrap)"]
    end

    ProvisioningCLI -->|Bootstrap Initial SUPER_ADMIN| AdminUsersTable
    ProvisioningCLI -->|Record Bootstrap Audit| AuditLogsTable

    AdminUser -->|Navigate to Portal| LoginPage
    LoginPage -->|POST Credentials| LoginAction
    LoginAction --> RateLimit
    RateLimit --> ScryptVerify
    ScryptVerify --> AdminUsersTable
    LoginAction -->|Success| SessionEngine
    SessionEngine -->|INSERT Token Hash| AdminSessionsTable
    LoginAction -->|Set-Cookie vts_session| LoginPage
    LoginPage -->|Redirect /admin| EdgeGuard
    EdgeGuard --> HmacVerify
    HmacVerify -->|Valid Signature| AdminDashboard
    AdminDashboard --> SessionEngine
    SessionEngine -->|SELECT Session + User| AdminSessionsTable
    AdminDashboard -->|Render Role-Tailored Views| AdminUser

    AdminDashboard -->|Execute Administrative Mutation| RbacGuard
    RbacGuard -->|Authoritative DB Role Check| AdminUsersTable
    RbacGuard -->|Allowed| AuditService
    AuditService --> AuditLogsTable
```

### Architectural Principles
1. **Single Unified Authentication Portal:**
   - Exactly ONE authentication endpoint exists: `/admin/login`.
   - `SUPER_ADMIN`, `ADMIN`, and `EDITOR` authenticate through this single unified portal using identical credentials processing.
   - Zero separate login routes or role-specific URL pathways exist.
2. **Authoritative Server-Side Governance:**
   - Client-side navigation adaptions are strictly ergonomic. Security is enforced authoritatively on the server inside Server Components, Server Actions, and Route Handlers via `requirePermission(user, permission)` and `getCurrentAdmin()`.
3. **Edge Route Protection & Rejection Filter (`src/middleware.ts`):**
   - Edge-compatible Web Crypto HMAC-SHA256 signature verification in isolated module (`src/server/security/cookie.ts`) with zero database dependencies.
   - Unauthenticated UI requests are redirected to `/admin/login?callbackUrl=...` with strict open-redirect sanitization (`sanitizeCallbackUrl`).
   - Unauthenticated API calls to `/api/admin/*` receive HTTP 401 Unauthorized (`UNAUTHORIZED_ADMIN_SESSION`).
   - Authenticated administrators visiting `/admin/login` are redirected away to destination or `/admin`.
4. **Single SUPER_ADMIN Account Governance & Exactly One Invariant:**
   - The platform enforces strictly **EXACTLY ONE SUPER_ADMIN** account across the system lifecycle.
   - Only `SUPER_ADMIN` can provision `ADMIN` and `EDITOR` accounts, modify roles, activate/deactivate accounts, revoke active sessions, and view sensitive audit logs.
   - Concurrency safety is guaranteed using PostgreSQL advisory transaction locks (`SELECT pg_advisory_xact_lock(hashtext('super_admin_lifecycle_lock'))`).
   - Non-super admins have zero administrative user management capabilities.
5. **Sole Active SUPER_ADMIN Invariant Protection:**
   - The platform strictly rejects any action that would deactivate, delete, or demote the master `SUPER_ADMIN`, eliminating total administrative lockout risks.
6. **Controlled Initial Bootstrap (`scripts/create-admin.ts`):**
   - Initial `SUPER_ADMIN` account is provisioned exclusively through an interactive CLI script (`scripts/create-admin.ts`).
   - Run via `npm run admin:create` with hidden password inputs and database pre-flight checks.
   - Zero database seed provisioning; zero public user registration; zero hardcoded passwords.
7. **Centralized Append-Only Audit Logging Engine (`src/server/security/audit.ts`):**
   - Tamper-resistant, immutable audit trail capturing lifecycle events (`AUTH_LOGIN_SUCCESS`, `AUTH_LOGIN_FAILED`, `AUTH_LOGOUT`, `ADMIN_BOOTSTRAP_SUCCESS`, `ADMIN_CREATED`, `ADMIN_ROLE_UPDATED`, `ADMIN_STATUS_UPDATED`, `ADMIN_DELETED`).
   - Automated credential redaction removes passwords, hashes, raw tokens, and connection strings from metadata payloads.
   - Preserved upon user deletion through decoupled scalar foreign keys.
   - Transactional participation ensures state mutations and audit records commit or roll back together atomically.
