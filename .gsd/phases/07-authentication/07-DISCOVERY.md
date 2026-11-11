# Phase 7: Discovery & Existing Security Infrastructure Audit

**Document Version:** 1.0.0  
**Phase:** 07 — Admin Authentication, Session Management & Role-Based Access Control  
**Status:** Completed & Audited (Milestone 7.0)  
**Date:** 2026-11-12  

---

## 1. Executive Summary

Phase 7 establishes the administrative access control plane for VOIDTECH SOLUTION. The objective is to engineer a high-assurance, credentials-based administrative authentication system with database-backed revocable sessions, Edge-compatible route protection middleware, granular role-based authorization (RBAC), and immutable audit logging.

Prior to authoring code, an exhaustive inspection of the existing codebase, schema, and security utilities was performed to identify reusable assets, environmental boundaries, and architectural gaps.

---

## 2. Inventory of Existing Security Assets

### A. Database Models & Schema (`prisma/schema.prisma`)
The existing PostgreSQL schema contains 10 application models and 5 custom enums, all verified and deployed in the remote database:
1. **`AdminUser` (`admin_users` table):**
   - Fields: `id` (cuid PK), `email` (unique string), `passwordHash` (scrypt string), `name` (string), `role` (`UserRole` enum), `isActive` (boolean default true), `lastLoginAt` (timestamp nullable), `createdAt`, `updatedAt`.
   - Table state: Deployed in PostgreSQL, currently contains **0 administrator records** (strictly preserving the Phase 7 boundary).
2. **`UserRole` Enum:**
   - Values: `SUPER_ADMIN`, `ADMIN`, `EDITOR`.
   - Fully defined in PostgreSQL engine.
3. **`AuditLog` (`audit_logs` table):**
   - Fields: `id` (cuid PK), `action` (string), `entity` (string), `entityId` (string nullable), `actorId` (string nullable), `actorEmail` (string nullable), `ipAddress` (string nullable), `userAgent` (string nullable), `details` (JSON nullable), `createdAt` (timestamp).
   - Indexed on `action`, `(entity, entityId)`, `actorId`, and `createdAt`.
   - Repository: `src/server/repositories/audit.repo.ts` (`createAuditLog`, `getRecentAuditLogs`, `getAuditLogsByEntity`).
4. **`OtpVerification` (`otp_verifications` table):**
   - Fields: `id`, `identifier`, `codeHash`, `purpose` (`LOGIN`, `PASSWORD_RESET`, `ENQUIRY_VERIFICATION`, `ADMIN_ACTION`), `expiresAt`, `attempts`, `maxAttempts`, `resendAvailableAt`, `isUsed`, `verifiedAt`.
   - Indexed on `(identifier, purpose)`, `expiresAt`, `createdAt`.
   - Service: `src/server/security/otp.service.ts` provides complete OTP generation, HMAC-SHA256 hashing, rate limiting, and purpose isolation.

### B. Cryptographic Utilities (`src/server/security/password.ts`)
- **Algorithm:** Node.js `crypto.scryptSync`.
- **Salt:** 16 bytes of cryptographically secure pseudorandom data (`crypto.randomBytes(16)`), hex-encoded.
- **Key Length:** 64 bytes (512 bits) derived key, hex-encoded.
- **Stored Format:** `<hex_salt>:<hex_hash>` (total length: 32 + 1 + 128 = 161 characters).
- **Verification:** `crypto.timingSafeEqual` comparing hex buffers to prevent side-channel timing attacks.
- **Evaluation:** High-assurance, industry-standard implementation. 100% reusable without modification.

### C. Rate Limiting Infrastructure (`src/server/security/rate-limiter.ts`)
- **Algorithm:** In-memory token-bucket rate limiter with automatic garbage collection.
- **Parameters:** Configurable max requests and window duration.
- **Usage:** Currently guards inbound enquiries (`submitEnquiryAction`).
- **Evaluation:** Reusable for admin login endpoints to prevent brute-force attacks and credential stuffing.

### D. Environment Configuration (`src/config/env.ts`)
- `AUTH_SECRET`: Validated via Zod to enforce a minimum length of 32 characters.
- `OTP_PEPPER_SECRET`: Validated via Zod to enforce a minimum length of 16 characters.
- `ADMIN_EMAIL`: Validated email address, defaults to `admin@voidtechsolution.com`.
- `ADMIN_PASSWORD`: Optional bootstrap password string (min 8 chars if supplied).
- `DATABASE_URL` & `DIRECT_URL`: Validated PostgreSQL connection strings.

### E. Email Notification Services (`src/server/email/`)
- Production-ready Nodemailer SMTP transporter (`src/server/email/transporter.ts`).
- Pre-built templates for OTP verification, password reset, and security event alerts (`src/server/email/templates/`).
- Verified public support desk: `voidtechsolutionsupport@gmail.com`.

---

## 3. Identified Architectural Gaps & Constraints

| Domain | Current State | Required State for Phase 7 | Architectural Solution |
|---|---|---|---|
| **Session Model** | No session table in database | Revocable, trackable sessions stored securely | Introduce `AdminSession` model in Prisma schema (`admin_sessions` table) storing SHA-256 hashes of session tokens. |
| **Next.js Middleware** | No `middleware.ts` in repo | Route guard protecting `/admin/*` | Implement `src/middleware.ts` running on Edge runtime with dual-layer token verification. |
| **Edge vs Node Runtime** | Node `crypto.scryptSync` cannot run on Edge | Edge middleware must verify session tokens | Middleware verifies Edge-compatible HMAC token signature (`crypto.subtle`); Server Actions and Route Handlers perform database session lookup. |
| **Admin UI Shell** | `src/app/admin/` does not exist | Responsive, dark-themed login interface & shell | Create `src/app/admin/login/page.tsx` and placeholder dashboard landing page `src/app/admin/page.tsx`. |
| **CSRF Defense** | Next.js Server Actions have built-in origin checks | Defense-in-depth against cross-site forged state changes | Enforce `SameSite: "lax"`, HTTP-only cookies, and Next.js Server Action CSRF protections. |
| **Admin Provisioning** | Manual or seed-based | Controlled, owner-authorized CLI command | Author `scripts/create-admin.ts` with interactive prompts, scrypt hashing, and zero hardcoded credentials. |

---

## 4. Existing Dependencies Evaluation

```json
"dependencies": {
  "@hookform/resolvers": "^3.9.1",
  "@prisma/client": "^6.0.0",
  "clsx": "^2.1.1",
  "framer-motion": "^11.13.1",
  "lucide-react": "^0.460.0",
  "next": "^15.1.0",
  "nodemailer": "^10.5.0",
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "react-hook-form": "^7.53.2",
  "tailwind-merge": "^2.5.5",
  "zod": "^3.23.8"
}
```

### Dependency Decision: Zero Additional Third-Party Auth Packages
* We do **NOT** install NextAuth / Auth.js / Lucia.
* **Rationale:**
  1. NextAuth / Auth.js introduces significant complexity, external adapter dependencies, and frequent breaking API changes between Next.js versions.
  2. The application already possesses scrypt password hashing, rate limiting, and Prisma repositories.
  3. A bespoke, lightweight session engine built natively with Web Crypto and Prisma guarantees 100% control, zero external attack surface, full type safety, and seamless integration with the existing `AdminUser` and `AuditLog` tables.

