# TESTING.md — Quality Assurance & Testing Strategy

## 1. Testing Philosophy
VOIDTECH SOLUTION adheres to the **Empirical Validation Principle**:
> *No "trust me, it works." Every change requires captured proof from automated test runners, compilers, or linters.*

The testing strategy is organized into a three-tiered pyramid:
1. **Unit & Validation Tests (Vitest):** Millisecond-speed testing of utility functions, Zod schema constraints, and business logic.
2. **Component & Integration Tests (React Testing Library + Vitest):** Verification of component rendering, user interactions, accessible role queries, and event handlers.
3. **End-to-End Tests (Playwright):** Browser-driven journey verification covering lead submission, navigation flows, and admin portal security (Phase 11).

---

## 2. Test Execution Commands

```bash
# Run unit and component test suite
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

## 3. Test Suites & Coverage (Phase 2 Status)

### Test Suites:
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

**Total Active Tests:** 32 passing tests (0 failures).

---

## 4. Component Testing Rules
- Query elements using user-facing roles and labels (`getByRole`, `getByLabelText`) rather than implementation details or CSS selectors.
- Assert accessibility attributes (`aria-invalid`, `aria-describedby`, `aria-expanded`, keyboard focus).
- Test interactive states (`isLoading`, `disabled`, `error`).
- Maintain zero TypeScript errors across test files.
