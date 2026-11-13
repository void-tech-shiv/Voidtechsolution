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
 * Note: Pointers (currentPublishedRevisionId, currentWorkingRevisionId), publishedAt,
 * publishedById, and version are strictly server-managed and prohibited in client input.
 */
export const createContentItemSchema = z.object({
  contentType: z.nativeEnum(ContentType, {
    errorMap: () => ({
      message:
        "Invalid contentType. Must be one of: SERVICE, PRICING_PACKAGE, PORTFOLIO_PROJECT, FAQ, PAGE_SECTION, TESTIMONIAL",
    }),
  }),
  slug: slugSchema,
  publicationStatus: z
    .nativeEnum(ContentPublicationStatus, {
      errorMap: () => ({ message: "Invalid publicationStatus" }),
    })
    .default(ContentPublicationStatus.DRAFT),
});

export type CreateContentItemInput = z.infer<typeof createContentItemSchema>;

/**
 * Validates payload for updating ContentItem metadata.
 * OCC protection: expectedVersion is required when performing concurrent state transitions.
 * Pointers remain strictly server-managed.
 */
export const updateContentItemSchema = z.object({
  id: entityIdSchema,
  slug: slugSchema.optional(),
  publicationStatus: z.nativeEnum(ContentPublicationStatus).optional(),
  expectedVersion: z
    .number()
    .int("Version must be an integer")
    .positive("Version must be greater than 0")
    .optional(),
});

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
