# TESTING.md — Quality Assurance & Testing Strategy

## 1. Testing Philosophy
VOIDTECH SOLUTION adheres to the **Empirical Validation Principle**:
> *No "trust me, it works." Every change requires captured proof from automated test runners, compilers, or linters.*

The testing strategy is organized into a three-tiered pyramid:
1. **Unit & Validation Tests (Vitest):** Millisecond-speed testing of utility functions, Zod schema constraints, and business logic.
2. **Component & Integration Tests (React Testing Library + Vitest):** Verification of component rendering, user interactions, accessible role queries, and event handlers.
3. **End-to-End Tests (Playwright):** Browser-driven journey verification covering lead submission, navigation flows, and admin portal security.

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

# Run TypeScript compiler typecheck
npm run typecheck

# Run Next.js and ESLint code quality checks
npm run lint
```

---

## 3. Test Structure & Standards

```
tests/
├── setup.ts              # Jest-DOM matchers and global test environment setup
├── unit/                 # Unit tests for pure logic
│   └── smoke.test.ts     # Core baseline smoke tests (utilities, schemas, registry)
├── components/           # RTL component tests (Buttons, Cards, Navbars)
└── e2e/                  # Playwright browser workflows (Lead flow, admin auth)
```

### Component Testing Rules
- Query elements using user-facing roles and labels (`getByRole`, `getByLabelText`) rather than implementation details or CSS selectors.
- Assert accessibility attributes (`aria-expanded`, `aria-hidden`, keyboard focus).
- Mock network and third-party APIs using MSW (Mock Service Worker) or Vitest spies.

### End-to-End Testing Rules
- Test critical paths:
  1. Visiting `/` & verifying service catalog listings.
  2. Submitting `/contact` form with valid inputs and asserting success confirmation.
  3. Attempting unauthorized access to `/admin` and verifying redirect to `/admin/login`.
  4. Logging in as admin and inspecting enquiry table rows.

