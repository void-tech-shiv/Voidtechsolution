# SECURITY.md — Security Architecture & Controls

## 1. Core Security Principles
1. **Zero Trust Perimeter:** Validate and sanitize every request at edge middleware and route handlers, regardless of origin.
2. **Defense in Depth:** Multiple layers of control spanning HTTP security headers, CORS restrictions, rate limiting, Zod schema validation, and database parameterization.
3. **No Secret Leakage:** Zero secrets or production credentials in Git. Clear boundary between server-only and `NEXT_PUBLIC_` client environment variables.
4. **Least Privilege:** Granular database roles, strict Prisma schema access, and scoped admin permissions (`SUPER_ADMIN`, `ADMIN`, `EDITOR`).

---

## 2. Hardened HTTP Security Headers
Configured in `next.config.ts`:

```typescript
const headers = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "origin-when-cross-origin" },
];
```

Planned Content Security Policy (CSP) for production:
```
default-src 'self';
script-src 'self' 'unsafe-eval' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https: blob:;
font-src 'self' data:;
connect-src 'self' https:;
frame-ancestors 'none';
```

---

## 3. Threat Mitigation Matrix

| Threat Category | Potential Attack | Enforced Defense |
|---|---|---|
| **SQL Injection (SQLi)** | Malicious SQL in enquiry/filter queries | Parameterized queries exclusively via Prisma ORM; zero raw SQL strings. |
| **Cross-Site Scripting (XSS)** | Injected JavaScript inside client messages | React JSX auto-escaping, string trimming, and Zod string sanitization. |
| **Cross-Site Request Forgery (CSRF)** | Unauthorized state mutations | SameSite=Lax/Strict HTTP-only cookies and CSRF verification tokens on sensitive mutations. |
| **Brute Force & DoS** | Credential stuffing on `/admin/login` | Sliding-window IP rate limiting via Upstash Redis or Edge KV. Max 5 attempts per 15m. |
| **Data Scraping & Form Spam** | Automated bot enquiry flooding | Hidden honeypot fields, Cloudflare Turnstile verification, and IP hash throttling. |
| **Privilege Escalation** | Admin route tampering | Next.js Edge Middleware intercepts `/admin/*`, validating cryptographically signed sessions before page rendering. |
| **OTP Brute Force** | Rapid sequence guessing of 6-digit codes | Cryptographic SHA-256 HMAC storage, maximum 5 attempts lockout, 60s cooldown, constant-time `crypto.timingSafeEqual`. |
| **Credential / Log Leakage** | Database or SMTP passwords printed in stack traces | Catch blocks intercept database & SMTP errors, masking credentials and recipients prior to console output. |
| **Weak Production Credentials** | Development dummy secrets deployed to production | `validateAppEnvironment()` strictly blocks localhost DB strings, placeholder auth secrets, and test SMTP passwords in `production`. |

---

## 4. Cryptographic OTP Verification Policies

1. **Generation:** Cryptographically secure 6-digit numerical codes using `crypto.randomInt(100000, 1000000)`.
2. **Hash Storage:** Tokens are hashed using HMAC-SHA256 with an isolated salt and server-side pepper (`OTP_PEPPER`). The plain-text code is NEVER persisted to the database.
3. **Expiration Window:** Strict 5-minute lifespan (`expiresAt = now + 5m`). Expired tokens are immediately invalidated.
4. **Lockout Policy:** Maximum 5 verification attempts. On the 5th failed attempt, the token is permanently locked (`isUsed: true`), requiring a new issuance.
5. **Anti-Spam Cooldown:** 60-second cooldown between issuances (`resendAvailableAt = now + 60s`).
6. **Single-Use Consumption:** Successful verification instantly sets `isUsed: true` and marks `verifiedAt: now`, preventing replay attacks.
7. **Purpose Isolation:** Tokens issued for `LOGIN` cannot be verified for `PASSWORD_RESET` or other scopes.
8. **Invalidation:** Requesting a new OTP for `(identifier, purpose)` immediately invalidates all prior unconsumed tokens for that pair.

---

## 5. Administrator Password Hashing & Bootstrapping

1. **Hashing Algorithm:** Uses Node.js built-in `crypto.scryptSync` with a unique 16-byte cryptographically random salt (`crypto.randomBytes(16)`).
2. **Storage Format:** Stored in the database as `<hex_salt>:<hex_hash>`.
3. **Verification:** Constant-time verification using `crypto.timingSafeEqual` prevents timing side-channel attacks.
4. **Zero Plaintext Storage:** Neither the initial bootstrap password (`ADMIN_PASSWORD`) nor any user-entered password is ever stored or logged in plaintext.

---

## 6. Environment Configuration & Credential Readiness Protocol

1. **Local Isolation:** `.env` is local-only and strictly ignored by Git via `.gitignore`.
2. **No Credentials in Chat:** Users should never paste production database passwords, SMTP app passwords, or API keys into AI assistant chats. Enter them directly into the local `.env` file.
3. **Cryptographic Key Generation:** `AUTH_SECRET` and `OTP_PEPPER_SECRET` are generated using 256-bit cryptographically secure pseudorandom generators (`crypto.randomBytes(32).toString('hex')`).
4. **Automated Validation:** `src/config/env.ts` validates all environment variables at application startup via Zod.
5. **Deprecations:** Legacy Phase 1 placeholders (`EMAIL_PROVIDER_API_KEY`, `EMAIL_FROM`, `ENQUIRY_NOTIFICATION_RECIPIENT`) are deprecated and removed in favor of standard Nodemailer SMTP (`SMTP_*`).

---

## 7. Security Incident Response
Any identified vulnerabilities should be reported directly to `voidtechsolutionsupport@gmail.com`. Patches are prioritized and released following strict semantic versioning and verification test suites.

---

## 8. Phase 6: Inbound Lead Intake Security Controls

### A. Honeypot Bot Detection Trap
A hidden input field (`website_url`) is placed within `<ContactEnquiryForm />` with inline styling `display: none`, `tabIndex: -1`, and `autoComplete: "off"`. Legitimate users cannot see or interact with this field. Automated scrapers and spam bots inspecting form DOM nodes routinely populate all inputs.
- Fast-check rejection: `submitEnquiryAction` detects non-empty honeypots upfront prior to schema evaluation, logging a security warning and rejecting the submission silently without disclosing validation rules.

### B. Token-Bucket Rate Limiting (`src/server/security/rate-limiter.ts`)
Inbound requests to `submitEnquiryAction` and `POST /api/enquiries` are gated by a token-bucket rate limiter tracking `${clientIp}:${email}`:
- **Rate Limit:** 5 requests per 10 minutes.
- When exceeded, returns HTTP 429 Too Many Requests with exact `resetInSeconds` cooldown duration.

### C. SHA-256 Duplicate Submission Fingerprinting
To prevent accidental double-clicks or rapid resubmissions of identical content:
- Generates a cryptographic digest: `SHA-256(email + ":" + message + ":" + package)`.
- Enforces an active 60-second cooldown window. Identical submissions within 60s receive a friendly notice that their enquiry is already under review.

### D. Safe Error Handling & Resilience
In the event of database connectivity interruption (such as during cold starts or remote connection pool resets):
- Server action catches the write failure and returns a safe, unprivileged error message.
- Zero connection strings, database hosts, or internal stack traces are returned to the client or rendered in error alerts.
- Prospect input data is completely preserved on the client form with an accessible "Retry Submission" button and mailto fallback.

---

## 9. Phase 7: Administrative Authentication & Session Security Architecture

### A. Dual-Layer Session Verification (Edge + Database)
1. **Layer 1 — Edge Middleware Early Rejection (`src/middleware.ts`):**
   - Inspects `vts_session` cookie signed via Web Crypto API HMAC-SHA256 (`crypto.subtle`).
   - Acts as an early rejection filter with sub-millisecond network edge performance.
   - **Crucial Security Boundary:** Edge HMAC verification is **NOT** proof of current authorization; it solely confirms the token has not expired cryptographically and was signed with `AUTH_SECRET`.
2. **Layer 2 — Server-Side Authoritative Database Validation (`src/server/security/session.ts`):**
   - Authoritative verification queries `admin_sessions` in PostgreSQL via the token's SHA-256 hash.
   - Verifies session row exists in the database (not revoked).
   - Enforces **Absolute Session Lifetime: 8 hours** (`expiresAt`).
   - Enforces **Server-Side Idle Timeout: 30 minutes** (`Date.now() - lastActiveAt > 30 min`).
   - Enforces **Account Active Status** (`user.isActive === true`).
   - Resolves the administrator's authoritative role directly from the database row.

### B. Cookie Security & XSS Boundaries
- **Cookie Attributes:** `HttpOnly: true`, `Secure: true` in production, `SameSite: "lax"`, `Path: "/"`, `Max-Age: 28800` (8 hours).
- **XSS Limits & Clarification:** `HttpOnly` prevents client-side JavaScript (`document.cookie`) from reading the raw session token. However, `HttpOnly` does not prevent request-hijacking attacks if an XSS vulnerability exists. Therefore, deep defenses include context-aware output encoding (React JSX automatic HTML escaping), strict Zod schema validation on all inputs, strict Content Security Policy (CSP), and independent server-side authorization checks on all actions.

### C. CSRF & Origin Validation (`src/server/security/origin.ts`)
- `SameSite=Lax` is reinforced with explicit server-side Origin verification for all state-changing mutations (Server Actions, POST requests).
- **Authoritative Trusted Host Allowlist:** `validateRequestOrigin` resolves trusted hostnames strictly from configuration (`NEXT_PUBLIC_SITE_URL`, `APP_URL`, `ALLOWED_HOSTS`) with local development defaults (`localhost:3000`, `127.0.0.1:3000`).
- **Host Header Injection Defense:** The incoming host header is matched against the authoritative allowlist. An attacker cannot bypass CSRF defense by spoofing both `Host` and `Origin` headers to an arbitrary attacker-controlled domain.
- **Reverse Proxy Boundaries:** The `x-forwarded-host` header is ONLY evaluated when `trustProxy` is explicitly enabled (e.g. `TRUST_PROXY=true` behind a verified reverse proxy like Cloudflare, AWS ALB, or Vercel). In direct-to-origin or unconfigured setups, client-supplied `x-forwarded-host` headers are completely ignored, falling back safely to the direct `Host` header.
- **Strict Origin/Referer Requirement:** State-changing mutations without an `Origin` or `Referer` header are rejected. Cross-origin origins are strictly blocked.

### D. Session Rotation, Revocation & Write Amplification Defense (`src/server/security/session.ts`)
- **Raw Token Isolation:** 256-bit cryptographically secure raw tokens NEVER enter the database. Only deterministic SHA-256 hashes (`sessionToken`) are persisted in PostgreSQL.
- **Client & Log Sanitization:** Session tokens and secrets never enter console logs, audit logs, or client-side JSON response payloads.
- **Database Write Amplification Protection:** To avoid saturating PostgreSQL connection pools (PgBouncer, Neon) during continuous administrative activity, session `lastActiveAt` database updates are throttled via `TOUCH_INTERVAL_MS = 5 * 60 * 1000` (5 minutes). A user performing dozens of actions per minute triggers at most one write per 5 minutes, reducing database write volume by over 90% while strictly enforcing the 30-minute idle timeout window.
- **Session Rotation:** Session tokens are rotated immediately upon successful login.
- **Revocation on Logout:** Calling `logoutAction` / `revokeAdminSession` deletes the session row from `admin_sessions` and clears the cookie.
- **Session Revocation on Privilege & Credential Changes:**
  - Password updates (`updateAdminPassword`) immediately purge all active sessions for the user (`DELETE FROM admin_sessions WHERE userId = ?`), preventing hijacked cookies from remaining active.
  - Role modifications (`updateAdminRole`) immediately purge all active sessions for the user, forcing re-authentication with updated privileges.
  - Account deactivations (`setAdminActiveStatus(false)`) purge all active sessions in PostgreSQL, and any lingering session attempt is immediately blocked by `validateAdminSession` with `USER_INACTIVE`.

### E. Rate Limiting Assessment & Production Architecture (`src/server/security/rate-limiter.ts`)
- **Process-Local Memory:** The sliding-window rate limiter is stored in Node.js process memory (`Map<string, RateLimitRecord>`).
- **Serverless / Multi-Instance Limitation:** In multi-instance or serverless deployments (such as Vercel Edge / Lambda functions or multi-container clusters), this memory is NOT shared across distributed instances.
- **Process Lifetime:** Counters reset whenever a process restarts, cold-starts, or scales.
- **Production Requirement:** While fully sufficient for local development, CI test runners, and single-container execution, process-local rate limiting is **NOT** sufficient as the sole brute-force defense in multi-instance production. Production multi-instance deployments require a shared distributed store (such as Upstash Redis or Vercel KV) or edge-tier infrastructure rate limiting (Cloudflare Rate Limiting, AWS WAF).

---

## 10. Approved Administrative Role-Based Access Control (RBAC) & Single SUPER_ADMIN Governance

### A. Approved Three-Role Model
The approved administrative access model is restricted strictly to three defined roles:
1. `SUPER_ADMIN`: Unrestricted platform governance, role assignment, administrator account management, lead deletion, and audit log inspection.
2. `ADMIN`: Technical and operational management (lead status updates, service catalog management, pricing management, case study publishing, site settings). No lead deletion or administrator account management permissions.
3. `EDITOR`: Content editing privileges (portfolio updates, FAQ management, service copywriting). Read-only access to inbound enquiries; zero administrative settings or user management permissions.
*No additional or unapproved roles (such as SUPPORT or VIEWER) exist within the system or database schema.*

### B. Single Shared Login Portal Architecture
- **Single Entry Point:** There is exactly ONE shared authentication portal: `/admin/login`.
- **Zero Role Bifurcation:** `SUPER_ADMIN`, `ADMIN`, and `EDITOR` authenticate through this identical login page and shared authentication action (`loginAction`).
- **No Role Enumeration:** The login interface provides zero visual clues as to account existence or role. All authentication failures return identical, generic error messages (*"Invalid email or password"*).
- **Post-Login Routing & Ergonomic Views:** Upon authentication, the administrator is redirected to `/admin`. The dashboard layout and navigation sidebar dynamically adapt to the user's authoritative role:
  - `SUPER_ADMIN` views full management suite (Administrators, Audit Logs, Settings, Enquiries with Delete, Services, Pricing, Portfolio, FAQs).
  - `ADMIN` views operational management (Enquiries status updates, Services, Pricing, Portfolio, FAQs). Administrative management and audit trails are hidden.
  - `EDITOR` views content curation (Portfolio, FAQs, Services copywriting, Read-only enquiries). Administrative management, pricing, settings, and audit trails are hidden.
- **Authoritative Server-Side RBAC Enforcement:** Client UI adaptation is purely for user experience. Every Server Action, Route Handler, and mutation independently verifies `requirePermission(user, permission)` against the database record.

### C. SUPER_ADMIN Exclusive Account Governance
- **Account Provisioning:** Only `SUPER_ADMIN` can create new `ADMIN` and `EDITOR` accounts.
- **Role Assignment:** Only `SUPER_ADMIN` can assign, promote, or alter account roles.
- **Account Lifecycle:** Only `SUPER_ADMIN` can activate or deactivate administrator accounts.
- **Session Revocation:** Only `SUPER_ADMIN` can trigger global session revocation for another administrator.
- **Password Resets:** Only `SUPER_ADMIN` can initiate administrator password reset procedures.
- **Audit Log Inspection:** Only `SUPER_ADMIN` can view sensitive security and administrative audit logs (`audit_logs:view`).
- **Lead Deletion:** Only `SUPER_ADMIN` can permanently purge inbound project enquiries (`enquiries:delete`).

### D. Non-Escalation & Privilege Ceiling Invariants
- **Non-Super-Admin Prohibition:** Neither `ADMIN` nor `EDITOR` can create administrator accounts, modify roles, or activate/deactivate accounts.
- **Self-Role Modification Prevention:** No administrator (including `SUPER_ADMIN`) can alter their own role. Role elevation or demotion requires external administrative intervention.
- **Privilege Ceiling:** An administrator can never assign a role equal to or higher than their own authority level.
- **Authoritative Database Verification:** Permissions and roles are loaded directly from PostgreSQL on every authenticated request; client-supplied role values in request payloads are strictly discarded.

### E. Exactly One SUPER_ADMIN Invariant & Concurrency Protection
- **Business Invariant:** The platform strictly enforces **EXACTLY ONE SUPER_ADMIN account** across the entire lifecycle of the system.
- **Bootstrap-Only Creation:** Only the initial controlled CLI provisioning script (`scripts/create-admin.ts`) holding `isBootstrap: true` can create the `SUPER_ADMIN`. If a `SUPER_ADMIN` already exists in PostgreSQL, the script aborts with `ExactlyOneSuperAdminError`.
- **Standard Account Creation Safeguard:** Active `SUPER_ADMIN` accounts can provision `ADMIN` and `EDITOR` roles only. Creating another `SUPER_ADMIN` via standard user creation is unconditionally rejected.
- **Promotion Prohibition:** No account (`ADMIN` or `EDITOR`) can promote themselves or another user to `SUPER_ADMIN`.
- **Self-Modification Block:** The `SUPER_ADMIN` cannot modify their own role, deactivate their own account, or delete their own master account.
- **Master Account Immutability:** Deletion, demotion, or deactivation of the master `SUPER_ADMIN` is strictly rejected across all repository methods, Server Actions, and API route handlers (`SoleSuperAdminProtectionError`).
- **PostgreSQL Advisory Locking:** Count-then-update logic is concurrency-hardened using PostgreSQL transaction advisory locks (`SELECT pg_advisory_xact_lock(hashtext('super_admin_lifecycle_lock'))`) inside `prisma.$transaction`. Sensitive operations are fully serialized, and failed transactions roll back 100% of mutations without leaving orphan state.

### F. Initial SUPER_ADMIN Bootstrap Protocol
- **Controlled CLI Bootstrap:** Initial bootstrapping is executed exclusively via an interactive CLI tool (`npx tsx scripts/create-admin.ts`).
- **Zero Public Registration:** No public-facing user registration or sign-up endpoint exists.
- **Zero Automatic Seeding:** `prisma/seed.ts` is strictly prohibited from creating administrator accounts.
- **Zero Hardcoded Credentials:** No default credentials in repository code or `.env` templates.
- **Password Complexity & Scrypt:** Interactive prompts enforce strong password requirements (min 12 chars with symbol/number/case variety), hashed via scrypt with a unique 16-byte random salt.
- **Forced Password Rotation:** First-time login flags can enforce an immediate password change on initial sign-in.
- **Audit Logging:** The bootstrap event is recorded immutably in `AuditLog` (`action: "ADMIN_BOOTSTRAP_SUCCESS"`).

---

## 7. Edge Route Protection & Open Redirect Defense (Milestone 7.4)

### A. Next.js Edge Middleware Security Model (`src/middleware.ts`)
- **First Line of Defense:** Edge Middleware intercepts all requests matching `/admin/:path*` and `/api/admin/:path*`.
- **Zero Database Overhead in Edge Runtime:** Signature verification is performed exclusively using standard Web Crypto API (`crypto.subtle`) HMAC-SHA256 implemented in an isolated module (`src/server/security/cookie.ts`) with zero Prisma or Node.js native dependencies.
- **Early Rejection Filtering:**
  - Tampered, expired, or missing `vts_session` cookies redirect UI visitors to `/admin/login?callbackUrl=...`.
  - Unauthenticated callers to `/api/admin/*` receive HTTP 401 Unauthorized with `{ error: "...", code: "UNAUTHORIZED_ADMIN_SESSION" }`.
  - Authenticated administrators visiting `/admin/login` are automatically redirected to their intended destination or `/admin`.
- **Authoritative Database Verification:** Middleware serves as a fast rejection filter only. All Server Components, Server Actions, and Route Handlers independently verify PostgreSQL database records, idle timeouts (30 min), absolute expirations (8 hrs), and active account status via `getCurrentAdmin()` and `requirePermission()`.
- **HTTP Security Headers:** Injected on all Edge middleware responses:
  - `X-Frame-Options: DENY` (Clickjacking mitigation)
  - `X-Content-Type-Options: nosniff` (MIME-sniffing prevention)
  - `Referrer-Policy: strict-origin-when-cross-origin` (Referrer leakage protection)
  - `X-Permitted-Cross-Domain-Policies: none` (Flash / PDF boundary protection)

### B. Open Redirect Prevention (`sanitizeCallbackUrl`)
- **Strict Relative Path Invariant:** Return URLs (`callbackUrl`) passed during unauthenticated redirects are strictly validated:
  - Must begin with a single forward slash (`/`).
  - Protocol-relative URLs (`//evil.com`) are unconditionally rejected.
  - Windows backslash bypasses (`/\evil.com`) are unconditionally rejected.
  - Control characters (CR `\r`, LF `\n`, Tab `\t`) are stripped to prevent HTTP response splitting.
  - Absolute URI schemes (`javascript:`, `data:`, `https:`, `ftp:`) are unconditionally rejected.
  - Fallback: Invalid or malicious URLs safely default to `/admin`.

### C. Single Shared Login UI & Anti-Enumeration
- **Unified Portal:** Exactly ONE authentication portal at `/admin/login` serves all three roles (`SUPER_ADMIN`, `ADMIN`, `EDITOR`).
- **Timing-Safe Generic Responses:** Authentication failures return an identical generic alert (*"Invalid email or password."*) whether the email does not exist, the account is deactivated, or the password was incorrect.
- **Client & Server Redirection Guard:** Both Edge middleware and Server Component `AdminLoginPage` evaluate session state, preventing authenticated users from viewing or submitting the login form.

---

## 8. Secure SUPER_ADMIN Bootstrap CLI & Audit Logging Engine (Milestone 7.5)

### A. Controlled Bootstrap CLI Architecture (`scripts/create-admin.ts`)
- **Explicit Operator Action Required:** The initial master account can only be created by manually running `npm run admin:create`. No automated execution during installation, container builds, or database seeding.
- **Hidden Terminal Input & Strict Interactive TTY Enforcement:**
  - Passwords and confirmations are typed invisibly using raw terminal mode (`process.stdin.setRawMode(true)`), suppressing all character echoing.
  - **Strict TTY Requirement:** Hidden input strictly requires an interactive TTY terminal. If stdin is piped, redirected, or running in a headless non-TTY environment, the script aborts immediately with exit code 1 (`NonInteractiveTerminalError`) before prompting for credentials.
  - **Zero Visible Fallback:** Visible `readline` input is **never** used as a fallback for passwords.
  - **Safe Terminal Mode Restoration:** Terminal raw mode and echo settings are reliably restored upon Enter, Backspace, Ctrl+C (`\u0003`), unhandled errors, and process termination via a registered exit handler and `finally` semantics.
  - **Zero Memory or Environment Exposure:** Passwords are not accepted via CLI arguments or environment variables. Credentials in memory are zeroed immediately after hash derivation.
- **Strict Master Password Standard:** Enforces minimum 12 characters with mandatory uppercase, lowercase, digit, and symbol character sets (`bootstrapInputSchema`).
- **Cryptographic Key Derivation:** Uses Node.js native `crypto.scryptSync` with a unique 16-byte random salt and 64-byte derived key.
- **Advisory Transaction Lock Serialization:**
  - `SELECT pg_advisory_xact_lock(hashtext('super_admin_lifecycle_lock'))` fully serializes concurrent bootstrap attempts.
  - Re-evaluates `count(where: { role: 'SUPER_ADMIN' })` inside the lock.
  - If count > 0, throws `ExactlyOneSuperAdminError` and aborts.
- **Sanitized Failure Reporting:** Connection errors strip database URLs and passwords (`[REDACTED_CREDENTIALS]`), ensuring operator logs never leak credentials.

### B. Centralized Append-Only Audit Logging Engine (`src/server/security/audit.ts`)
- **Audit Log Integrity Taxonomy & Realistic Security Boundaries:**
  - **1. Application-Level Append-Only Enforcement:** The audit engine exposes strictly creation (`recordAuditEvent`, `createAuditLog`) and read-only query methods (`getAuditHistory`, `getAuditLogById`). Zero update, edit, truncate, or delete functions exist in the application runtime.
  - **2. Database-Level Protections & Historical Record Preservation:** The `AuditLog` Prisma model stores scalar strings for `actorId` and `actorEmail` without cascading foreign keys (`onDelete: Cascade`), guaranteeing audit records persist permanently even if an administrator account is deleted. In production, database roles should revoke destructive privileges: `REVOKE UPDATE, DELETE, TRUNCATE ON TABLE "audit_logs" FROM app_role;`.
  - **3. Protection Against Unrestricted Database Administrators:** Application-level and table-level controls protect against application vulnerabilities and compromised web sessions. However, an unrestricted database administrator (PostgreSQL superuser, Neon console administrator, or cloud account owner) with direct SQL access can bypass table rules. Therefore, absolute tamper-proofing is **not** claimed at the application or local database layer alone. True high-assurance audit immutability in production requires external forward-secure logging (e.g. WORM storage, AWS S3 Object Lock, external syslog aggregation to Datadog/CloudWatch, or cryptographic hash-chained ledgers).
- **Automated Credential Redaction (`sanitizeAuditDetails`):**
  - All audit details payloads undergo recursive sanitization before insertion.
  - Sensitive keys (`password`, `passwordHash`, `rawToken`, `sessionToken`, `secret`, `cookie`, `otp`, `databaseUrl`, etc.) are automatically scrubbed and replaced with `"[REDACTED]"`.
  - Recursion depth is capped at 6 levels to defend against circular or oversized payload DoS.
- **Transactional Consistency:** `recordAuditEvent` accepts an optional `Prisma.TransactionClient`, enabling atomic state mutations where administrative actions and their audit logs commit or roll back together.

---

## 9. Authenticated Admin Route & Server-Side RBAC Enforcement Architecture

### A. Three-Tier Defense-in-Depth Model
The admin console enforces defense-in-depth across three architectural layers:

1. **Layer 1: Edge Route Protection Middleware (`src/middleware.ts`):**
   - Intercepts all requests matching `/admin/:path*` and `/api/admin/:path*`.
   - Performs low-latency HMAC-SHA256 signature verification on the `vts_session` cookie at the Edge.
   - Redirects unauthenticated UI requests to `/admin/login?callbackUrl=...` with open-redirect sanitization.
   - Rejects unauthenticated API calls with HTTP 401 Unauthorized.
   - Acts as a high-speed rejection barrier; does not evaluate role-based granular permissions.

2. **Layer 2: Server Component Page-Level Access Gate:**
   - Every administrative dashboard page Server Component independently calls `getCurrentAdmin()` and evaluates `hasPermission(role, requiredPermission)` prior to executing any repository queries or rendering content.
   - When unauthorized, the page immediately short-circuits and renders `<AdminAccessDenied />` with an HTTP 403 Forbidden state badge, active role indicator, and required permission badge.
   - **Zero-Data Leakage Guarantee:** Repository queries (`getAllAdmins`, `getRecentAuditLogs`, `getAllSettings`, `getAllPricingPackages`) are strictly bypassed when permission is denied, ensuring zero sensitive records are queried from PostgreSQL or serialized into the React Server Component payload.

3. **Layer 3: Authoritative Server Action & Repository-Level Enforcement:**
   - All mutations dispatched via Server Actions (`createAdminUserAction`, `updateAdminRoleAction`, `setAdminStatusAction`, `deleteAdminUserAction`, `updateEnquiryStatusAction`, `deleteEnquiryAction`, `updateSiteSettingAction`, `toggleServiceActiveAction`, `createFaqAction`, `togglePricingPackageActiveAction`) independently enforce:
     - Request origin validation (`validateRequestOrigin`) to prevent cross-origin state-changing attacks (CSRF).
     - Authoritative session resolution and PostgreSQL active status check (`getCurrentAdmin()`).
     - Granular permission requirement (`requirePermission(user, permission)`).
   - Direct repository methods (`createAdminUser`, `updateAdminRole`, `deleteAdminUser`, etc.) independently re-verify actor permissions and enforce business invariants (Sole SUPER_ADMIN protection, Exactly-One-SUPER_ADMIN invariant, Self-modification prevention).
   - If an unauthorized mutation is attempted, the repository/action throws an `AuthorizationError` (HTTP 403) or returns a generic failure. The database record remains completely unmodified, and zero audit logs are generated.

### B. Authoritative 11-Operation RBAC Matrix
The platform strictly implements the owner-approved three-role hierarchy:

| Operation | Required Permission | SUPER_ADMIN | ADMIN | EDITOR |
| :--- | :--- | :---: | :---: | :---: |
| Overview Dashboard | `dashboard:view` | Allowed | Allowed | Allowed |
| User Provisioning & Roles | `admins:manage` | Allowed | **DENIED (403)** | **DENIED (403)** |
| Audit Trail Inspection | `audit_logs:view` | Allowed | **DENIED (403)** | **DENIED (403)** |
| Platform Settings | `settings:manage` | Allowed | **DENIED (403)** | **DENIED (403)** |
| View Client Enquiries | `enquiries:view` | Allowed | Allowed | Allowed (Read-Only) |
| Update Enquiry Status/Notes | `enquiries:update_status` | Allowed | Allowed | **DENIED (403)** |
| Delete Client Enquiries | `enquiries:delete` | Allowed | **DENIED (403)** | **DENIED (403)** |
| Services Catalog Management | `services:manage` | Allowed | Allowed | Allowed |
| Pricing Tier Management | `pricing:manage` | Allowed | Allowed | **DENIED (403)** |
| Portfolio Showcase Management | `portfolio:manage` | Allowed | Allowed | Allowed |
| FAQ Knowledgebase Management | `faqs:manage` | Allowed | Allowed | Allowed |

### C. Inactive Administrator & Session Invalidation
- **Instant Invalidation:** Account deactivation (`isActive: false`) or deletion immediately invalidates active sessions. On subsequent requests, `validateAdminSession` verifies the PostgreSQL user record and rejects deactivated accounts with `USER_INACTIVE`.
- **Session Revocation:** Triggering `revokeAdminSession(cookie)` removes the session from PostgreSQL, resulting in immediate `SESSION_NOT_FOUND` rejections on subsequent requests.
- **Sliding-Window Idle Timeout (30 min):** Enforced via PostgreSQL `lastActiveAt`. Requests idle for > 30 minutes are rejected with `IDLE_TIMEOUT`.
- **Absolute Session Lifetime (8 hr):** Absolute expiration enforced via `expiresAt`. Sessions older than 8 hours are rejected with `ABSOLUTE_TIMEOUT`.
- **Credential Scrubbing in User Management:** `getAllAdmins` returns `SafeAdmin` objects strictly omitting `passwordHash` and `sessionToken` fields, preventing credential exposure to administrative interfaces.

---

## 11. Phase 9 CRM Lead Pipeline Security & Data Isolation

### A. Optimistic Concurrency Control (OCC)
In multi-admin environments, concurrent status or stage edits risk silent state overwrites. `updateEnquiryStatus` enforces OCC:
- The mutation checks `options.expectedUpdatedAt` against the PostgreSQL record's `updatedAt` timestamp.
- If another admin updated the lead within the editing interval (> 1000ms drift), the update is aborted and raises `ConcurrencyConflictError`.
- Eliminates lost updates on commercial lead records.

### B. Single Active Assignment Invariant
- Lead ownership race conditions are prevented at the database level by a PostgreSQL partial unique index:
  `CREATE UNIQUE INDEX "lead_assignments_single_active_unique" ON "lead_assignments"("enquiryId") WHERE "isActive" = true;`
- Reassignment transactions in `assignLeadToAdmin` atomically set previous active records to `isActive = false` before inserting the new assignment, preventing multiple concurrent claims.

### C. Recipient Notification Isolation
- In-app administrative notifications (`AdminNotification`) are strictly isolated by `recipientId` across all repository methods:
  - `getAdminNotifications` enforces `where: { recipientId }`.
  - `getUnreadNotificationCount` enforces `where: { recipientId, isRead: false }`.
  - `markNotificationAsRead` validates that the notification record belongs to the calling administrator before updating.
- Cross-admin data leakage is prevented at both the database query and application layers.

### D. Safe Admin Relational Projection
- When hydrating lead relations via `getEnquiryById` or `getEnquiries`, administrator relations (`assignedAdmin`, `author`, `admin`) strictly project only `{ id, name, email, role, isActive }`.
- `passwordHash` and active session tokens are excluded by design from all CRM relational hydration.

### E. Internal Note Confidentiality
- `LeadNote` records are internal-only artifacts accessible exclusively to authenticated administrators within the `/admin` route group.
- Internal notes are never exposed in public endpoints (`/api/enquiries`), public enquiry confirmation emails, or client-facing responses.

### F. Phase 9.2 CRM Server Action RBAC Matrix
Every CRM mutation at `/admin/crm` verifies the caller's session and permissions via `requirePermission`:
- `enquiries:view`: `SUPER_ADMIN`, `ADMIN`, `EDITOR` (Read-only Kanban board, drawer inspection, metrics)
- `enquiries:update_status`: `SUPER_ADMIN`, `ADMIN` (Stage transitions, note additions, follow-up scheduling, assignments; `EDITOR` rejected)
- `enquiries:delete`: `SUPER_ADMIN` only (Permanent note and follow-up deletion; `ADMIN` & `EDITOR` rejected)

### G. Client-Side Rollback & Concurrency UX Safety
- When a stage update conflict is detected (`CONFLICT_DETECTED`), the client-side state machine rolls back optimistic UI changes to prevent false visual confirmation.
- The UI surfaces a distinct amber warning alert with a "Refresh Board" trigger to load the canonical state without page reloads.

---

## 12. Phase 9.3 Security Validation & Access Audit

### A. Empirical RBAC Enforcement
The CRM security matrix was independently validated through 19 integration tests (`tests/integration/crm-rbac-security.integration.test.ts`):
- **SUPER_ADMIN:** Authorized for all operations including administrative deletions of notes and follow-ups.
- **ADMIN:** Authorized for day-to-day CRM operations (moving stages, adding notes, scheduling tasks, assigning leads). Explicitly denied deletion rights for notes and follow-ups.
- **EDITOR:** Granted read-only visibility for triage and review. Any mutation attempt via Server Action or API returns `Forbidden: Insufficient permissions (requires 'enquiries:update_status')`.

### B. Notification Isolation Invariant
- Notifications are strictly addressed and queried by `recipientId`.
- An administrator cannot view or acknowledge another administrator's notifications, preventing internal leakage of sensitive assignment data or client notes.

### C. Origin & Session Integrity
- Mutations validate incoming HTTP headers against `host` and `origin` to defeat Cross-Site Request Forgery (CSRF).
- Tampered session cookies or invalid HMAC signatures trigger immediate 401 rejections at Edge middleware and Server Action verification layers.





