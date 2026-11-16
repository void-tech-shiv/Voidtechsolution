# VOIDTECH SOLUTION — Lead Management & CRM API Design
## Phase 9.0 API & Server Action Interface Specification

**Project:** VOIDTECH SOLUTION  
**Tagline:** Build. Launch. Grow Online.  
**Document:** Lead Management & CRM API Design  
**Phase:** Phase 9 (Admin Lead Management & Enquiry Pipeline)  
**Milestone:** 9.0 — Discovery, Requirements & Architecture  
**Author:** Antigravity Architect  
**Status:** Approved Specification (Discovery Complete)  

---

## 1. Overview & Protocol Strategy

The VOIDTECH SOLUTION CRM interfaces follow a dual-channel architecture:
1. **Next.js Server Actions (Primary):** Type-safe, RPC-style server functions invoked directly by React 19 Client Components. Server Actions deliver sub-200ms latency, automatic CSRF/Origin validation, and direct cache revalidation via `revalidatePath()`.
2. **RESTful Admin API Routes (Secondary):** Standard HTTP endpoints (`/api/admin/leads/*`) supporting potential external integrations, webhook processors, or headless tooling with JSON request/response envelopes.

Both channels enforce identical Zod validation schemas, RBAC permission checks, and transaction boundaries.

---

## 2. Standard Response Envelope & Error Taxonomy

All API routes and Server Actions return standard, structured payload envelopes:

```typescript
// Standard Success Envelope
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    timestamp: string;
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// Standard Error Envelope
export interface ApiErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, string>;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
```

### Machine-Readable Error Codes:
- `UNAUTHENTICATED` (HTTP 401) — Missing or expired administrator session.
- `FORBIDDEN` (HTTP 403) — Role lacks required RBAC permission or account is deactivated.
- `VALIDATION_ERROR` (HTTP 400) — Input payload failed Zod schema parsing.
- `INVALID_TRANSITION` (HTTP 422) — Requested state change violates `LeadStateMachine` rules.
- `CONFLICT_DETECTED` (HTTP 409) — Optimistic Concurrency Control failure (`expectedUpdatedAt` mismatch).
- `NOT_FOUND` (HTTP 404) — Target lead, note, or follow-up ID does not exist.
- `RATE_LIMITED` (HTTP 429) — Mutation rate exceeded threshold.
- `INTERNAL_ERROR` (HTTP 500) — Database or unexpected runtime failure.

---

## 3. Zod Validation Schemas (`src/validations/lead.ts`)

```typescript
import { z } from "zod";
import { EnquiryStatus, ServiceCategory } from "@prisma/client";

// 1. Status Update Schema (with OCC guard)
export const updateLeadStatusSchema = z.object({
  leadId: z.string().cuid("Invalid lead ID format"),
  status: z.nativeEnum(EnquiryStatus, { errorMap: () => ({ message: "Invalid lifecycle status" }) }),
  expectedUpdatedAt: z.string().datetime({ message: "Valid ISO timestamp required for concurrency check" }),
  lostReason: z.string().trim().min(3, "Please provide a reason for marking the lead as lost").optional(),
  estimatedValueInr: z.number().int().positive().optional(),
});

// 2. Lead Assignment Schema
export const assignLeadSchema = z.object({
  leadId: z.string().cuid(),
  assignedAdminId: z.string().cuid().nullable(), // null = unassign
});

// 3. Internal Note Creation Schema
export const createLeadNoteSchema = z.object({
  leadId: z.string().cuid(),
  content: z.string().trim().min(2, "Note must be at least 2 characters").max(5000, "Note exceeds 5000 character limit"),
  isPinned: z.boolean().default(false),
});

// 4. Follow-Up Task Creation Schema
export const createFollowUpSchema = z.object({
  leadId: z.string().cuid(),
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(150),
  description: z.string().trim().max(2000).optional(),
  dueAt: z.string().datetime({ message: "Valid due date/time required" }),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  assignedToId: z.string().cuid().optional(),
});

// 5. Follow-Up Completion Toggle Schema
export const toggleFollowUpSchema = z.object({
  followUpId: z.string().cuid(),
  isCompleted: z.boolean(),
});

// 6. Lead Query & Filter Schema
export const getLeadsFilterSchema = z.object({
  status: z.nativeEnum(EnquiryStatus).optional(),
  category: z.nativeEnum(ServiceCategory).optional(),
  assignedAdminId: z.string().cuid().optional(),
  search: z.string().trim().max(100).optional(),
  hasOverdueFollowUp: z.boolean().optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  sortBy: z.enum(["createdAt", "updatedAt", "name", "status"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
```

---

## 4. Server Action Specifications

### 4.1 `updateLeadStatusAction(input: unknown)`
- **Security:** Requires `enquiries:update_status` (SUPER_ADMIN, ADMIN).
- **Concurrency:** Compares `input.expectedUpdatedAt` with `enquiry.updatedAt`. If mismatched, returns `CONFLICT_DETECTED`.
- **Validation:** Enforces `canTransition(currentStatus, targetStatus)`.
- **Side Effects:**
  - Updates `enquiry.status`, `enquiry.updatedAt`, and optionally `lostReason` / `estimatedValueInr`.
  - Appends `LeadActivity` record (`type: "STATUS_CHANGE"`).
  - Emits immutable `AuditLog` (`action: "ENQUIRY_STATUS_UPDATED"`).
  - If status becomes `WON` or `LOST`, generates `AdminNotification` for `SUPER_ADMIN`.
  - Invokes `revalidatePath("/admin/enquiries")`.

### 4.2 `assignLeadAction(input: unknown)`
- **Security:** Requires `leads:assign` (SUPER_ADMIN, ADMIN).
- **Side Effects:**
  - Updates `enquiry.assignedAdminId`.
  - Appends `LeadActivity` record (`type: "ASSIGNMENT"`).
  - Emits `AuditLog` (`action: "LEAD_ASSIGNED"`).
  - If assigned to another administrator, creates `AdminNotification` (`type: "LEAD_ASSIGNED"`) for the assignee.
  - Dispatches internal notification email via Nodemailer if configured.

### 4.3 `createLeadNoteAction(input: unknown)`
- **Security:** Requires `leads:notes_create` (SUPER_ADMIN, ADMIN).
- **Data Boundary:** Strictly tags note as `INTERNAL_ONLY`.
- **Side Effects:**
  - Persists new `LeadNote` with `authorId` and `authorName`.
  - Appends `LeadActivity` record (`type: "NOTE_ADDED"`).
  - Updates `enquiry.updatedAt`.

### 4.4 `manageFollowUpAction(input: unknown)`
- **Security:** Requires `leads:followup_manage` (SUPER_ADMIN, ADMIN).
- **Side Effects:**
  - Persists or toggles `LeadFollowUp`.
  - Updates `enquiry.nextFollowUpAt` to earliest pending task.
  - Appends `LeadActivity` (`type: "FOLLOWUP_SCHEDULED"` or `"FOLLOWUP_COMPLETED"`).

### 4.5 `getLeadAnalyticsAction()`
- **Security:** Requires `leads:analytics_view` (SUPER_ADMIN, ADMIN).
- **Returns:**
  - Aggregated counts per status.
  - Overall and stage-by-stage conversion ratios.
  - Top requested service categories.
  - Average response time (SLA).
  - Estimated pipeline value range in INR.

---

## 5. REST API Endpoints Specification

| Method | Endpoint Path | Authentication & RBAC | Primary Purpose |
|---|---|---|---|
| `GET` | `/api/admin/leads` | Bearer Token / Session Cookie (`enquiries:view`) | Paginated, filtered list of leads for table/Kanban. |
| `GET` | `/api/admin/leads/:id` | Session Cookie (`enquiries:view`) | Single lead detail with hydrated notes, follow-ups, and timeline. |
| `PATCH` | `/api/admin/leads/:id/status` | Session Cookie (`enquiries:update_status`) | Optimistic status update with OCC concurrency checking. |
| `PATCH` | `/api/admin/leads/:id/assign` | Session Cookie (`leads:assign`) | Reassign lead to team member. |
| `POST` | `/api/admin/leads/:id/notes` | Session Cookie (`leads:notes_create`) | Create threaded internal note. |
| `POST` | `/api/admin/leads/:id/follow-ups` | Session Cookie (`leads:followup_manage`) | Schedule follow-up task. |
| `PATCH` | `/api/admin/leads/follow-ups/:id` | Session Cookie (`leads:followup_manage`) | Toggle task completion. |
| `GET` | `/api/admin/leads/analytics` | Session Cookie (`leads:analytics_view`) | Aggregated conversion funnel and velocity metrics. |
| `GET` | `/api/admin/notifications` | Session Cookie (Active Admin) | List unread in-app alerts for logged-in admin. |
| `PATCH` | `/api/admin/notifications/mark-read`| Session Cookie (Active Admin) | Mark notifications read. |
| `DELETE`| `/api/admin/leads/:id` | Session Cookie (`enquiries:delete` — SUPER_ADMIN) | Permanently delete lead and cascade child relations. |
