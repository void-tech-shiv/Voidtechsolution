# VOIDTECH SOLUTION — Lead Management & CRM RBAC Architecture
## Phase 9.0 Role-Based Access Control Specification

**Project:** VOIDTECH SOLUTION  
**Tagline:** Build. Launch. Grow Online.  
**Document:** Lead Management & CRM RBAC Architecture  
**Phase:** Phase 9 (Admin Lead Management & Enquiry Pipeline)  
**Milestone:** 9.0 — Discovery, Requirements & Architecture  
**Author:** Antigravity Architect  
**Status:** Approved Specification (Discovery Complete)  

---

## 1. Principles & Threat Modeling

Access to prospective client leads, commercial pricing proposals, internal engineering notes, and customer communication channels is strictly governed by VOIDTECH SOLUTION's centralized, type-safe Role-Based Access Control (RBAC) engine.

### Threat Scenarios Mitigated:
1. **Privilege Escalation:** An unprivileged user or `EDITOR` spoofing client-side form payloads to alter lead status, claim deals, or view restricted commercial analytics.
2. **Unauthorized Deal Reassignment:** An unauthorized administrator stealing or reassigning leads assigned to another team member.
3. **Data Loss via Unauthorized Deletion:** An `ADMIN` or `EDITOR` accidentally or maliciously deleting lead history or audit records.
4. **Internal Information Leakage:** An `EDITOR` exporting full customer contact lists or reading sensitive negotiation notes.
5. **Tampering with Master Governance:** Modifying or demoting the single `SUPER_ADMIN` account.

---

## 2. Existing vs Proposed Permission Taxonomy

### Existing Permissions in `src/server/security/rbac.ts`:
```typescript
export type PermissionKey =
  | "dashboard:view"
  | "enquiries:view"
  | "enquiries:update_status"
  | "enquiries:delete"
  // ... other platform keys ...
```

### Proposed Granular CRM Permissions:
To support advanced CRM capabilities without over-granting permissions, the following keys are added to `PermissionKey`:

| New Permission Key | Semantic Purpose | Authorized Roles |
|---|---|---|
| `leads:view` | View inbound enquiries, Kanban board, and basic client details. | `SUPER_ADMIN`, `ADMIN`, `EDITOR` |
| `leads:update_status` | Advance or update pipeline stages in Kanban/table. | `SUPER_ADMIN`, `ADMIN` |
| `leads:assign` | Assign unassigned leads or reassign deals between team members. | `SUPER_ADMIN`, `ADMIN` |
| `leads:notes_create` | Add internal engineering assessments and prospect notes. | `SUPER_ADMIN`, `ADMIN` |
| `leads:notes_delete` | Remove an internal note (restricted to protect audit trail). | `SUPER_ADMIN` only |
| `leads:followup_manage` | Schedule, edit, and toggle completion of follow-up tasks. | `SUPER_ADMIN`, `ADMIN` |
| `leads:analytics_view` | View sales velocity funnels, response times, and pipeline value. | `SUPER_ADMIN`, `ADMIN` |
| `leads:export` | Export customer contact records and enquiry history to CSV/JSON. | `SUPER_ADMIN` only |
| `leads:delete` | Permanently purge lead records from the database. | `SUPER_ADMIN` only |

---

## 3. Comprehensive CRM RBAC Matrix

| CRM Operational Action | Target Endpoint / Action | SUPER_ADMIN | ADMIN | EDITOR | Security Enforcement Mechanism |
|---|---|:---:|:---:|:---:|---|
| **View Dashboard & Kanban** | `GET /admin/enquiries` | ✅ Allowed | ✅ Allowed | ✅ Allowed (Read-Only) | `requirePermission(user, "enquiries:view")` |
| **Inspect Lead Details Drawer** | Client Drawer Component | ✅ Allowed | ✅ Allowed | ✅ Allowed (Read-Only) | `requirePermission(user, "enquiries:view")` |
| **Drag Kanban Card / Change Status** | `updateLeadStatusAction` | ✅ Allowed | ✅ Allowed | ❌ Denied (403) | `requirePermission(user, "enquiries:update_status")` |
| **Assign / Reassign Lead** | `assignLeadAction` | ✅ Allowed | ✅ Allowed | ❌ Denied (403) | `requirePermission(user, "leads:assign")` |
| **Create Internal Note** | `createLeadNoteAction` | ✅ Allowed | ✅ Allowed | ❌ Denied (403) | `requirePermission(user, "leads:notes_create")` |
| **Delete Internal Note** | `deleteLeadNoteAction` | ✅ Allowed | ❌ Denied (403) | ❌ Denied (403) | `requirePermission(user, "leads:notes_delete")` |
| **Schedule Follow-Up Task** | `createFollowUpAction` | ✅ Allowed | ✅ Allowed | ❌ Denied (403) | `requirePermission(user, "leads:followup_manage")` |
| **Complete Follow-Up Task** | `toggleFollowUpAction` | ✅ Allowed | ✅ Allowed | ❌ Denied (403) | `requirePermission(user, "leads:followup_manage")` |
| **View Pipeline Analytics & Value** | `getLeadAnalyticsAction` | ✅ Allowed | ✅ Allowed | ❌ Denied (403) | `requirePermission(user, "leads:analytics_view")` |
| **Export Leads (CSV/JSON)** | `exportLeadsAction` | ✅ Allowed | ❌ Denied (403) | ❌ Denied (403) | `requirePermission(user, "leads:export")` |
| **Permanently Delete Lead** | `deleteLeadAction` | ✅ Allowed | ❌ Denied (403) | ❌ Denied (403) | `requirePermission(user, "enquiries:delete")` |
| **Receive In-App Notifications** | `getNotificationsAction` | ✅ Own Only | ✅ Own Only | ❌ None | Scoped strictly to `recipientId === user.id` |

---

## 4. Server-Side Enforcement Patterns

All CRM actions strictly follow the established VOIDTECH security protocol:

```typescript
// Sample Architectural Pattern for Server Action
"use server";

import { headers } from "next/headers";
import { getCurrentAdmin } from "@/server/actions/auth.actions";
import { validateRequestOrigin } from "@/server/security/origin";
import { requirePermission, AuthorizationError } from "@/server/security/rbac";
import { recordAuditEvent, AUDIT_ACTIONS } from "@/server/security/audit";

export async function assignLeadAction(leadId: string, targetAdminId: string) {
  // 1. Origin & CSRF Guard
  const reqHeaders = await headers();
  if (!validateRequestOrigin(reqHeaders)) {
    return { success: false, error: "Cross-origin request rejected." };
  }

  // 2. Authentication Check
  const current = await getCurrentAdmin();
  if (!current || !current.user.isActive) {
    return { success: false, error: "Authentication required." };
  }

  try {
    // 3. Centralized RBAC Assertion
    requirePermission(current.user, "leads:assign");

    // 4. Domain Logic Execution inside Transaction
    // ... assign lead, create activity, create notification ...

    // 5. Immutable Audit Logging
    await recordAuditEvent({
      action: "LEAD_ASSIGNED",
      entity: "Enquiry",
      entityId: leadId,
      actorId: current.user.id,
      actorEmail: current.user.email,
      details: { leadId, targetAdminId },
    });

    return { success: true };
  } catch (err) {
    const msg = err instanceof AuthorizationError ? err.message : "Assignment failed.";
    return { success: false, error: msg };
  }
}
```

---

## 5. Defense Against Client-Side Tampering

1. **Zero Client Trust:** The frontend never transmits role strings or permissions in mutation bodies. Role state is derived exclusively from the cryptographically verified HMAC session cookie on the server.
2. **Account Status Re-Verification:** Even if a session token is valid, `requirePermission` verifies that `user.isActive === true` against the database on every mutating turn. A deactivated administrator's requests are aborted instantly with HTTP 403.
3. **Sole Super Admin Invariant:** The master `SUPER_ADMIN` cannot be deleted, demoted, or deactivated by any CRM administrative action.
