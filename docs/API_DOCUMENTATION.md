# API_DOCUMENTATION.md — Backend Endpoints & Route Handlers Specification

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

## 2. Implemented Endpoints (Phase 1)

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

## 3. Planned Endpoints (Future Phases)

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
  "budgetRange": "15K_TO_50K",
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
- **Response:** `{ "success": true, "data": { "user": { "id": "...", "email": "...", "role": "ADMIN" } } }`

#### `POST /api/auth/logout`
Terminates admin session and expires the auth cookie.

- **Access:** Authenticated Admin only

---

### C. Services & Portfolio CMS (Phase 10)

#### `GET /api/services`
Retrieves public list of all active services (cached via Next.js ISR / tag revalidation).

#### `GET /api/portfolio`
Retrieves published case studies with tech stack filters.

#### `POST /api/admin/portfolio`
Creates a new client case study.

- **Access:** Authenticated Admin only
