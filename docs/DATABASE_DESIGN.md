# DATABASE_DESIGN.md — PostgreSQL Entity-Relationship Specification & Data Layer

> **Implementation Status:** `SCHEMAS, REPOSITORIES & SEEDING ENGINE IMPLEMENTED`
>
> ⚠️ **Database Migration Readiness:** The database schema has been verified with Prisma (`npx prisma validate`), Prisma Client generated (`npx prisma generate`), five domain repository abstractions built in `src/server/repositories/`, and an automated seed script authored in `prisma/seed.ts`. When connecting a live hosted PostgreSQL instance (e.g. Neon, Supabase, AWS RDS), execute `npx prisma migrate dev --name init` or `npx prisma db push` followed by `npm run db:seed`.

---

## 1. Entity-Relationship Model (ERD)

```mermaid
erDiagram
    ENQUIRY {
        string id PK
        string name
        string email
        string phone
        string companyName
        enum serviceCategory
        string budgetRange
        string timeline
        text message
        enum status
        text internalNotes
        string ipHash
        string userAgent
        datetime createdAt
        datetime updatedAt
    }

    SERVICE {
        string id PK
        string slug UK
        string title
        string shortDesc
        text fullDesc
        string icon
        enum category
        string[] deliverables
        string[] technologies
        int startingPriceUsd
        boolean isFeatured
        boolean isActive
        int orderIndex
        datetime createdAt
        datetime updatedAt
    }

    PORTFOLIO_PROJECT {
        string id PK
        string slug UK
        string title
        string clientName
        string industry
        string summary
        text challenge
        text solution
        text results
        string[] techStack
        json metrics
        string heroImage
        string liveUrl
        string githubUrl
        boolean isFeatured
        int orderIndex
        datetime createdAt
        datetime updatedAt
    }

    ADMIN_USER {
        string id PK
        string email UK
        string passwordHash
        string name
        enum role
        boolean isActive
        datetime lastLoginAt
        datetime createdAt
        datetime updatedAt
    }

    SYSTEM_SETTING {
        string id PK
        string key UK
        text value
        string description
        datetime updatedAt
    }
```

---

## 2. Repository Pattern Abstraction Layer

All database queries are encapsulated in strongly-typed repository modules in `src/server/repositories/`:

| Repository | Path | Core Functions | Resilient Fallback |
|---|---|---|---|
| **`EnquiriesRepo`** | `src/server/repositories/enquiries.repo.ts` | `createEnquiry`, `getEnquiries`, `getEnquiryById`, `updateEnquiryStatus`, `appendEnquiryNote`, `deleteEnquiry`, `getEnquiryStats` | Database transaction |
| **`ServicesRepo`** | `src/server/repositories/services.repo.ts` | `getAllServices`, `getActiveServices`, `getServiceBySlug`, `getFeaturedServices`, `createService`, `updateService`, `deleteService` | Falls back to static `servicesRegistry` if DB is offline |
| **`PortfolioRepo`** | `src/server/repositories/portfolio.repo.ts` | `getAllProjects`, `getFeaturedProjects`, `getProjectBySlug`, `getProjectsByIndustry`, `createProject`, `updateProject`, `deleteProject` | Falls back to static case studies if DB is offline |
| **`UsersRepo`** | `src/server/repositories/users.repo.ts` | `getAdminByEmail`, `getAdminById`, `createAdminUser`, `updateLastLogin`, `getAllAdmins` | Strict DB operations with email normalization |
| **`SettingsRepo`** | `src/server/repositories/settings.repo.ts` | `getSetting<T>`, `setSetting`, `getAllSettings` | Default value fallback if key is unseeded |

---

## 3. Database Seeding Engine (`prisma/seed.ts`)

The database seed engine programmatically populates:
1. **All 18 Registered Business Services:** Populates titles, short & full descriptions, categories, deliverables, technologies, and display order from `src/config/site.ts`.
2. **Default System Settings:** Populates agency brand name, tagline, commercial contact inbox, automated lead reply flags, and maintenance mode toggle.
3. **Initial Case Studies:** Populates verified baseline portfolio projects (`algorithmic-liquidity-engine` and `autonomous-ai-ops-agent`) with quantified metrics.

### Seeding Command
```bash
npm run db:seed
# Or: npx prisma db seed
```

---

## 4. Migration & Deployment Playbook

When provisioning a new PostgreSQL database instance:

```bash
# 1. Ensure .env contains valid DATABASE_URL and DIRECT_URL
DATABASE_URL="postgresql://user:password@host:port/db?schema=public&pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:port/db?schema=public"

# 2. Run initial Prisma migration
npx prisma migrate dev --name init_voidtech_schema

# 3. Seed initial 18 services and configuration
npm run db:seed

# 4. For production deployments on Vercel
npx prisma migrate deploy
```
