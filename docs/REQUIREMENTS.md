# REQUIREMENTS.md — System Requirements Specification

## 1. Functional Requirements (FR)

### FR-01: Public Brand & Homepage
- **FR-01.1:** The system shall display an authoritative homepage highlighting the VOIDTECH SOLUTION brand, tagline ("Build. Launch. Grow Online."), and engineering specializations.
- **FR-01.2:** The homepage shall feature an interactive overview of all 18 registered business services categorized by domain.
- **FR-01.3:** The navigation system shall provide frictionless routing between Home, About, Services, Pricing, Portfolio, and Contact.

### FR-02: Comprehensive Services Catalog
- **FR-02.1:** The system shall present 18 distinct services categorized across Web, Mobile, API, AI/Automation, Design, Enterprise Systems, Fintech, and Cloud.
- **FR-02.2:** Each service shall declare key deliverables, underlying technology stacks, and target use cases.

### FR-03: Inbound Lead & Enquiry Pipeline
- **FR-03.1:** The system shall present an interactive enquiry capture form with service category selection, budget range, estimated timeline, contact info, and project description.
- **FR-03.2:** Input must be strictly validated both on the client and server side via Zod.
- **FR-03.3:** The enquiry submission must be persisted to the PostgreSQL `enquiries` table with an initial status of `NEW`.
- **FR-03.4:** The system shall sanitize all inputs to prevent XSS and SQL injection.

### FR-04: Authenticated Admin Portal
- **FR-04.1:** The system shall provide a secure login screen (`/admin/login`) requiring email and password credentials.
- **FR-04.2:** Admin sessions shall be maintained using secure HTTP-only cookies and cryptographically signed session tokens.
- **FR-04.3:** Unauthorized access attempts to `/admin/*` routes must be intercepted by middleware and redirected to login.
- **FR-04.4:** The admin dashboard shall present key operational metrics: total leads, pending reviews, converted projects, and recent activity logs.
- **FR-04.5:** The admin shall be able to update enquiry status (`NEW`, `IN_REVIEW`, `CONTACTED`, `CONVERTED`, `ARCHIVED`) and append internal notes.

### FR-05: Content Administration (CMS)
- **FR-05.1:** Admins shall have CRUD capabilities for Case Studies/Portfolio projects.
- **FR-05.2:** Admins shall have the ability to toggle service visibility and update pricing packages without triggering application rebuilds.

---

## 2. Non-Functional Requirements (NFR)

### NFR-01: Performance & Web Vitals
- **NFR-01.1:** First Contentful Paint (FCP) must remain under 1.2s on standard 4G connections.
- **NFR-01.2:** Largest Contentful Paint (LCP) must remain under 2.0s.
- **NFR-01.3:** Cumulative Layout Shift (CLS) must remain under 0.05.
- **NFR-01.4:** First Input Delay (FID) / Interaction to Next Paint (INP) must remain under 100ms.

### NFR-02: Security & Privacy
- **NFR-02.1:** Strict Content Security Policy (CSP), HTTP Strict Transport Security (HSTS), X-Frame-Options (DENY), and X-Content-Type-Options (nosniff) must be enforced.
- **NFR-02.2:** All database queries must use parameterized queries via Prisma ORM to prevent SQL injection.
- **NFR-02.3:** Passwords must be hashed using Argon2 or Bcrypt with adequate work factor.
- **NFR-02.4:** Rate limiting must protect enquiry endpoints and authentication routes against brute-force attacks.

### NFR-03: Accessibility (a11y)
- **NFR-03.1:** The website must conform to WCAG 2.1 AA standards.
- **NFR-03.2:** Full keyboard navigability must be supported with visible focus rings.
- **NFR-03.3:** Semantic HTML5 elements (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`) must be used exclusively.
- **NFR-03.4:** Sufficient color contrast ratios (minimum 4.5:1 for normal text, 3:1 for large text) must be maintained against dark backgrounds.

### NFR-04: Reliability & Maintainability
- **NFR-04.1:** TypeScript strict mode must be enforced with 0 `any` escapes in production code paths.
- **NFR-04.2:** Automated test suites must achieve high unit and integration coverage.
- **NFR-04.3:** The codebase must maintain modular separation between UI components, server actions, route handlers, and data models.
