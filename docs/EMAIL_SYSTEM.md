# VOIDTECH SOLUTION — EMAIL SYSTEM ARCHITECTURE & SMTP SPECIFICATION

**Brand Tagline:** Build. Launch. Grow Online.  
**Phase:** Phase 3 (Database Architecture & Data Layer — Credential Readiness)  
**Provider:** Nodemailer via Standard Secure SMTP  

---

## 1. Executive Overview

The VOIDTECH SOLUTION Email System provides a mission-critical, server-side transactional mailing service built strictly with **Nodemailer** and standard SMTP. It eliminates third-party platform lock-in (e.g. Resend, SendGrid API SDKs) while guaranteeing end-to-end delivery tracking, cryptographic OTP handling, bounded retries for transient connection drops, zero-credential logging, and strict visual fidelity matching the VoidTech charcoal-and-violet design system.

---

## 2. Configuration & Environment Variables

All SMTP configuration is parsed, coercively cast, and validated at runtime using **Zod** (`src/server/email/config.ts` and `src/config/env.ts`).

| Variable | Type | Default | Description | Required in Prod? |
| :--- | :--- | :--- | :--- | :---: |
| `SMTP_HOST` | String | `smtp.voidtechsolution.com` | Outgoing SMTP host server | **YES** |
| `SMTP_PORT` | Number | `587` | Port (e.g. 587 for STARTTLS, 465 for SSL) | **YES** |
| `SMTP_SECURE` | Boolean | `false` | True for port 465, false for 587/STARTTLS | **YES** |
| `SMTP_USER` | String | `mailer@voidtechsolution.com` | Authenticated SMTP username / account | **YES** |
| `SMTP_PASS` | String | None | Authenticated SMTP password or App Password | **YES** |
| `SMTP_FROM_NAME` | String | `VOIDTECH SOLUTION` | Default friendly sender display name | Optional |
| `SMTP_FROM_EMAIL` | Email | `notifications@voidtechsolution.com` | Authenticated outbound sender address | **YES** |
| `ADMIN_ALERT_EMAIL` | Email | `admin@voidtechsolution.com` | Target inbox for inbound lead alerts | **YES** |

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

## 5. Local Credential Setup Guide

### Option A: Gmail SMTP (Recommended for Local Dev & Testing)
1. In your Google Account, enable **2-Step Verification**.
2. Navigate to **Security > 2-Step Verification > App Passwords**.
3. Generate a new App Password named `VoidTech Website`.
4. Copy the generated 16-character password into `.env`:
   ```bash
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="587"
   SMTP_SECURE="false"
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="xxxx xxxx xxxx xxxx" # (spaces can be omitted)
   SMTP_FROM_NAME="VOIDTECH SOLUTION"
   SMTP_FROM_EMAIL="your-email@gmail.com"
   ADMIN_ALERT_EMAIL="your-email@gmail.com"
   ```

### Option B: Professional SMTP Providers (Mailgun, SendGrid, Brevo, AWS SES)
Configure the credentials provided in your provider dashboard:
```bash
SMTP_HOST="smtp.mailgun.org"       # or smtp.sendgrid.net, smtp-relay.brevo.com
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="postmaster@mg.voidtechsolution.com" # or "apikey" for SendGrid
SMTP_PASS="your-provider-smtp-secret-or-api-key"
SMTP_FROM_NAME="VOIDTECH SOLUTION"
SMTP_FROM_EMAIL="notifications@voidtechsolution.com"
ADMIN_ALERT_EMAIL="admin@voidtechsolution.com"
```

---

## 6. Secret Rotation & Hygiene Guidelines

1. **Never Commit `.env`:** The file `.env` is local-only and ignored by `.gitignore`.
2. **App Password Revocation:** If an SMTP app password or API key is ever suspected of compromise, revoke it immediately in the email provider console and generate a fresh key.
3. **No Credential Chat Pasting:** Antigravity and automated agents will never ask you to paste real passwords or secrets into chat. Enter them directly into your local `.env` file.

---

## 7. Phase 6: Enquiry Notification Dispatch Subsystem (`src/server/email/enquiry-mailer.ts`)

In Phase 6, the dedicated transactional enquiry mailer `dispatchEnquiryNotifications(enquiry)` was implemented to handle inbound lead communication:

```typescript
export async function dispatchEnquiryNotifications(
  enquiry: Enquiry,
  customTransporter?: Transporter
): Promise<{ customerEmailSent: boolean; adminEmailSent: boolean }>
```

### Key Architectural Behaviors
1. **Independent Dual Dispatch:** Dispatches both the prospect confirmation email and the internal administrator alert email concurrently.
2. **Error Isolation:** A failure in sending the admin alert (or customer email) does not throw an unhandled exception or abort the other email.
3. **Delivery Audit Tracking:** Both dispatches record delivery status into the `EmailDelivery` database table with sanitized message payloads.
4. **Subject Integrity:**
   - Customer confirmation: `We've Received Your Project Enquiry — VOIDTECH SOLUTION`
   - Admin notification: `New Project Enquiry — VOIDTECH SOLUTION: [Lead Name] [Ref: ...]`
