/**
 * CMS Type Definitions & Generated Prisma Model Exports
 *
 * VOIDTECH SOLUTION — Phase 10 Admin CMS
 * Central type export hub for all CMS domain entities, enums, and DTO interfaces.
 */

// 1. Re-export Prisma Enums (accessible both as runtime values and type definitions)
export {
  ContentType,
  ContentPublicationStatus,
  RevisionLifecycleStatus,
  TestimonialVerificationStatus,
  ClientConsentStatus,
  StorageProviderType,
} from "@prisma/client";

// 2. Re-export Prisma Model Types (type-only exports to prevent runtime overhead)
export type {
  ContentItem,
  ContentRevision,
  PageSection,
  Testimonial,
  MediaAsset,
  Prisma,
} from "@prisma/client";

import type {
  ContentItem,
  ContentRevision,
  Testimonial,
  MediaAsset,
} from "@prisma/client";

// 3. Hydrated / Composite Content DTO Interfaces
export type ContentItemWithRevisions = ContentItem & {
  revisions: ContentRevision[];
  currentPublishedRevision: ContentRevision | null;
  currentWorkingRevision: ContentRevision | null;
};

export type ContentItemWithPointers = ContentItem & {
  currentPublishedRevision: ContentRevision | null;
  currentWorkingRevision: ContentRevision | null;
};

export type ContentRevisionWithAuthor = ContentRevision & {
  author?: {
    id: string;
    name: string;
    email: string;
  } | null;
};

export type TestimonialWithVerifier = Testimonial & {
  verifiedBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
};

export type MediaAssetWithUploader = MediaAsset & {
  uploader?: {
    id: string;
    name: string;
    email: string;
  } | null;
};

// 4. Standard CMS Operation & Fallback Result Interface
export interface CmsOperationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  source?: "database" | "static-fallback";
  isFallback?: boolean;
}
