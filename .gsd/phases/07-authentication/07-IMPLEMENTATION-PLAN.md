# Phase 7: Implementation Plan & Milestone Roadmap

**Document Version:** 1.1.0 (Owner-Approved: Single SUPER_ADMIN Governance & Shared Login Architecture)  
**Phase:** 07 — Admin Authentication, Session Management & Role-Based Access Control  
**Status:** Approved for Implementation (Milestones 7.1 & 7.2 Complete; Roadmap Updated for 7.3+)  
**Date:** 2026-11-12  

---

## 1. Overview & Execution Strategy

Phase 7 will be implemented in strict sequential milestones. Each milestone defines explicit acceptance criteria, security controls, and quality verification gates.

---

## 2. Milestone Execution Roadmap

### Milestone 7.1 — Admin Authentication & Validation Layer [COMPLETED & VERIFIED]
* **Objective:** Implement server-side credentials authentication with Zod validation, scrypt verification, rate limiting, and generic error handling.
* **Deliverables:**
  * `src/validations/auth.ts`: Zod validation schemas for login and password reset with strict length bounds.
  * `src/server/actions/auth.actions.ts`: `loginAction`, `logoutAction`, `getCurrentAdmin`.
  * `src/server/security/origin.ts`: Hardened `validateRequestOrigin` with config allowlist, anti-host injection, and proxy boundaries.
  * Integration with `src/server/repositories/users.repo.ts` (`getAdminByEmail`, `updateLastLogin`, `updateAdminPassword`, `updateAdminRole`, `setAdminActiveStatus`).
  * Rate limiting integration: 5 failed attempts per 15 minutes per IP/email (process-local for dev/tests; Redis/KV assessed for serverless production).
  * Audit logging: Immutable records for `AUTH_LOGIN_SUCCESS`, `AUTH_LOGIN_FAILED`, and `AUTH_LOGOUT`.
* **Security Criteria:**
  * Constant-time scrypt password comparison.
  * Zero account enumeration (identical generic message for unknown email and wrong password).
  * No passwords in logs or browser payloads.

---

### Milestone 7.2 — Secure Database Session Engine [COMPLETED & VERIFIED]
* **Objective:** Design and implement revocable, database-backed session management.
* **Deliverables:**
  * Prisma schema update: Add `AdminSession` model with cascade delete to `AdminUser`.
  * Staged incremental migration SQL: `prisma/migrations/20261112000001_add_admin_sessions/migration.sql` and `down.sql`.
  * `src/server/security/session.ts`:
    * `generateRawSessionToken()`: 32 bytes (256-bit) cryptographically secure random token.
    * `hashSessionToken()`: Deterministic SHA-256 token hashing for database storage (raw tokens never enter database).
    * `signSessionCookie()` & `verifySessionCookie()`: Web Crypto API (HMAC-SHA256) for Edge compatibility.
    * `createAdminSession()`: Writes to `AdminSession` in PostgreSQL.
    * `validateAdminSession()`: Authoritative validation against PostgreSQL, checks 8-hour absolute expiry, 30-minute idle timeout, user active status, and throttles `lastActiveAt` touches (`TOUCH_INTERVAL_MS = 5 * 60 * 1000`) for database write amplification protection.
    * `revokeAdminSession()`: Deletes session token from database upon logout.
    * `revokeAllUserSessions()`: Deletes all active sessions for a user upon password/role change or deactivation.
  * Cookie options: `name: "vts_session"`, `httpOnly: true`, `secure: production`, `sameSite: "lax"`, `path: "/"`, `maxAge: 28800` (8 hours).

---

### Milestone 7.3 — Role-Based Access Control (RBAC) System & SUPER_ADMIN Governance
* **Objective:** Implement centralized, type-safe server-side authorization guards, non-escalation invariants, and the Single `SUPER_ADMIN` Governance Model.
* **Deliverables:**
  * `src/server/security/rbac.ts`:
    * Strict three-role definition: `SUPER_ADMIN`, `ADMIN`, `EDITOR`.
    * Typed permission definitions (`PermissionKey`) covering all administrative operations.
    * Centralized permission mapping matrix.
    * `hasPermission(role: UserRole, permission: PermissionKey): boolean`.
    * `requirePermission(user: AdminUser, permission: PermissionKey): void`.
    * `requireRole(user: AdminUser, requiredRole: UserRole): void`.
    * **Sole Active SUPER_ADMIN Invariant Guard (`assertSoleSuperAdminProtection`):**
      * Atomic validation ensuring `count(AdminUser where role = 'SUPER_ADMIN' and isActive = true) >= 1`.
      * Prevents deactivating, deleting, or demoting the last active `SUPER_ADMIN`.
    * **Non-Escalation Safeguards:**
      * Rejection of any user creation or role modification attempted by `ADMIN` or `EDITOR`.
      * Rejection of self-role modification for any administrator.
      * Enforces privilege ceiling (cannot grant higher permissions than own role).
  * Integration into Server Actions and Route Handlers for authoritative enforcement.

---

### Milestone 7.4 — Next.js Route Protection Middleware & Single Shared Admin UI
* **Objective:** Implement Edge-compatible routing guards and an agency-grade responsive shared admin login screen at `/admin/login`.
* **Deliverables:**
  * `src/middleware.ts`:
    * Edge middleware inspecting incoming requests.
    * Guards `/admin/*` routes (redirects unauthenticated users to `/admin/login?callbackUrl=...`).
    * Allows unauthenticated access to `/admin/login`.
    * Redirects already-authenticated admins visiting `/admin/login` directly to `/admin`.
    * Public website routes remain untouched.
    * Injects HTTP security headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`).
  * `src/app/admin/login/page.tsx` — **Single Shared Authentication Portal**:
    * Exactly ONE shared login portal for `SUPER_ADMIN`, `ADMIN`, and `EDITOR`.
    * Dark theme matching VOIDTECH visual identity (`#050507`, `#0a0a0f`, electric violet glow).
    * Email and password inputs with accessible validation error alerts.
    * Generic authentication error handling (zero user enumeration).
    * "Remember me" option extending session lifetime.
    * Dynamic loading spinners and disabled submit buttons during flight.
  * `src/app/admin/page.tsx` — **Role-Aware Admin Shell**:
    * Authenticated admin shell landing dashboard with dynamic, role-aware presentation:
      * `SUPER_ADMIN`: Displays full suite (User management, Audit logs, Site Settings, Enquiries with Delete, Services, Pricing, Portfolio, FAQs).
      * `ADMIN`: Displays operations suite (Enquiries status updates, Services, Pricing, Portfolio, FAQs). User management and audit logs hidden.
      * `EDITOR`: Displays content curation suite (Portfolio, FAQs, Services copywriting, Read-only enquiries). Pricing, Admin management, Settings, and Audit logs hidden.
    * Displays active administrator email, role badge, session status, and quick telemetry.
  * `src/app/admin/layout.tsx`:
    * Admin layout wrapper ensuring authenticated session context, navigation sidebar tailored by role, and secure sign-out CTA.

---

### Milestone 7.5 — Controlled Initial SUPER_ADMIN Provisioning CLI
* **Objective:** Secure, owner-controlled bootstrap mechanism strictly for the initial `SUPER_ADMIN` account with zero hardcoded credentials and zero database seed creation.
* **Deliverables:**
  * `scripts/create-admin.ts`:
    * Standalone CLI utility executed via `npx tsx scripts/create-admin.ts`.
    * Interactively prompts owner for admin `name`, `email`, and `password` (or accepts secure environment overrides for headless execution).
    * Validates runtime inputs against `zod` (password min 12 chars, complexity checks).
    * Rejects existing emails to prevent accidental overwrites.
    * Hashes password using constant-time `hashPassword` (scrypt with 16-byte cryptographically secure random salt).
    * Strictly provisions account with `role: "SUPER_ADMIN"` and `isActive: true`.
    * Logs account creation in `AuditLog` (`action: "ADMIN_BOOTSTRAP_SUCCESS"`).
    * Fully decoupled from automated seeds (`prisma/seed.ts` is strictly prohibited from creating admin accounts).

---

### Milestone 7.6 — Automated Security Testing & Technical Documentation
* **Objective:** Validate all authentication paths, RBAC policies, and session edge cases with zero mock leakage.
* **Deliverables:**
  * `tests/unit/auth.test.ts`:
    * Unit tests for login validation, scrypt verification, token signing, session rotation, and RBAC matrix.
  * `tests/unit/middleware.test.ts`:
    * Unit tests for route guarding, callbackUrl preservation, and cookie signature verification.
  * `tests/e2e/auth.spec.ts`:
    * Playwright end-to-end tests for admin login, invalid password error alerts, session persistence, and logout flow.
  * Documentation updates:
    * `docs/SECURITY.md`, `docs/ARCHITECTURE.md`, `docs/API_DOCUMENTATION.md`, `docs/PROJECT_STATUS.md`, `docs/CHANGELOG.md`.

---

## 3. Quality Verification Checklist

* [ ] `prisma validate`: Schema passes syntax and relationship validation.
* [ ] `npm run typecheck`: 0 TypeScript compiler errors.
* [ ] `npm run lint`: 0 ESLint warnings or errors.
* [ ] `npm test`: 100% of unit and integration tests passing.
* [ ] `npm run build`: All 13+ routes compiled cleanly.
* [ ] CodeRabbit / Manual Security Review: Zero exposed credentials, zero timing vulnerabilities.
* [ ] Git Working Tree: Clean and tagged to `session/phase-7-admin-auth`.

