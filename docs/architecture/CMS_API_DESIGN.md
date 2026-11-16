# CMS_API_DESIGN.md — Server Action & Route Contracts

**Project:** VOIDTECH SOLUTION  
**Milestone:** Phase 10.0.2 — Final CMS Implementation Safeguards  
**Document Status:** FROZEN API SPECIFICATIONS & SAFEGUARDS [DESIGN FREEZE]  
**Author:** Google DeepMind Assistant  
**Approved By:** SHIVANSHU SATYAJEET (Project Owner) — Safeguards Authorized  

---

## 1. API Architecture & Security Principles

All CMS mutations in VOIDTECH SOLUTION are implemented as typed **Next.js Server Actions** residing in `src/server/actions/cms/`. Public data retrieval is handled by React Server Components querying the repository tier directly with on-demand cache tags.

### Mandatory Execution Pipeline for Every CMS Action:
1. **Origin Verification:** Evaluates `host` vs `origin` headers (`validateRequestOrigin`) to reject CSRF attacks.
2. **Dual-Layer Authentication:** Resolves session from cryptographically signed HMAC cookies via `getCurrentAdmin()`.
3. **Server-Side RBAC Enforcement:** Evaluates `requirePermission(currentAdmin.user, permissionKey)` server-side.
4. **Zod Input Validation:** Strict schema validation with sanitized string transformations.
5. **Atomic Transaction & OCC Concurrency:** Atomic version checks (`WHERE id = ... AND version = expectedVersion`).
6. **Immutable Audit Logging:** Dispatches `recordAuditEvent(...)` within the transaction.
7. **On-Demand Cache Purging:** Invokes `revalidateTag(...)` upon successful publishing.

---

## 2. Standardized Response Envelope & Error Taxonomy

```typescript
export type ActionResult<T = unknown> =
  | {
      success: true;
      data: T;
      message?: string;
      source?: "DATABASE" | "STATIC_REGISTRY";
      isFallback?: boolean;
    }
  | {
      success: false;
      error: string;
      code?: string;
      details?: Record<string, string[]>;
      source?: "DATABASE" | "STATIC_REGISTRY";
      isFallback?: boolean;
    };
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
  1. Checks `ContentItem` where `id = contentItemId AND version = expectedVersion`.
  2. If version matches, creates new `ContentRevision` with `versionNumber = expectedVersion + 1`, `revisionStatus: "WORKING_DRAFT"`, and updates `ContentItem.currentWorkingRevisionId = newRevision.id`.
  3. Live published content (`currentPublishedRevisionId`) remains completely untouched.
  4. Executes draft pruning: if working drafts exceed 20, deletes oldest non-published draft.
  5. Records `CMS_DRAFT_SAVED` audit event.
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

#### `publishRevisionAction` [SAFEGUARD 3 — 9-STEP ATOMIC PUBLISHING PROTOCOL]
- **Permission:** `content:publish` (`SUPER_ADMIN`, `ADMIN`; `EDITOR` STRICTLY DENIED)
- **Input Schema:**
  ```typescript
  const PublishRevisionSchema = z.object({
    contentItemId: z.string().cuid(),
    revisionId: z.string().cuid(),
    expectedVersion: z.number().int().positive(),
  });
  ```
- **Transaction Protocol (`prisma.$transaction`):**
  1. **Authenticate Administrator:** Verify active session token, decode admin identity, verify `isActive = true`.
  2. **Check Server-Side Permission:** Verify caller has required role/permission for the specific domain (`services:publish`, `pricing:publish`, etc.).
  3. **Validate Expected Content Version:** OCC check: `ContentItem.version === expectedVersion`. If mismatched, abort with `409 Conflict`.
  4. **Validate Working Revision Ownership:** Fetch `workingRevision` using `revisionId`. Assert `workingRevision !== null`, `workingRevision.contentItemId === contentItem.id`, and `workingRevision.revisionStatus` is eligible (`WORKING_DRAFT`, `PENDING_REVIEW`, or `APPROVED`).
  5. **Validate Content-Specific Constraints:** Deserialize `workingRevision.snapshotData` and validate against domain Zod schema (deliverables, positive pricing, required SEO).
  6. **Update Materialized Domain Record:** Upsert the materialized table (`Service`, `PricingPackage`, etc.) with validated snapshot fields, setting `isActive = true`, `updatedAt = now()`.
  7. **Update Published Revision Pointer & Item State:** Update `ContentItem`:
     - `currentPublishedRevisionId = workingRevision.id`
     - `publicationStatus = PUBLISHED`
     - `version = version + 1`
     - `publishedAt = now()`
     - `publishedById = admin.id`
     - Update `ContentRevision`: `revisionStatus = PUBLISHED_SNAPSHOT`, `isPublishedSnapshot = true`.
  8. **Record Publishing Audit Event:** Create immutable `AuditLog` entry (`action: "CONTENT_PUBLISHED"`).
  9. **Commit the Transaction:** Complete transaction. Failure at any step rolls back all writes.
- **Post-Commit:** Invokes `revalidateTag(cacheTag)` and `revalidatePath(path)`.
- **Output:** `ActionResult<{ contentItemId: string; publishedRevisionId: string; version: number }>`

#### `archiveContentItemAction`
- **Permission:** `content:archive` (`SUPER_ADMIN`, `ADMIN`; `EDITOR` DENIED)
- **Input Schema:** `{ contentItemId: z.string().cuid() }`
- **Transaction Behavior:**
  1. Sets `ContentItem.publicationStatus = "ARCHIVED"`.
  2. Deactivates domain record (`isActive = false`).
  3. Clears cache tags.
  4. Records `CMS_ITEM_ARCHIVED`.
- **Output:** `ActionResult<{ contentItemId: string; status: "ARCHIVED" }>`

#### `restoreRevisionAction` [SAFEGUARD 1 — APPEND-ONLY RESTORATION]
- **Permission:** `content:restore` (`SUPER_ADMIN`, `ADMIN`; `EDITOR` DENIED)
- **Input Schema:** `{ revisionId: z.string().cuid() }`
- **Behavior:**
  1. Reads target historical `ContentRevision`.
  2. Determines `maxVersion = max(versionNumber)` for this `contentItemId`.
  3. Creates a **NEW** `ContentRevision` with `versionNumber = maxVersion + 1`, `revisionStatus = "WORKING_DRAFT"`, copying `snapshotData`. Sets `ContentItem.currentWorkingRevisionId = newRevision.id`.
  4. Historical revisions are **never mutated or overwritten**.
  5. Records `CMS_VERSION_RESTORED`.
- **Output:** `ActionResult<{ newRevisionId: string; newVersion: number }>`

---

## 4. Pricing Management Actions (`src/server/actions/cms/pricing.actions.ts`)

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

#### `publishPricingAction` [SAFEGUARD 3 & DECISION 7 — PRICING RBAC RESTRICTION]
- **Permission:** `pricing:publish` (`SUPER_ADMIN`, `ADMIN` ONLY; `EDITOR` STRICTLY DENIED)
- **Input Schema:** `{ contentItemId: z.string().cuid(), revisionId: z.string().cuid(), expectedVersion: z.number() }`
- **Behavior:** Executes 9-step atomic transaction. Promotes pricing revision atomically to `PricingPackage` table, invalidates `pricing-tiers` cache tag.
- **Output:** `ActionResult<{ packageId: string; priceInr: number }>`

---

## 5. Testimonial Verification & Publishing Actions (`src/server/actions/cms/testimonials.actions.ts`)

#### `verifyTestimonialAction` [SAFEGUARD 4 — SINGLE AUTHORITATIVE VERIFICATION]
- **Permission:** `testimonials:verify` (`SUPER_ADMIN`, `ADMIN` ONLY)
- **Input Schema:**
  ```typescript
  const VerifyTestimonialSchema = z.object({
    contentItemId: z.string().cuid(),
    verificationRecordNotes: z.string().min(10, "Verification notes required"),
  });
  ```
- **Behavior:** Updates `Testimonial`:
  - `verificationStatus = "VERIFIED"`
  - `verifiedById = currentAdmin.id`
  - `verifiedAt = now()`
- **Output:** `ActionResult<Testimonial>`

#### `recordClientConsentAction` [SAFEGUARD 4 — LEGAL CONSENT CONFIRMATION]
- **Permission:** `testimonials:verify` (`SUPER_ADMIN`, `ADMIN` ONLY)
- **Input Schema:**
  ```typescript
  const RecordConsentSchema = z.object({
    contentItemId: z.string().cuid(),
    consentEvidenceUrl: z.string().url("Must reference verifiable consent documentation"),
  });
  ```
- **Behavior:** Updates `Testimonial`:
  - `clientConsentStatus = "GRANTED"`
  - `clientConsentRecordedAt = now()`
  - `consentEvidenceUrl = input.consentEvidenceUrl`
- **Output:** `ActionResult<Testimonial>`

#### `revokeTestimonialConsentAction` [SAFEGUARD 4 — INSTANT UNLISTING]
- **Permission:** `testimonials:verify` (`SUPER_ADMIN`, `ADMIN`)
- **Input Schema:** `{ contentItemId: z.string().cuid(), reason: z.string().min(5) }`
- **Behavior:** In an atomic transaction, sets `clientConsentStatus = "REVOKED"`, `status = "ARCHIVED"`, `isActive = false`, immediately unlisting the quote across all public queries at the SQL level.
- **Output:** `ActionResult<{ status: "REVOKED"; isActive: false }>`

---

## 6. Media Management Actions (`src/server/actions/cms/media.actions.ts`)

#### `uploadMediaAction` [SAFEGUARD 5 — HARDENED MEDIA DEFAULTS]
- **Permission:** `media:upload` (`SUPER_ADMIN`, `ADMIN`, `EDITOR`)
- **Input:** `FormData` with fields:
  - `file`: `File` (Max 5.0 MB)
  - `defaultAltText`: `string` (Min 5 chars, mandatory)
  - `caption`: `string` (Optional)
- **Security Pipeline:**
  1. Rejects SVG uploads by default (`SVG uploads are disabled by default in initial implementation`).
  2. Sniffs file buffer magic bytes:
     - JPEG (`FF D8 FF`)
     - PNG (`89 50 4E 47`)
     - WebP (`52 49 46 46 ... 57 45 42 50`)
  3. Re-encodes raster formats to optimized WebP via Sharp, stripping all EXIF and metadata.
  4. Generates cryptographically safe storage key: `uploads/${year}/${month}/${crypto.randomUUID()}.webp`.
  5. Validates key against path traversal (`..` and slashes stripped).
  6. Restricts storage backend to local development filesystem. Forbids ephemeral serverless storage.
  7. Creates `MediaAsset` record storing `provider`, `storageKey`, `sha256Hash`.
- **Output:** `ActionResult<MediaAsset>`

#### `deleteMediaAction`
- **Permission:** `media:delete` (`SUPER_ADMIN` ONLY)
- **Input Schema:** `{ id: z.string().cuid() }`
- **Behavior:** Deletes from storage provider and removes database row.
- **Output:** `ActionResult<{ deletedId: string }>`

---

## 7. Next.js Draft Mode API Routes

### 7.1 Preview Activation: `GET /api/draft/preview`
- **Query Parameters:**
  - `secret`: Must match server `DRAFT_PREVIEW_SECRET`.
  - `contentType`: `SERVICE | PRICING_PACKAGE | PORTFOLIO_PROJECT | PAGE_SECTION`
  - `slug`: Content item slug.
- **Handler Security:**
  1. Constant-time timing-safe secret check: `crypto.timingSafeEqual(...)`.
  2. Validates session cookie to ensure caller is an authenticated administrator.
  3. Sets `__prerender_bypass` cookie via Next.js `draftMode().enable()`.
  4. Resolves `currentWorkingRevisionId` from `ContentItem`.
  5. Validates target redirect path is relative (prevents open redirects).
  6. Redirects to target page.
  7. Injected HTTP Header: `X-Robots-Tag: noindex, nofollow`.

### 7.2 Preview Exit: `GET /api/draft/exit`
- Disables draft mode via `draftMode().disable()`.
- Clears bypass cookie.
- Redirects to public canonical route.
