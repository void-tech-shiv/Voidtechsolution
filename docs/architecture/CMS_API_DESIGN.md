# CMS_API_DESIGN.md — Server Action & Route Contracts

**Project:** VOIDTECH SOLUTION  
**Milestone:** Phase 10.0.1 — CMS Architecture Refinement & Design Freeze  
**Document Status:** FROZEN API SPECIFICATIONS [DESIGN FREEZE]  
**Author:** Google DeepMind Assistant  
**Approved By:** Project Owner  

---

## 1. API Architecture & Security Principles

All CMS mutations in VOIDTECH SOLUTION are implemented as typed **Next.js Server Actions** residing in `src/server/actions/cms/`. Public data retrieval is handled by React Server Components querying the repository tier directly with on-demand cache tags.

### Mandatory Execution Pipeline for Every CMS Action:
1. **Origin Verification:** Evaluates `host` vs `origin` headers (`validateRequestOrigin`) to reject CSRF attacks.
2. **Dual-Layer Authentication:** Resolves session from cryptographically signed HMAC cookies via `getCurrentAdmin()`.
3. **Server-Side RBAC Enforcement:** Evaluates `requirePermission(currentAdmin.user, permissionKey)` server-side.
4. **Zod Input Validation:** Strict schema validation with sanitized string transformations.
5. **Atomic Transaction & OCC Concurrency:** Atomic version checks (`WHERE id = ... AND version = expectedVersion`).
6. **Immutable Audit Logging:** Dispatches `recordAuditEvent(...)` within the transaction or post-commit.
7. **On-Demand Cache Purging:** Invokes `revalidateTag(...)` upon successful publishing.

---

## 2. Standardized Response Envelope & Error Taxonomy

```typescript
export type ActionResult<T = unknown> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string; code?: string; details?: Record<string, string[]> };
```

| Error Code | HTTP Equiv | Description |
|---|:---:|---|
| `UNAUTHENTICATED` | 401 | Missing, malformed, or expired session cookie |
| `FORBIDDEN` | 403 | User lacks required RBAC permission |
| `VALIDATION_FAILED` | 422 | Zod schema validation rejected input payload |
| `CONFLICT_DETECTED` | 409 | Optimistic concurrency conflict (version drift) |
| `NOT_FOUND` | 404 | Target content item or revision not found |
| `PRECONDITION_FAILED` | 412 | Business rule broken (e.g. publishing unverified testimonial) |
| `INTERNAL_ERROR` | 500 | Database or server failure (sanitized, zero secret leakage) |

---

## 3. CMS Core Server Action Contracts

### 3.1 Content Lifecycle Actions (`src/server/actions/cms/lifecycle.actions.ts`)

#### `saveContentDraftAction`
- **Permission:** `content:edit` (`SUPER_ADMIN`, `ADMIN`, `EDITOR`)
- **Input Schema:**
  ```typescript
  const SaveDraftSchema = z.object({
    contentItemId: z.string().cuid(),
    expectedVersion: z.number().int().positive(),
    title: z.string().min(3).max(200),
    snapshotData: z.record(z.unknown()), // Typed per contentType
    changeSummary: z.string().max(500).optional(),
  });
  ```
- **Transaction Behavior:**
  1. Checks `ContentRevision` for `contentItemId` where `versionNumber = expectedVersion`.
  2. If version matches, creates new `ContentRevision` with `versionNumber = expectedVersion + 1` and `revisionStatus: "WORKING_DRAFT"`.
  3. Executes draft pruning: if working drafts exceed 20, deletes oldest non-published draft.
  4. Records `CMS_DRAFT_SAVED` audit event.
- **Output:** `ActionResult<{ revisionId: string; newVersion: number }>`

#### `submitForReviewAction`
- **Permission:** `content:edit` (`SUPER_ADMIN`, `ADMIN`, `EDITOR`)
- **Input Schema:** `{ revisionId: z.string().cuid() }`
- **Behavior:** Updates `ContentRevision.revisionStatus = "PENDING_REVIEW"`, dispatches in-app notification to `ADMIN` and `SUPER_ADMIN`.
- **Output:** `ActionResult<{ revisionId: string; status: "PENDING_REVIEW" }>`

#### `rejectRevisionAction`
- **Permission:** `content:publish` (`SUPER_ADMIN`, `ADMIN`; `EDITOR` DENIED)
- **Input Schema:** `{ revisionId: z.string().cuid(), rejectionNote: z.string().min(5).max(1000) }`
- **Behavior:** Updates `ContentRevision.revisionStatus = "REJECTED"`, stores `rejectionNote`, notifies author.
- **Output:** `ActionResult<{ revisionId: string; status: "REJECTED" }>`

#### `publishRevisionAction` [OWNER APPROVED - ATOMIC PROMOTION]
- **Permission:** `content:publish` (`SUPER_ADMIN`, `ADMIN`; `EDITOR` DENIED)
- **Input Schema:** `{ revisionId: z.string().cuid() }`
- **Transaction Behavior (Single PostgreSQL Transaction):**
  1. Validates that revision exists, belongs to active `ContentItem`, and is in `APPROVED` or `WORKING_DRAFT` (if author is Admin).
  2. Upserts materialized domain record (`Service`, `PricingPackage`, etc.) using `snapshotData`.
  3. Updates `ContentItem`:
     - `status = "PUBLISHED"`
     - `currentPublishedRevisionId = revisionId`
     - `publishedAt = now()`
     - `publishedById = currentAdmin.id`
  4. Updates `ContentRevision`:
     - `revisionStatus = "PUBLISHED_SNAPSHOT"`
     - `isPublishedSnapshot = true`
  5. Inserts `audit_logs` record `CMS_ITEM_PUBLISHED`.
  6. On commit: invokes `revalidateTag(cacheTag)` and `revalidatePath(path)`.
- **Failure Guarantee:** If any step fails, transaction rolls back; public domain table remains untouched.
- **Output:** `ActionResult<{ contentItemId: string; publishedRevisionId: string }>`

#### `archiveContentItemAction`
- **Permission:** `content:archive` (`SUPER_ADMIN`, `ADMIN`; `EDITOR` DENIED)
- **Input Schema:** `{ contentItemId: z.string().cuid() }`
- **Transaction Behavior:**
  1. Sets `ContentItem.status = "ARCHIVED"`.
  2. Deactivates domain record (`isActive = false`).
  3. Clears cache tags.
  4. Records `CMS_ITEM_ARCHIVED`.
- **Output:** `ActionResult<{ contentItemId: string; status: "ARCHIVED" }>`

#### `restoreRevisionAction` [OWNER APPROVED - NEW REVISION CREATION]
- **Permission:** `content:restore` (`SUPER_ADMIN`, `ADMIN`; `EDITOR` DENIED)
- **Input Schema:** `{ revisionId: z.string().cuid() }`
- **Behavior:**
  1. Reads target historical `ContentRevision`.
  2. Determines `maxVersion = max(versionNumber)` for this `contentItemId`.
  3. Creates a **NEW** `ContentRevision` with `versionNumber = maxVersion + 1`, `revisionStatus = "WORKING_DRAFT"`, copying `snapshotData`.
  4. Historical revisions are **never mutated**.
  5. Records `CMS_VERSION_RESTORED`.
- **Output:** `ActionResult<{ newRevisionId: string; newVersion: number }>`

---

### 3.2 Pricing Management Actions (`src/server/actions/cms/pricing.actions.ts`)

#### `savePricingDraftAction`
- **Permission:** `pricing:edit_draft` (`SUPER_ADMIN`, `ADMIN`, `EDITOR`)
- **Input Schema:**
  ```typescript
  const PricingDraftSchema = z.object({
    contentItemId: z.string().cuid(),
    expectedVersion: z.number().int().positive(),
    name: z.string().min(2).max(100),
    category: z.nativeEnum(ServiceCategory),
    priceInr: z.number().int().nonnegative("Price must be a positive integer in INR"),
    currency: z.literal("INR"),
    isStartingPrice: z.boolean(),
    billingPeriod: z.string().max(50).nullable().optional(),
    features: z.array(z.string().min(1)).min(1, "At least one feature required"),
    popular: z.boolean().default(false),
    orderIndex: z.number().int().default(0),
    changeSummary: z.string().max(500).optional(),
  });
  ```
- **Output:** `ActionResult<{ revisionId: string; version: number }>`

#### `publishPricingAction` [OWNER APPROVED - PRICING RBAC RESTRICTION]
- **Permission:** `pricing:publish` (`SUPER_ADMIN`, `ADMIN` ONLY; `EDITOR` STRICTLY DENIED)
- **Input Schema:** `{ revisionId: z.string().cuid() }`
- **Behavior:** Promotes pricing revision atomically to `PricingPackage` table, invalidates `pricing-tiers` cache tag.
- **Output:** `ActionResult<{ packageId: string; priceInr: number }>`

---

### 3.3 Testimonial Verification & Publishing Actions (`src/server/actions/cms/testimonials.actions.ts`)

#### `verifyTestimonialAction` [OWNER APPROVED]
- **Permission:** `testimonials:verify` (`SUPER_ADMIN`, `ADMIN` ONLY)
- **Input Schema:**
  ```typescript
  const VerifyTestimonialSchema = z.object({
    contentItemId: z.string().cuid(),
    consentEvidenceUrl: z.string().url("Must reference verifiable consent documentation"),
    verificationRecordNotes: z.string().min(10),
  });
  ```
- **Behavior:** Updates `Testimonial`:
  - `isVerified = true`
  - `verifiedById = currentAdmin.id`
  - `verifiedAt = now()`
  - `clientConsentConfirmed = true`
  - `consentConfirmedAt = now()`
  - `consentEvidenceUrl = input.consentEvidenceUrl`
  - `approvalStatus = "VERIFIED"`
- **Output:** `ActionResult<Testimonial>`

#### `revokeTestimonialConsentAction` [OWNER APPROVED]
- **Permission:** `testimonials:verify` (`SUPER_ADMIN`, `ADMIN`)
- **Input Schema:** `{ contentItemId: z.string().cuid(), reason: z.string().min(5) }`
- **Behavior:** Atomically sets `approvalStatus = "REVOKED"`, `isActive = false`, instantly unlisting the quote.
- **Output:** `ActionResult<{ status: "REVOKED" }>`

---

### 3.4 Media Management Actions (`src/server/actions/cms/media.actions.ts`)

#### `uploadMediaAction` [OWNER APPROVED]
- **Permission:** `media:upload` (`SUPER_ADMIN`, `ADMIN`, `EDITOR`)
- **Input:** `FormData` with fields:
  - `file`: `File` (Max 5 MB)
  - `defaultAltText`: `string` (Min 5 chars, mandatory)
  - `caption`: `string` (Optional)
- **Processing Pipeline:**
  1. Sniffs file buffer magic bytes:
     - JPEG (`FF D8 FF`)
     - PNG (`89 50 4E 47`)
     - WebP (`52 49 46 46 ... 57 45 42 50`)
     - AVIF (`ftypavif`)
     - SVG (`<?xml` or `<svg`) — Requires `media:upload_svg` permission!
  2. Re-encodes raster formats to WebP/AVIF via Sharp, stripping metadata.
  3. Sanitizes SVGs with DOMPurify.
  4. Computes SHA-256 hash digest. Checks for existing asset to deduplicate.
  5. Invokes `StorageService.upload(buffer, storageKey, mimeType)`.
  6. Creates `MediaAsset` record storing `provider`, `storageKey`, `sha256Hash`.
- **Output:** `ActionResult<MediaAsset>`

#### `deleteMediaAction`
- **Permission:** `media:delete` (`SUPER_ADMIN` ONLY)
- **Input Schema:** `{ id: z.string().cuid() }`
- **Behavior:** Deletes from storage provider and removes database row.
- **Output:** `ActionResult<{ deletedId: string }>`

---

## 4. Next.js Draft Mode API Routes

### 4.1 Preview Activation: `GET /api/draft/preview`
- **Query Parameters:**
  - `secret`: Must match server `DRAFT_PREVIEW_SECRET`.
  - `contentType`: `SERVICE | PRICING_PACKAGE | PORTFOLIO_PROJECT | PAGE_SECTION`
  - `slug`: Content item slug.
- **Handler Security:**
  1. Constant-time timing-safe secret check: `crypto.timingSafeEqual(...)`.
  2. Validates session cookie to ensure caller is an authenticated administrator.
  3. Sets `__prerender_bypass` cookie via Next.js `draftMode().enable()`.
  4. Validates target redirect path is relative (prevents open redirects).
  5. Redirects to target page.
  6. Injected HTTP Header: `X-Robots-Tag: noindex, nofollow`.

### 4.2 Preview Exit: `GET /api/draft/exit`
- Disables draft mode via `draftMode().disable()`.
- Clears bypass cookie.
- Redirects to public canonical route.
