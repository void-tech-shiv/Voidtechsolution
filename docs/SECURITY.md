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

### E. Sole Active SUPER_ADMIN Protection Invariant
- **System Invariant:** The database MUST always contain at least one active, enabled `SUPER_ADMIN` account.
- **Atomic Pre-Condition Check:** Before executing any account deactivation (`isActive = false`), deletion, or role demotion on a `SUPER_ADMIN`, the system queries:
  ```typescript
  const activeSuperAdmins = await prisma.adminUser.count({
    where: { role: "SUPER_ADMIN", isActive: true },
  });
  if (activeSuperAdmins <= 1 && targetUser.role === "SUPER_ADMIN") {
    throw new Error("CANNOT_DEACTIVATE_SOLE_SUPER_ADMIN: Operation rejected to prevent administrative lockout.");
  }
  ```
- **Lockout Prevention:** Ensures the platform can never become permanently un-administrable due to accidental self-demotion or mass deactivation.

### F. Initial SUPER_ADMIN Bootstrap Protocol
- **Controlled CLI Bootstrap:** Initial bootstrapping is executed exclusively via an interactive CLI tool (`npx tsx scripts/create-admin.ts`).
- **Zero Public Registration:** No public-facing user registration or sign-up endpoint exists.
- **Zero Automatic Seeding:** `prisma/seed.ts` is strictly prohibited from creating administrator accounts.
- **Zero Hardcoded Credentials:** No default credentials in repository code or `.env` templates.
- **Password Complexity & Scrypt:** Interactive prompts enforce strong password requirements (min 12 chars with symbol/number/case variety), hashed via scrypt with a unique 16-byte random salt.
- **Forced Password Rotation:** First-time login flags can enforce an immediate password change on initial sign-in.
- **Audit Logging:** The bootstrap event is recorded immutably in `AuditLog` (`action: "ADMIN_BOOTSTRAP_SUCCESS"`).

