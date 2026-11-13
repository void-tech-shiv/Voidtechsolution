# CMS_RBAC_PERMISSION_MATRIX.md — Role-Based Access Control Matrix

**Project:** VOIDTECH SOLUTION  
**Milestone:** Phase 10.0 — CMS Discovery & Architecture  
**Document Status:** PROPOSED AUTHORIZATION MATRIX  
**Author:** Google DeepMind Assistant  
**Approved By:** Pending Owner Authorization  

---

## 1. Architectural Principles of CMS Authorization

In accordance with VOIDTECH security guidelines:
1. **Server-Side Exclusivity:** Client-side role checks are treated strictly as cosmetic UX affordances (e.g. disabling buttons or hiding menu items). The true security perimeter is enforced exclusively inside Server Actions, Edge Middleware, and API route handlers via `requirePermission(user, key)`.
2. **Least Privilege Principle:** Content authors (`EDITOR`) are empowered to draft and refine content without granting them the authority to alter public-facing commercial pricing, publish unvetted copy, or delete historical records.
3. **Dual Approval for High-Risk Actions:** Publication of commercial pricing, live marketing claims, or testimonials requires `ADMIN` or `SUPER_ADMIN` review.
4. **Master Account Inviolability:** The sole `SUPER_ADMIN` account cannot be deleted, demoted, or deactivated, preserving institutional continuity.

---

## 2. Granular CMS Permission Keys

Expanding upon the existing Phase 7/9 keys in `src/server/security/rbac.ts`, the proposed CMS permissions are structured by domain and action:

```typescript
export type CmsPermissionKey =
  // Base Navigation & Inspection
  | "content:view"              // View CMS dashboard and all draft/published items
  
  // Services Management
  | "services:create"           // Create new draft service offerings
  | "services:edit"             // Edit service drafts and descriptions
  | "services:publish"          // Publish service to live catalog
  | "services:archive"          // Archive / unlist service offering
  | "services:delete"           // Permanently delete service (SuperAdmin only)
  
  // Pricing Tiers (Strict Commercial Controls)
  | "pricing:create"            // Create new pricing packages
  | "pricing:edit"              // Edit existing packages and INR amounts
  | "pricing:publish"           // Toggle package active status on public site
  | "pricing:delete"            // Delete pricing package (SuperAdmin only)
  
  // Portfolio & Case Studies
  | "portfolio:create"          // Draft new portfolio prototypes / case studies
  | "portfolio:edit"            // Edit project details and tech stack tags
  | "portfolio:publish"         // Publish case study to live showcase
  | "portfolio:archive"         // Archive project from public display
  | "portfolio:delete"          // Permanently delete portfolio project
  
  // FAQs & Knowledgebase
  | "faqs:create"               // Create new FAQ item
  | "faqs:edit"                 // Edit FAQ questions, answers, and categories
  | "faqs:reorder"              // Reorder FAQ display priority
  | "faqs:delete"               // Delete FAQ item
  
  // Editorial Page Sections (Homepage, About, etc.)
  | "sections:edit"             // Edit draft text for homepage and editorial sections
  | "sections:publish"          // Publish page section changes to live website
  
  // Revision Restoration & Rollback
  | "content:restore"           // Restore historical ContentRevision snapshot
  
  // SEO & Metadata
  | "seo:manage"                // Update meta titles, descriptions, canonical URLs, robots
  
  // Media Assets
  | "media:upload"              // Upload images, SVGs, and documents
  | "media:edit_meta"           // Update alt text and captions
  | "media:delete"              // Permanently delete media file from storage
  
  // Site Configuration
  | "settings:manage";          // Manage global brand name, contact email, maintenance mode
```

---

## 3. Comprehensive Role-Permission Matrix

| CMS Operation / Permission Key | SUPER_ADMIN | ADMIN | EDITOR | Security Rationale |
|---|:---:|:---:|:---:|---|
| **`content:view`** | ✅ | ✅ | ✅ | All administrators require visibility into content lists and drafts |
| **`services:create`** | ✅ | ✅ | ✅ | Editors can draft new service offerings |
| **`services:edit`** | ✅ | ✅ | ✅ | Editors can refine text, deliverables, and icons |
| **`services:publish`** | ✅ | ✅ | ❌ | Publishing requires operational review; Editor denied |
| **`services:archive`** | ✅ | ✅ | ❌ | Archiving public services requires Admin sign-off |
| **`services:delete`** | ✅ | ❌ | ❌ | Permanent deletion restricted to sole Super Admin |
| **`pricing:create`** | ✅ | ✅ | ❌ | Pricing directly impacts revenue; Editor strictly denied |
| **`pricing:edit`** | ✅ | ✅ | ❌ | Changing INR amounts requires commercial authority |
| **`pricing:publish`** | ✅ | ✅ | ❌ | Activating/deactivating pricing tiers restricted to Admin |
| **`pricing:delete`** | ✅ | ❌ | ❌ | Super Admin only |
| **`portfolio:create`** | ✅ | ✅ | ✅ | Editors can draft case study prototypes |
| **`portfolio:edit`** | ✅ | ✅ | ✅ | Editors can update descriptions, metrics, and tags |
| **`portfolio:publish`** | ✅ | ✅ | ❌ | Publishing requires verification of claims; Editor denied |
| **`portfolio:archive`** | ✅ | ✅ | ❌ | Admin or Super Admin |
| **`portfolio:delete`** | ✅ | ❌ | ❌ | Super Admin only |
| **`faqs:create`** | ✅ | ✅ | ✅ | Editors can propose new FAQ questions and answers |
| **`faqs:edit`** | ✅ | ✅ | ✅ | Editors can refine FAQ content |
| **`faqs:reorder`** | ✅ | ✅ | ❌ | Reordering affects visual presentation |
| **`faqs:delete`** | ✅ | ✅ | ❌ | Deleting knowledgebase answers requires Admin role |
| **`sections:edit`** | ✅ | ✅ | ✅ | Editors can draft marketing copy and hero text |
| **`sections:publish`** | ✅ | ✅ | ❌ | Publishing global homepage copy requires Admin role |
| **`content:restore`** | ✅ | ✅ | ❌ | Reverting to historical version impacts live site; Editor denied |
| **`seo:manage`** | ✅ | ✅ | ❌ | Canonical and robots directives impact search ranking; Editor denied |
| **`media:upload`** | ✅ | ✅ | ✅ | All roles can upload media for drafting |
| **`media:edit_meta`**| ✅ | ✅ | ✅ | All roles can provide accessible alt text |
| **`media:delete`** | ✅ | ❌ | ❌ | Deletion can cause broken image links; Super Admin only |
| **`settings:manage`** | ✅ | ❌ | ❌ | Global site settings restricted to sole Super Admin |

---

## 4. Role Responsibility Profiles

### 4.1 SUPER_ADMIN (System Owner & Master Governance)
- **Profile:** Sole owner account (`SHIVANSHU SATYAJEET`).
- **CMS Responsibilities:**
  - Full unilateral authority across all CMS operations.
  - Exclusive authority to delete published services, pricing tiers, portfolio projects, and media files.
  - Exclusive authority to update global `site_settings`.
  - Sole authority to manage administrative accounts (`admins:manage`, `admins:change_role`).

### 4.2 ADMIN (Operations & Editorial Manager)
- **Profile:** Department leads, project managers, senior engineering staff.
- **CMS Responsibilities:**
  - Day-to-day content publishing, review, and live site management.
  - Authority to publish drafts submitted by Editors.
  - Authority to create and edit pricing packages in INR.
  - Authority to archive discontinued offerings.
  - Authority to roll back content to previous historical revisions (`content:restore`).
  - Authority to manage SEO titles, descriptions, and canonical links.
  - **Restrictions:** Cannot permanently delete entities or media files; cannot modify global `site_settings`.

### 4.3 EDITOR (Content Creator & Copywriter)
- **Profile:** Copywriters, technical writers, marketing coordinators.
- **CMS Responsibilities:**
  - Drafting new services, portfolio case studies, FAQs, and page section copy.
  - Uploading media assets and assigning accessible alt text.
  - Submitting completed drafts for review (`status: REVIEW`).
  - Viewing the full catalog and inspecting historical revisions.
  - **Restrictions:** Strictly denied from publishing live content, altering pricing tiers in INR, modifying SEO indexing controls, archiving live content, deleting assets, or performing version rollbacks.

---

## 5. Security Invariant Enforcement Rules

1. **Non-Escalation Check:** A user can never assign or elevate permissions beyond their own role.
2. **Atomic Verification:** Server Actions verify role and permissions at the beginning of each transaction; cached client session state is never trusted.
3. **Audit Trail Invariance:** Every permission denial logs an `UNAUTHORIZED_ACCESS_ATTEMPT` audit entry with actor ID, IP, user-agent, and attempted permission key.
