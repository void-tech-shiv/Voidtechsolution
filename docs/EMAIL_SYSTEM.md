# VOIDTECH SOLUTION — EMAIL SYSTEM ARCHITECTURE & SMTP SPECIFICATION

**Brand Tagline:** Build. Launch. Grow Online.  
**Phase:** Phase 3 (Database Architecture & Data Layer — Closure Audit)  
**Provider:** Nodemailer via Standard Secure SMTP  

---

## 1. Executive Overview

The VOIDTECH SOLUTION Email System provides a mission-critical, server-side transactional mailing service built strictly with **Nodemailer** and standard SMTP. It eliminates third-party platform lock-in (e.g. Resend, SendGrid) while guaranteeing end-to-end delivery tracking, cryptographic OTP handling, bounded retries for transient connection drops, zero-credential logging, and strict visual fidelity matching the VoidTech charcoal-and-violet design system.

---

## 2. Configuration & Environment Variables

All SMTP configuration is parsed, coercively cast, and validated at runtime using **Zod** (`src/server/email/config.ts`).

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `SMTP_HOST` | String | `smtp.voidtechsolution.com` | Outgoing SMTP host server |
| `SMTP_PORT` | Number | `587` | Port (e.g. 587 for STARTTLS, 465 for SSL) |
| `SMTP_SECURE` | Boolean | `false` | True for port 465, false for 587/STARTTLS |
| `SMTP_USER` | String | Required | Authenticated SMTP username / API key |
| `SMTP_PASS` | String | Required | Authenticated SMTP password / secret |
| `SMTP_FROM_NAME` | String | `VOIDTECH SOLUTION` | Default friendly sender display name |
| `SMTP_FROM_EMAIL` | Email | `notifications@voidtechsolution.com` | Authenticated outbound sender address |
| `ADMIN_ALERT_EMAIL` | Email | `admin@voidtechsolution.com` | Target inbox for inbound lead alerts |

> [!SECURITY]
> SMTP credentials (`SMTP_PASS`, `SMTP_USER`) are strictly restricted to the Node.js server runtime. They are never imported or packaged into Next.js client bundles, nor printed to console logs.

---

## 3. Transporter & Delivery Lifecycle

### A. Singleton Transporter (`src/server/email/transporter.ts`)
- Reusable connection pool avoiding socket re-negotiation overhead.
- Explicit health verification hook: `verifySmtpConnection()`.

### B. Bounded Retries & Error Handling (`src/server/email/email.service.ts`)
- Every outbound message attempts up to **3 bounded retries** upon transient connection failures (e.g., `ETIMEDOUT`, `ECONNRESET`).
- Exponential backoff algorithm: `initialBackoffMs * (2 ^ (attempt - 1))`.
- Sanitized error logs: email addresses in error messages are masked (`$1@***`) and database passwords are never captured.

### C. Delivery Audit Tracking (`EmailDelivery` Model)
Every email dispatch creates an immutable audit row in the `EmailDelivery` table:
- **`PENDING`**: Initial record created prior to transporter dispatch.
- **`SENT`**: Successfully handed off to SMTP server with `providerMessageId` and `sentAt` timestamp.
- **`FAILED`**: Maximum retries exhausted; records sanitized `failureCode` and `errorMessage`.

---

## 4. Email Templates Specification

All templates are designed in full alignment with VOIDTECH SOLUTION's dark design tokens:
- **Base Background:** Deep Obsidian Black (`#050507`) & Carbon Charcoal (`#0a0a0f`, `#121218`)
- **Accents & Highlights:** Electric Violet (`#8b5cf6`, `#7c3aed`) and Neon Purple (`#a855f7`)
- **Typography:** High-legibility system stack (`-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`)
- **Dual Format:** Every email generates both high-contrast HTML and clean plain-text representations.

### The 6 Standard System Templates

| # | Template Key | Purpose | Target Recipient | Key Elements |
| :-: | :--- | :--- | :--- | :--- |
| **1** | `OTP_VERIFICATION` | Single-use authentication | User / Admin | 6-digit high-contrast mono code, 5m expiry, anti-phishing notice |
| **2** | `PASSWORD_RESET` | Credential recovery | User / Admin | Direct action CTA button, raw URL fallback, 15m expiry window |
| **3** | `ENQUIRY_CONFIRMATION` | Inbound lead acknowledgement | Client Prospect | Service category summary, 24h SLA review guarantee, ticket ref ID |
| **4** | `ENQUIRY_ADMIN_ALERT` | Internal lead dispatch | Agency Admin | Full lead brief: name, email, phone, company, budget, timeline, message |
| **5** | `ENQUIRY_STATUS_UPDATE` | Lifecycle state progress | Client Prospect | Status transition pill badge, previous state, architect notes |
| **6** | `SECURITY_NOTIFICATION` | Security anomaly detection | User / Admin | Event type, ISO timestamp, origin IP, user agent, system action |

---

## 5. Verification & Testing

The email system is comprehensively covered by automated Vitest unit tests in `tests/unit/email.test.ts`:
- Environment variable validation & negative schema failure tests.
- Mocked SMTP connection verification.
- Template rendering checks verifying VoidTech branding, slogans, and plain-text fallback content.
- Mocked successful delivery tracking (`PENDING` -> `SENT`).
- Transient failure retry loop verification with exponential backoff.
- Permanent delivery exhaustion error handling (`PENDING` -> `FAILED`).
