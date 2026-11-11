# Phase 7: Implementation Plan & Milestone Roadmap

**Document Version:** 1.0.0  
**Phase:** 07 — Admin Authentication, Session Management & Role-Based Access Control  
**Status:** Staged & Awaiting Owner Review (Milestone 7.0)  
**Date:** 2026-11-12  

---

## 1. Overview & Execution Strategy

Phase 7 will be implemented in strict sequential milestones. Each milestone defines explicit acceptance criteria, security controls, and quality verification gates.

---

## 2. Milestone Execution Roadmap

### Milestone 7.1 — Admin Authentication & Validation Layer
* **Objective:** Implement server-side credentials authentication with Zod validation, scrypt verification, rate limiting, and generic error handling.
* **Deliverables:**
  * `src/validations/auth.ts`: Zod validation schemas for login and password reset.
  * `src/server/actions/auth.actions.ts`: `loginAction` Server Action.
  * Integration with `src/server/repositories/users.repo.ts` (`getAdminByEmail`, `updateLastLogin`).
  * Rate limiting integration: 5 failed attempts per 15 minutes per IP/email.
  * Audit logging: Immutable records for `AUTH_LOGIN_SUCCESS` and `AUTH_LOGIN_FAILED`.
* **Security Criteria:**
  * Constant-time scrypt password comparison.
  * Zero account enumeration (identical generic message for unknown email and wrong password).
  * No passwords in logs or browser payloads.

---

### Milestone 7.2 — Secure Database Session Engine
* **Objective:** Design and implement revocable, database-backed session management.
* **Deliverables:**
  * Prisma schema update: Add `AdminSession` model with cascade delete to `AdminUser`.
  * Staged incremental migration SQL: `prisma/migrations/20261112000001_add_admin_sessions/migration.sql` and `down.sql`.
  * `src/server/security/session.ts`:
    * `generateSessionToken()`: 32 bytes cryptographically secure random token.
    * `hashSessionToken()`: SHA-256 token hashing for database storage.
    * `signSessionCookie()` & `verifySessionCookie()`: Web Crypto API (HMAC-SHA256) for Edge compatibility.
    * `createSession()`: Writes to `AdminSession` in PostgreSQL.
    * `validateSession()`: Validates token against database, checks expiration, updates `lastActiveAt`.
    * `revokeSession()`: Deletes session token from database.
    * `revokeAllUserSessions()`: Deletes all active sessions for a user upon security events.
  * Cookie options: `name: "vts_session"`, `httpOnly: true`, `secure: production`, `sameSite: "lax"`, `path: "/"`, `maxAge: 28800` (8 hours).

---

### Milestone 7.3 — Role-Based Access Control (RBAC) System
* **Objective:** Create centralized, type-safe server-side authorization guards.
* **Deliverables:**
  * `src/server/security/rbac.ts`:
    * Typed permission definitions (`PermissionKey`).
    * Role-to-permission mapping (`SUPER_ADMIN`, `ADMIN`, `EDITOR`).
    * `hasPermission(role: UserRole, permission: PermissionKey): boolean`.
    * `requirePermission(user: AdminUser, permission: PermissionKey): void`.
    * `requireRole(user: AdminUser, requiredRole: UserRole): void`.
  * Integration into Server Actions and API endpoints.

---

### Milestone 7.4 — Next.js Route Protection Middleware & Admin UI
* **Objective:** Implement Edge-compatible routing guards and an agency-grade responsive admin login screen.
* **Deliverables:**
  * `src/middleware.ts`:
    * Edge middleware inspecting incoming requests.
    * Guards `/admin/*` routes (redirects unauthenticated users to `/admin/login?callbackUrl=...`).
    * Allows unauthenticated access to `/admin/login`.
    * Redirects already-authenticated admins visiting `/admin/login` directly to `/admin`.
    * Public website routes remain untouched.
    * Injects HTTP security headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`).
  * `src/app/admin/login/page.tsx`:
    * Dark theme matching VOIDTECH visual identity (`#050507`, `#0a0a0f`, electric violet glow).
    * Email and password inputs with accessible validation error alerts.
    * "Remember me" option extending session lifetime.
    * Dynamic loading spinners and disabled submit buttons during flight.
  * `src/app/admin/page.tsx`:
    * Authenticated admin shell landing placeholder displaying active user profile, role badge, and quick telemetry.
  * `src/app/admin/layout.tsx`:
    * Admin layout wrapper ensuring authenticated session context.

---

### Milestone 7.5 — Controlled Admin Provisioning CLI
* **Objective:** Secure, owner-controlled bootstrap mechanism for administrator accounts with zero hardcoded credentials.
* **Deliverables:**
  * `scripts/create-admin.ts`:
    * Standalone CLI utility executed via `npx tsx scripts/create-admin.ts`.
    * Validates runtime inputs against `zod`.
    * Rejects existing emails to prevent accidental overwrites.
    * Hashes password using standard `hashPassword` (scrypt).
    * Logs account creation in `AuditLog`.
    * Fully decoupled from automated seeds.

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

