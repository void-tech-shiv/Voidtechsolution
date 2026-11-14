import type { UserRole } from "@prisma/client";

import { AuthorizationError, type UserSubject } from "./rbac";

/**
 * VOIDTECH SOLUTION — CMS Role-Based Access Control (RBAC) Matrix
 * 
 * Implements the approved CMS authorization policies from CMS_RBAC_PERMISSION_MATRIX.md:
 * - SUPER_ADMIN: Unilateral authority across all CMS operations.
 * - ADMIN: Full publishing and editing authority, except permanent deletions and site_settings.
 * - EDITOR: Draft authoring and media upload. STRICTLY DENIED from publishing live content,
 *           altering live pricing, archiving/deleting content, uploading SVGs, or restoring versions.
 */

export type CmsPermissionKey =
  // Base Navigation & Inspection
  | "content:view"
  | "content:restore"

  // Services Management
  | "services:create"
  | "services:edit"
  | "services:publish"
  | "services:archive"
  | "services:delete"

  // Pricing Tiers (Strict Commercial Controls)
  | "pricing:edit_draft"
  | "pricing:publish"
  | "pricing:archive"
  | "pricing:restore"
  | "pricing:delete"

  // Portfolio & Case Studies
  | "portfolio:create"
  | "portfolio:edit"
  | "portfolio:publish"
  | "portfolio:archive"
  | "portfolio:delete"

  // FAQs & Knowledgebase
  | "faqs:create"
  | "faqs:edit"
  | "faqs:reorder"
  | "faqs:delete"

  // Editorial Page Sections
  | "sections:edit"
  | "sections:publish"

  // Testimonials & Verification
  | "testimonials:create"
  | "testimonials:verify"
  | "testimonials:publish"
  | "testimonials:delete"

  // SEO & Indexing Directives
  | "seo:manage"

  // Media Assets
  | "media:upload"
  | "media:upload_svg"
  | "media:edit_meta"
  | "media:delete"

  // Site Configuration
  | "settings:manage";

export const CMS_ROLE_PERMISSIONS: Record<UserRole, readonly CmsPermissionKey[]> = {
  SUPER_ADMIN: [
    "content:view",
    "content:restore",
    "services:create",
    "services:edit",
    "services:publish",
    "services:archive",
    "services:delete",
    "pricing:edit_draft",
    "pricing:publish",
    "pricing:archive",
    "pricing:restore",
    "pricing:delete",
    "portfolio:create",
    "portfolio:edit",
    "portfolio:publish",
    "portfolio:archive",
    "portfolio:delete",
    "faqs:create",
    "faqs:edit",
    "faqs:reorder",
    "faqs:delete",
    "sections:edit",
    "sections:publish",
    "testimonials:create",
    "testimonials:verify",
    "testimonials:publish",
    "testimonials:delete",
    "seo:manage",
    "media:upload",
    // "media:upload_svg" intentionally omitted: SVG disabled by default for ALL roles
    "media:edit_meta",
    "media:delete",
    "settings:manage",
  ],
  ADMIN: [
    "content:view",
    "content:restore",
    "services:create",
    "services:edit",
    "services:publish",
    "services:archive",
    "pricing:edit_draft",
    "pricing:publish",
    "pricing:archive",
    "pricing:restore",
    "portfolio:create",
    "portfolio:edit",
    "portfolio:publish",
    "portfolio:archive",
    "faqs:create",
    "faqs:edit",
    "faqs:reorder",
    "faqs:delete",
    "sections:edit",
    "sections:publish",
    "testimonials:create",
    "testimonials:verify",
    "testimonials:publish",
    "seo:manage",
    "media:upload",
    "media:edit_meta",
  ],
  EDITOR: [
    "content:view",
    "services:create",
    "services:edit",
    "pricing:edit_draft",
    "portfolio:create",
    "portfolio:edit",
    "faqs:create",
    "faqs:edit",
    "sections:edit",
    "testimonials:create",
    "media:upload",
    "media:edit_meta",
  ],
};

export function hasCmsPermission(role: UserRole, permission: CmsPermissionKey): boolean {
  const permissions = CMS_ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions.includes(permission);
}

export function requireCmsPermission(
  user: UserSubject | null | undefined,
  permission: CmsPermissionKey
): void {
  if (!user) {
    throw new AuthorizationError("Authentication required.", "UNAUTHENTICATED", 401);
  }

  if (!user.isActive) {
    throw new AuthorizationError(
      "Administrator account is currently deactivated. Access denied.",
      "ACCOUNT_DEACTIVATED",
      403
    );
  }

  if (!hasCmsPermission(user.role, permission)) {
    throw new AuthorizationError(
      `Forbidden: Administrator role '${user.role}' lacks the required CMS permission '${permission}'.`,
      "FORBIDDEN",
      403
    );
  }
}
