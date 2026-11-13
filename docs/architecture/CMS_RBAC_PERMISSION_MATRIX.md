# CMS_RBAC_PERMISSION_MATRIX.md — Role-Based Access Control Matrix

**Project:** VOIDTECH SOLUTION  
**Milestone:** Phase 10.0.1 — CMS Architecture Refinement & Design Freeze  
**Document Status:** FROZEN AUTHORIZATION SPECIFICATION [DESIGN FREEZE]  
**Author:** Google DeepMind Assistant  
**Approved By:** Project Owner  

---

## 1. Architectural Principles of CMS Authorization

In accordance with VOIDTECH security guidelines and owner approvals:
1. **Server-Side Exclusivity:** Client-side role checks are treated strictly as cosmetic UX affordances. The true security boundary is enforced exclusively inside Server Actions and Route Handlers via `requirePermission(user, key)`.
2. **Pricing Governance [OWNER APPROVED]:** Publishing, modifying live prices in INR, archiving, and restoring pricing tiers is restricted strictly to `SUPER_ADMIN` and `ADMIN`. `EDITOR` can only author draft pricing proposals.
3. **Dual Approval for High-Risk Actions:** Publishing marketing claims or testimonials requires `ADMIN` or `SUPER_ADMIN` review.
4. **Master Account Inviolability:** The sole `SUPER_ADMIN` account cannot be deleted, demoted, or deactivated.

---

## 2. Granular CMS Permission Keys

```typescript
export type CmsPermissionKey =
  // Base Navigation & Inspection
  | "content:view"              // View CMS dashboard and draft/published lists
  | "content:restore"           // Restore historical ContentRevision snapshot
  
  // Services Management
  | "services:create"           // Create new draft service offerings
  | "services:edit"             // Edit service drafts and descriptions
  | "services:publish"          // Publish service to live catalog
  | "services:archive"          // Archive / unlist service offering
  | "services:delete"           // Permanently delete service (SuperAdmin only)
  
  // Pricing Tiers (Strict Commercial Controls) [OWNER APPROVED]
  | "pricing:edit_draft"        // Create and edit draft pricing packages
  | "pricing:publish"           // Publish or alter live pricing tiers in INR
  | "pricing:archive"           // Archive published pricing tier
  | "pricing:restore"           // Restore historical pricing tier revision
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
  
  // Testimonials & Verification [OWNER APPROVED]
  | "testimonials:create"       // Draft new testimonial
  | "testimonials:verify"       // Audit consent evidence and approve testimonial
  | "testimonials:publish"      // Publish verified testimonial to live site
  | "testimonials:delete"       // Delete testimonial (SuperAdmin only)
  
  // SEO & Indexing Directives
  | "seo:manage"                // Update meta titles, descriptions, canonical URLs, robots
  
  // Media Assets [OWNER APPROVED]
  | "media:upload"              // Upload standard raster images (WebP, PNG, JPEG)
  | "media:upload_svg"          // Upload SVG vector graphics (Restricted privilege)
  | "media:edit_meta"           // Update alt text and captions
  | "media:delete"              // Permanently delete media file from storage
  
  // Site Configuration
  | "settings:manage";          // Manage global brand name, contact email, maintenance mode
```

---

## 3. Comprehensive Role-Permission Matrix

| CMS Operation / Permission Key | SUPER_ADMIN | ADMIN | EDITOR | Governance & Security Rationale |
|---|:---:|:---:|:---:|---|
| **`content:view`** | ✅ | ✅ | ✅ | Universal editorial inspection |
| **`services:create`** | ✅ | ✅ | ✅ | Editors can draft new service offerings |
| **`services:edit`** | ✅ | ✅ | ✅ | Editors can refine text, deliverables, and icons |
| **`services:publish`** | ✅ | ✅ | ❌ | **Editor Denied:** Operational review mandatory before publishing |
| **`services:archive`** | ✅ | ✅ | ❌ | **Editor Denied:** Archiving impacts public availability |
| **`services:delete`** | ✅ | ❌ | ❌ | **Super Admin Only:** Permanent deletion restricted to system owner |
| **`pricing:edit_draft`** [OWNER APPROVED] | ✅ | ✅ | ✅ | Editors can draft pricing proposals for review |
| **`pricing:publish`** [OWNER APPROVED] | ✅ | ✅ | ❌ | **Editor Strictly Denied:** Commercial revenue control |
| **`pricing:archive`** [OWNER APPROVED] | ✅ | ✅ | ❌ | **Editor Strictly Denied:** Only Admin/SuperAdmin can retire tiers |
| **`pricing:restore`** [OWNER APPROVED] | ✅ | ✅ | ❌ | **Editor Strictly Denied:** Restoring alters live public prices |
| **`pricing:delete`** | ✅ | ❌ | ❌ | **Super Admin Only:** Master commercial governance |
| **`portfolio:create`** | ✅ | ✅ | ✅ | Editors can draft architecture prototypes |
| **`portfolio:edit`** | ✅ | ✅ | ✅ | Editors can update descriptions, metrics, and tags |
| **`portfolio:publish`** | ✅ | ✅ | ❌ | **Editor Denied:** Anti-fabrication verification mandatory |
| **`portfolio:archive`** | ✅ | ✅ | ❌ | Admin or Super Admin |
| **`portfolio:delete`** | ✅ | ❌ | ❌ | Super Admin only |
| **`faqs:create`** | ✅ | ✅ | ✅ | Editors can propose new questions |
| **`faqs:edit`** | ✅ | ✅ | ✅ | Editors can refine answers |
| **`faqs:reorder`** | ✅ | ✅ | ❌ | Visual ordering controlled by management |
| **`faqs:delete`** | ✅ | ✅ | ❌ | Admin or Super Admin |
| **`sections:edit`** | ✅ | ✅ | ✅ | Editors can draft landing page copy |
| **`sections:publish`** | ✅ | ✅ | ❌ | **Editor Denied:** Homepage publishing requires Admin approval |
| **`testimonials:create`** | ✅ | ✅ | ✅ | Editors can draft testimonial submissions |
| **`testimonials:verify`** [OWNER APPROVED]| ✅ | ✅ | ❌ | **Editor Denied:** Consent audit required by management |
| **`testimonials:publish`** [OWNER APPROVED]| ✅ | ✅ | ❌ | **Editor Denied:** Multi-signature approval required |
| **`testimonials:delete`** | ✅ | ❌ | ❌ | Super Admin only |
| **`content:restore`** | ✅ | ✅ | ❌ | **Editor Denied:** Version rollbacks affect live site |
| **`seo:manage`** | ✅ | ✅ | ❌ | **Editor Denied:** Canonical and indexing tags affect search ranking |
| **`media:upload`** | ✅ | ✅ | ✅ | Standard raster image upload for drafting |
| **`media:upload_svg`** [OWNER APPROVED] | ✅ | ✅ | ❌ | **Editor Denied:** SVGs carry XSS risk; management only |
| **`media:edit_meta`**| ✅ | ✅ | ✅ | All roles can provide accessible alt text |
| **`media:delete`** | ✅ | ❌ | ❌ | **Super Admin Only:** Prevents broken images across site |
| **`settings:manage`** | ✅ | ❌ | ❌ | **Super Admin Only:** Global site settings governance |

---

## 4. Role Responsibility Profiles

### 4.1 SUPER_ADMIN (System Owner & Master Governance)
- **Identity:** Sole owner account (`SHIVANSHU SATYAJEET`).
- **CMS Authority:** Unilateral authority across all CMS operations. Sole account permitted to execute permanent deletions of services, pricing tiers, portfolio projects, and media files, and update global `site_settings`.

### 4.2 ADMIN (Operations & Editorial Manager)
- **CMS Authority:** Authority to review, approve, and publish content across services, portfolio, FAQs, and page sections. Full authority over pricing publication in INR. Authority to execute version rollbacks and audit client testimonial consent.
- **Restrictions:** Cannot permanently delete entities or media files; cannot modify global `site_settings`.

### 4.3 EDITOR (Content Creator & Copywriter)
- **CMS Authority:** Drafting services, portfolio case studies, FAQs, and page sections. Uploading standard raster images (WebP/PNG/JPEG). Creating draft pricing proposals (`pricing:edit_draft`).
- **Strict Restrictions [OWNER APPROVED]:** Cannot publish any live content. Cannot modify live pricing in INR. Cannot archive or delete content. Cannot upload raw SVGs. Cannot alter SEO indexing directives on published pages. Cannot restore historical revisions.
