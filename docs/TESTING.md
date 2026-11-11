# TESTING.md — Quality Assurance & Testing Strategy

## 1. Testing Philosophy
VOIDTECH SOLUTION adheres to the **Empirical Validation Principle**:
> *No "trust me, it works." Every change requires captured proof from automated test runners, compilers, or linters.*

The testing strategy is organized into a four-tiered pyramid:
1. **Unit & Validation Tests (Vitest):** Millisecond-speed testing of utility functions, Zod schema constraints, and business logic.
2. **Component & Integration Tests (React Testing Library + Vitest):** Verification of component rendering, user interactions, accessible role queries, and event handlers.
3. **Repository & Data Layer Tests (Vitest):** Verification of database repository abstraction contracts, offline fallback handling, and schema integrity.
4. **Email & Security Service Tests (Vitest):** Verification of SMTP configuration, bounded retries, email templates, delivery tracking, and cryptographic OTP policies.

---

## 2. Test Execution Commands

```bash
# Run all unit, component, email, otp & repository test suites
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

## 3. Test Suites & Coverage (Phase 3 Credential Readiness: 82 Tests Passing)

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
3. **`tests/unit/database.test.ts` (19 tests):**
   - **Services Repository:** Retrieves all 18 registered business services with full metadata, enforces INR currency (`currency: "INR"`), queries active offerings, filters featured offerings, lookups by slug, and handles non-existent slugs.
   - **Portfolio Repository:** Verifies projects marked as `projectType: "CONCEPT"`, confirms complete removal of fabricated client names ("Aether Capital", "Synthex Networks"), verifies simulated benchmark metrics, queries featured projects, filters by industry, and queries by slug.
   - **Approved INR Pricing Packages:** Retrieves exactly 10 approved packages, strictly asserts the 10 approved starting prices (₹999, ₹2,999, ₹5,999, ₹12,999, ₹19,999, ₹24,999, ₹29,999, ₹34,999, ₹49,999, ₹59,999), and queries packages by slug.
   - **FAQ Repository:** Retrieves baseline FAQs and tests category filtering (`PRICING`, `TECHNICAL`, `GENERAL`).
   - **Settings & Write Safety:** Verifies default value returns, tests fallback site settings map, verifies non-crashing database connection checks, verifies safe error throwing on database write failure without leaking credentials, and verifies enquiry stats aggregation without crashing.
4. **`tests/unit/email.test.ts` (14 tests):**
   - **SMTP Configuration:** Zod validation of `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM_NAME`, `SMTP_FROM_EMAIL`, `ADMIN_ALERT_EMAIL`, and failure on invalid env inputs.
   - **Template Rendering (6 Templates):** Renders OTP verification (with 6-digit code and VoidTech branding), password reset (with secure CTA link), enquiry confirmation (with 24h SLA review guarantee), new enquiry admin alert (with full structured lead brief), enquiry status update (with state pill badge), and security notification (with event details and IP).
   - **Transporter & Service:** Mocked SMTP connection verification, transient failure retry loop with bounded exponential backoff (retries = 2), permanent delivery failure logging (`status: "FAILED"`), and typed convenience dispatchers.
5. **`tests/unit/otp.test.ts` (8 tests):**
   - **Generation & Hashing:** Cryptographically secure 6-digit numerical string verification (`^\d{6}$`), uniform distribution, deterministic HMAC-SHA256 hashing with salt and pepper isolation.
   - **Lifecycle & Security Policies:** 5-minute expiration verification, 60-second resend cooldown enforcement against rapid token spamming, single-use consumption preventing replay attacks, max 5 attempts lockout policy, expiration rejection, and strict purpose isolation (LOGIN code cannot reset PASSWORD).
6. **`tests/unit/env.test.ts` (9 tests):**
   - **Environment Validation:** Comprehensive Zod validation in development mode.
   - **Production Hardening:** Rejects development dummy passwords and placeholder auth secrets when `NODE_ENV === "production"`.
   - **Password Security:** Scrypt password hashing with unique random salts, constant-time verification against timing attacks, rejection of short passwords (< 8 chars), and graceful error handling on malformed hashes.

---

## 4. Verification Gate Summary
- **Vitest Unit & Component Tests:** 6 test files, 82 tests passing (0 failures).
- **TypeScript Strict Mode:** `tsc --noEmit` passed with 0 errors.
- **ESLint:** `next lint` passed with 0 warnings or errors.
- **Next.js Production Build:** `next build` passed with all static and dynamic routes compiled.


---

## 5. Phase 5 Test Suite — About, Portfolio & Case Studies

- **Test File:** `tests/unit/about-portfolio.test.tsx` (16 tests)
- **Total Project Tests:** 112 passing across 8 test suites.
- **Coverage Areas:**
  1. **About Page Hero:** Approved headline *"Engineering Ideas Into Digital Reality."*, subtext, and portfolio CTA.
  2. **Who We Are Section:** Authentic studio statement without fabricated statistics, employee counts, or fake certifications.
  3. **Mission & Vision Statements:** Exact verification of approved mission and vision copy.
  4. **Core Values:** All 6 pillars (Engineering Quality, Transparent Communication, Practical Innovation, Maintainable Architecture, User-Centered Design, Continuous Improvement).
  5. **Engineering Approach:** All 6 structured phases (Understand the requirement, Define the architecture, Design the experience, Develop the solution, Test thoroughly, Deliver and support).
  6. **Technology Matrix:** Categorized 7-domain tech stack matrix without unauthorized partnerships.
  7. **About Conversion CTA:** *"Have an idea worth building?"* linking to `/#contact`.
  8. **Portfolio Hero:** Approved headline *"Selected Work & Engineering Concepts."* and lab prototype positioning.
  9. **Portfolio Project Cards:** Prominent `CONCEPT` badges and simulated benchmark tags.
  10. **Interactive Industry Filtering:** Client-side category pill selection and filtering.
  11. **Live Keyword Search:** Full-text search across titles, summaries, and tech tags.
  12. **Empty State:** Friendly empty state rendering when search matches 0 projects with reset filter trigger.
  13. **Dynamic Route Static Params:** `generateStaticParams()` returns all known project slugs.
  14. **Dynamic Metadata:** `generateMetadata()` produces dynamic titles, descriptions, and OpenGraph data.
  15. **Full Case Study Layout:** Renders Breadcrumbs, Hero, Challenge, Solution, Architecture Blueprint, Simulated Benchmarks, Tech Stack, Related Concepts, and CTA.
  16. **404 Handling:** `notFound()` correctly invoked when project slug does not exist.

- **Test File:** `tests/unit/homepage.test.tsx` (14 tests)
- **Total Project Tests:** 96 passing across 7 test suites.
- **Coverage Areas:**
  1. Complete Homepage rendering with all 9 strategic sections.
  2. Hero headline, supporting copy, and dual CTA navigation.
  3. Brand introduction quote and 3 core engineering commitments.
  4. Services Showcase rendering with all 18 approved services.
  5. Category filtering and live keyword search in `ServicesFilter`.
  6. Practical differentiators in Why Choose VoidTech.
  7. 7-stage delivery lifecycle steps.
  8. Concept Lab projects with explicit `CONCEPT` badge.
  9. All 10 approved pricing tiers in INR (₹999 to ₹59,999+) with preserved plus signs.
  10. Accessible `Accordion` keyboard toggle, ARIA attributes, and empty fallback state.
  11. Direct email copy-to-clipboard functionality in `QuickInquiry`.
  12. Header and Footer navigation link consistency.

---

## 6. Phase 6 Test Suite — Pricing, Calculator & Contact System

- **Test File:** `tests/unit/pricing-contact.test.tsx` (18 tests)
- **Total Project Tests:** 130 passing across 9 test suites (100% pass rate).
- **Coverage Areas:**
  1. **Pricing Table Rendering:** All 10 approved packages with INR pricing (₹999 to ₹59,999+) and deliverable lists.
  2. **Category Filter Tabs:** Correct filtering across Websites, Platforms & E-Commerce, Enterprise & AI, and All Tiers.
  3. **Package Selection Links:** Valid `/contact?package=[slug]` navigation targets.
  4. **Calculator Baseline Price:** Instant calculation for default category (₹999 for Basic Static).
  5. **Category Switch:** Automatic baseline recalculation on discipline change (e.g. SaaS -> ₹24,999+).
  6. **Add-On Selection:** Incremental recalculation when selecting architectural modules.
  7. **Custom Quotation Handling:** Sets custom quote flag when bespoke modules (e.g. Legacy Migration, 3D WebGL) are selected.
  8. **Delivery Priority Urgency:** Calculates +25% sprint acceleration multiplier.
  9. **Calculator Reset Action:** Restores baseline configuration and clears add-ons.
  10. **Progressive Form Navigation:** Step 1 -> Step 2 -> Step 3 transitions.
  11. **Step-by-Step Validation:** Enforces category, budget, timeline, minimum brief length, name, email, and consent before progressing/submitting.
  12. **Success Screen Rendering:** Unique Reference ID (`ENQ-...`), 3-step onboarding guide, and reset action.
  13. **Data Preservation on Server Failure:** Form inputs retained when database or network encounters error, rendering accessible alert with "Retry Submission" button.
  14. **Honeypot Bot Trap:** Fast-path silent rejection when `website_url` is populated.
  15. **Duplicate Prevention:** Rejects identical submissions within 60-second cooldown window.
  16. **Non-Blocking Email Notifications:** Asynchronously invokes `dispatchEnquiryNotifications()`.
  17. **API Route Status 201:** `POST /api/enquiries` returns created status and enquiry ID.
  18. **API Route Status 400:** `POST /api/enquiries` returns structured validation error envelope.
