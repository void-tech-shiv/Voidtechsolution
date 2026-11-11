# Phase 6: Public Marketing Pages — Pricing Calculator, Contact & Enquiry Flow — Discussion

## Context & Objectives

Phase 5 successfully delivered the `/about` agency storytelling, `/portfolio` discovery page with interactive filtering and live keyword search, dynamic `/portfolio/[slug]` case study layouts, and verified 112 passing unit tests across 8 test suites.

Phase 6 officially implements the commercial conversion core of the VOIDTECH SOLUTION platform:
1. **Dedicated Pricing Page (`/pricing`)**:
   - Comprehensive pricing catalog featuring all 10 approved starting price tiers in INR (₹999 to ₹59,999+).
   - Interactive category filtering (All Packages, Core Websites, E-Commerce & SaaS, Enterprise & AI).
   - Detailed feature lists and transparent deliverable specifications.
   - Direct package selection flow pre-populating the contact enquiry process.
2. **Interactive Project Estimation Calculator (`src/components/sections/pricing-calculator.tsx`)**:
   - Dynamic real-time estimation engine calculating starting investment ranges based on base product selection, architectural add-ons (Auth/RBAC, Payments, Microservices APIs, AI/LLM Vector Integration, Real-Time WebSockets, Localization), and delivery urgency multipliers.
   - Seamless scope transfer routing directly to `/contact` with pre-filled scope parameters.
3. **Dedicated Contact Page (`/contact`)**:
   - Hero and agency operations availability banner (Remote-First, Mon–Sat IST hours, 24-hour scoping SLA).
   - Responsive multi-step enquiry form (`src/components/sections/contact-enquiry-form.tsx`):
     - Step 1: Project Scope & Category (with URL param pre-fill support).
     - Step 2: Technical Specifications & Timeline (budget, urgency, requirements).
     - Step 3: Contact & Organization Details (name, email, phone, company, honeypot).
   - Full client-side validation via React Hook Form and Zod (`src/validations/enquiry.ts`).
   - Engaging success confirmation state with unique reference ID.
4. **Resilient Enquiry Submission API & Server Action**:
   - Validation against `enquiryFormSchema`.
   - Honeypot spam defense.
   - Persistence via `EnquiriesRepo.createEnquiry()` with safe database fallback.
   - Transactional email dispatch (prospect confirmation + internal admin notification) with non-blocking error handling.
5. **Navigation Alignment**:
   - `siteConfig.mainNav` updated: `Pricing` links to `/pricing` and `Contact` links to `/contact`.

## Architectural Principles

1. **Pricing Authenticity & Currency Invariants**:
   - All prices must remain strictly in INR (₹).
   - Starting prices must exactly match the 10 approved baselines: ₹999, ₹2,999, ₹5,999, ₹12,999+, ₹19,999+, ₹24,999+, ₹29,999+, ₹34,999+, ₹49,999+, ₹59,999+.
   - Plus signs (`+`) preserved on custom scope tiers to clearly denote baseline starting pricing.
2. **Resilient Lead Capture**:
   - Database down or unseeded? Enquiries repo handles offline persistence gracefully; prospective client receives confirmed reference ID without an ugly 500 error.
   - SMTP offline or unverified? Email sending is dispatched asynchronously in a non-blocking try/catch block so a network/SMTP timeout never aborts the lead submission.
3. **Ergonomic Multi-Step UX**:
   - Progressive disclosure reduces cognitive friction.
   - Step state preserved during navigation.
   - Smooth validation feedback with clear accessible error alerts.
