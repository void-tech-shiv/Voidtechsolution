# TESTING.md — Quality Assurance & Testing Strategy

## 1. Testing Philosophy
VOIDTECH SOLUTION adheres to the **Empirical Validation Principle**:
> *No "trust me, it works." Every change requires captured proof from automated test runners, compilers, or linters.*

The testing strategy is organized into a three-tiered pyramid:
1. **Unit & Validation Tests (Vitest):** Millisecond-speed testing of utility functions, Zod schema constraints, and business logic.
2. **Component & Integration Tests (React Testing Library + Vitest):** Verification of component rendering, user interactions, accessible role queries, and event handlers.
3. **Repository & Data Layer Tests (Vitest):** Verification of database repository abstraction contracts, offline fallback handling, and schema integrity.
4. **End-to-End Tests (Playwright):** Browser-driven journey verification covering lead submission, navigation flows, and admin portal security (Phase 11).

---

## 2. Test Execution Commands

```bash
# Run all unit, component & repository test suites
npm test

# Run tests in interactive watch mode
npm run test:watch

# Run tests with test coverage reporting
npm run test:coverage

# Run Playwright End-to-End browser tests (Phase 11)
npm run test:e2e

# Run TypeScript compiler strict typecheck
npm run typecheck

# Run ESLint code quality checks
npm run lint

# Run Next.js production build check
npm run build
```

---

## 3. Test Suites & Coverage (Phase 3 Status)

### Active Test Suites:
1. **`tests/unit/smoke.test.ts` (8 tests):**
   - Utility functions (`cn`, `formatCurrency`, `truncate`).
   - Project specifications and 18-service registry verification.
   - Zod enquiry form validation schema constraints.
2. **`tests/unit/design-system.test.tsx` (24 tests):**
   - **Buttons:** Renders `Button`, `PrimaryButton`, `SecondaryButton`, `OutlineButton`, `GhostButton`, `GlowButton`, loading spinners, disabled states, and click triggers.
   - **Badges:** Renders `default`, `purple`, `success`, `warning`, `error`, `outline` badges and pulse dots.
   - **Cards:** Renders `BaseCard`, `GlassCard`, `ServiceCard`, `PricingCard`, and `ProjectCard`.
   - **Forms:** Renders `FormLabel`, `Input`, `Textarea`, `Select`, `Checkbox`, and validation error alerts.
   - **Feedback:** Renders `LoadingState`, `EmptyState`, and `ErrorState` with retry buttons.
   - **Layout:** Renders `Container`, `Section`, and `SectionHeading`.
3. **`tests/unit/database.test.ts` (11 tests):**
   - **Services Repository:** Retrieves all 18 registered business services with full metadata, queries active offerings, filters featured offerings, lookups by slug, and handles non-existent slugs.
   - **Portfolio Repository:** Retrieves case studies, queries featured projects, filters by industry, and queries by slug.
   - **Settings & Resilience:** Verifies default value returns for unseeded settings and resilient offline handling without unhandled exceptions.

**Total Active Tests:** 43 passing tests across 3 test suites (0 failures).
