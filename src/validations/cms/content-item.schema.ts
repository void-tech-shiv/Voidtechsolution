import { z } from "zod";
import {
  ContentType,
  ContentPublicationStatus,
} from "@/types/cms";
import {
  slugSchema,
  entityIdSchema,
  paginationSchema,
  sortOrderSchema,
  searchQuerySchema,
} from "./common.schema";

/**
 * Validates payload for creating a new canonical ContentItem.
 * Security Rules:
 * - New content items must always start in DRAFT status.
 * - publicationStatus can only be explicitly DRAFT or omitted (defaults to DRAFT).
 * - Direct creation as PUBLISHED or ARCHIVED is strictly rejected.
 * - Internal pointers (currentPublishedRevisionId, currentWorkingRevisionId),
 *   version, publishedAt, and publishedById are strictly forbidden.
 */
export const createContentItemSchema = z
  .object({
    contentType: z.nativeEnum(ContentType, {
      errorMap: () => ({
        message:
          "Invalid contentType. Must be one of: SERVICE, PRICING_PACKAGE, PORTFOLIO_PROJECT, FAQ, PAGE_SECTION, TESTIMONIAL",
      }),
    }),
    slug: slugSchema,
    publicationStatus: z
      .literal(ContentPublicationStatus.DRAFT, {
        errorMap: () => ({
          message:
            "New content items must start in DRAFT status. Direct publication or archival on creation is forbidden.",
        }),
      })
      .default(ContentPublicationStatus.DRAFT),
  })
  .strict();

export type CreateContentItemInput = z.infer<typeof createContentItemSchema>;

/**
 * Validates payload for updating ContentItem metadata.
 * Security & OCC Rules:
 * - Generic updates are strictly for content item metadata (e.g. slug).
 * - Lifecycle status transitions (PUBLISHED, ARCHIVED) are strictly forbidden here;
 *   publication and archival must exclusively occur through dedicated operation schemas
 *   (publishRevisionSchema, archiveContentSchema, restoreContentSchema).
 * - expectedVersion is mandatory for Optimistic Concurrency Control (OCC).
 * - Pointers, version, and publication timestamps are strictly forbidden.
 */
export const updateContentItemSchema = z
  .object({
    id: entityIdSchema,
    slug: slugSchema.optional(),
    expectedVersion: z
      .number({
        required_error:
          "expectedVersion is required for Optimistic Concurrency Control (OCC)",
      })
      .int("Version must be an integer")
      .positive("Version must be greater than 0")
      .max(2147483647, "Version exceeds maximum 32-bit integer boundary"),
  })
  .strict();

export type UpdateContentItemInput = z.infer<typeof updateContentItemSchema>;

/**
 * Allowed sort fields for ContentItem listings
 */
export const contentItemSortFields = [
  "createdAt",
  "updatedAt",
  "slug",
  "version",
  "contentType",
] as const;

/**
 * Filter and pagination schema for listing ContentItems
 */
export const contentItemQuerySchema = paginationSchema.extend({
  contentType: z.nativeEnum(ContentType).optional(),
  publicationStatus: z.nativeEnum(ContentPublicationStatus).optional(),
  search: searchQuerySchema,
  sortBy: z.enum(contentItemSortFields).default("updatedAt"),
  sortOrder: sortOrderSchema,
});

export type ContentItemQueryInput = z.infer<typeof contentItemQuerySchema>;
