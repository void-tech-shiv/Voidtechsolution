# API_DOCUMENTATION.md — Backend Endpoints & Server-Side Services Specification

## 1. API Architecture Principles
- **Base URL:** `/api`
- **Protocol:** HTTPS (Strict JSON request/response formats)
- **Status Codes:** Standard HTTP semantics (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `429 Too Many Requests`, `500 Internal Error`).
- **Response Format:** Uniform `ApiResponse<T>` envelope across all endpoints.

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}
```

---

## 2. Implemented Endpoints

### `GET /api/health`
Health check route handler verifying system uptime, environment, and deployment readiness.

- **Access:** Public
- **Cache-Control:** `no-store, max-age=0`
- **Response Example (200 OK):**
```json
{
  "success": true,
  "data": {
    "service": "VOIDTECH SOLUTION API",
    "status": "healthy",
    "version": "0.1.0",
    "milestone": "Phase 1: Foundation",
    "timestamp": "2026-11-11T17:48:00.000Z",
    "uptimeSeconds": 142,
    "environment": "development"
  },
  "meta": {
    "timestamp": "2026-11-11T17:48:00.000Z"
  }
}
```

---

## 3. Server-Side Service APIs (Phase 3 Implemented)

### A. Reusable Nodemailer Transactional Email Service (`src/server/email/`)

#### `sendEmail(options: SendEmailOptions): Promise<SendEmailResult>`
Dispatches an email with automated `EmailDelivery` database tracking and bounded retries.
```typescript
interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  templateName?: string;
  replyTo?: string;
  maxRetries?: number;
  initialBackoffMs?: number;
}
```

#### Typed Dispatchers:
- `sendOtpEmail(to, { code, recipientName, purpose, expiresInMinutes })`
- `sendPasswordResetEmail(to, { resetUrl, recipientName, expiresInMinutes })`
- `sendEnquiryConfirmationEmail(to, { recipientName, serviceTitle, enquiryId })`
- `sendEnquiryAdminAlertEmail({ enquiryId, prospectName, email, phone, companyName, serviceCategory, budgetRange, timeline, message })`
- `sendEnquiryStatusUpdateEmail(to, { recipientName, enquiryId, oldStatus, newStatus, notes })`
- `sendSecurityNotificationEmail(to, { recipientName, eventType, timestamp, ipAddress, userAgent, actionTaken })`

### B. Cryptographic OTP Verification Service (`src/server/security/`)

#### `createOtp(options: CreateOtpOptions): Promise<CreateOtpResult>`
Generates a cryptographically secure 6-digit numerical token, stores its HMAC-SHA256 hash, invalidates prior tokens for `(identifier, purpose)`, and enforces a 60-second cooldown.
- Returns `{ success: true, code, expiresAt, resendAvailableAt }`
- On cooldown: `{ success: false, error: "RESEND_COOLDOWN_ACTIVE", waitSeconds }`

#### `verifyOtp(identifier: string, code: string, purpose?: OtpPurpose): Promise<VerifyOtpResult>`
Validates an OTP using constant-time comparison (`crypto.timingSafeEqual`), checks 5-minute expiry, increments attempts, locks out after 5 attempts, and enforces single-use consumption.
- Returns `{ success: true, verifiedAt }`
- On error: `{ success: false, error: "INVALID_CODE" | "MAX_ATTEMPTS_EXCEEDED" | "OTP_EXPIRED" | "OTP_NOT_FOUND", remainingAttempts }`

---

## 4. Planned Endpoints (Future Phases)

### A. Lead Capture & Enquiries (Phase 6 & 9)

#### `POST /api/enquiries`
Submits a client enquiry into the database pipeline.

- **Access:** Public (Protected by in-memory / Redis sliding-window rate limit)
- **Validation:** Zod `enquiryFormSchema`
- **Request Body:**
```json
{
  "name": "Alex Vance",
  "email": "alex@enterprise.com",
  "phone": "+1-555-0199",
  "companyName": "Vance Corp",
  "serviceCategory": "AI_AUTOMATION",
  "budgetRange": "50K+",
  "timeline": "1_TO_3_MONTHS",
  "message": "We need an autonomous AI multi-agent workflow integrated with our ERP."
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "enquiryId": "clyxyz1230001",
    "status": "NEW",
    "receivedAt": "2026-11-11T18:00:00.000Z"
  }
}
```

#### `GET /api/admin/enquiries`
Retrieves paginated and filtered lead enquiries for admin triage.

- **Access:** Authenticated Admin only
- **Query Parameters:** `?status=NEW&page=1&limit=20`

#### `PATCH /api/admin/enquiries/:id`
Updates enquiry triage status (`NEW`, `IN_REVIEW`, `CONTACTED`, `CONVERTED`, `ARCHIVED`) and internal notes.

- **Access:** Authenticated Admin only

---

### B. Admin Authentication & Session Management (Phase 7)

#### `POST /api/auth/login`
Authenticates administrator credentials and sets an encrypted HTTP-only cookie.

- **Access:** Public (Strict rate limiting: max 5 attempts per 15 minutes)
- **Request:** `{ "email": "admin@voidtechsolution.com", "password": "..." }`

#### `POST /api/auth/logout`
Terminates admin session and expires the auth cookie.

- **Access:** Authenticated Admin only

---

### C. Services & Portfolio CMS (Phase 10)

#### `GET /api/services`
Retrieves public list of all active services (cached via Next.js ISR / tag revalidation).

#### `GET /api/portfolio`
Retrieves published case studies with tech stack filters.
