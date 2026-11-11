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
- `SameSite=Lax` is reinforced with explicit server-side Origin verification.
- All state-changing administrative operations are restricted strictly to HTTP POST Server Actions. No mutations are permitted via GET endpoints.
- `validateRequestOrigin` verifies incoming `Origin` (with `Referer` fallback) against the authoritative request `Host`.

### D. Session Rotation & Revocation Lifecycle
- **Rotation:** Session tokens are rotated immediately upon successful authentication.
- **Revocation on Logout:** Session row is deleted from `admin_sessions` and client cookie is cleared.
- **Global Revocation:** Deactivating an account or resetting credentials revokes all active sessions for that user (`DELETE FROM admin_sessions WHERE userId = ?`).

