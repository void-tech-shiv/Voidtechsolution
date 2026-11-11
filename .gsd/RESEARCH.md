# Technical Research — VOIDTECH SOLUTION

## Research Topic: Next.js App Router, React 19, Tailwind CSS & Dependencies Compatibility

### 1. Framework & Core Dependencies
- **Next.js:** Version `^15.1.0` (or latest stable 15.x / 14.x). Next.js 15 delivers App Router improvements, enhanced caching semantics (`fetch` requests un-cached by default unless specified), and async request APIs (`cookies()`, `headers()`).
- **React & React DOM:** React 19 is supported by Next.js 15. For broad ecosystem compatibility with Framer Motion and component libraries, `motion` (the rebranded framer-motion library) or `framer-motion@^11.11.0` / `^12.0.0` works seamlessly.
- **TypeScript:** `^5.6.0` with strict mode enabled (`"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`).
- **Tailwind CSS:** Tailwind CSS `^3.4.15` (or `@tailwindcss/postcss` for Tailwind v4). Tailwind v3.4 is rock-solid and universally compatible with PostCSS and custom plugin configurations for glassmorphism and box-shadow glows.

### 2. UI & Iconography
- **Lucide React:** `^0.460.0`. Industry standard lightweight tree-shakeable icons.
- **Class Merging:** `clsx` and `tailwind-merge` with standard `cn()` utility in `src/lib/utils.ts`.

### 3. Validation & Forms
- **Zod:** `^3.23.8`. First-class TypeScript schema definition and validation.
- **React Hook Form:** `^7.53.2` with `@hookform/resolvers` for Zod integration.

### 4. Database & ORM
- **Prisma:** `^6.0.0` or `^5.22.0`. `@prisma/client` for type-safe database queries.
- **Provider:** PostgreSQL.
- **Note on Phase 1:** Prisma CLI is configured, and `prisma/schema.prisma` defines models. Physical connection strings (`DATABASE_URL`, `DIRECT_URL`) remain mock-safe in `.env.example`, and no database queries run during build time.

### 5. Testing Suite
- **Vitest:** `^2.1.0`. Native Vite/ESM test runner that executes TypeScript tests instantaneously without compilation overhead.
- **React Testing Library:** `@testing-library/react` and `@testing-library/jest-dom` with `jsdom` environment.
- **Playwright:** `@playwright/test` for browser-driven E2E automation.

### 6. Package Manager & Script Execution
- **Environment:** Windows PowerShell environment. Due to Windows PowerShell ExecutionPolicy, `npm.cmd` and `npx.cmd` must be invoked directly to prevent `PSSecurityException`.
