import { z } from "zod";
import {
  entityIdSchema,
  paginationSchema,
  sortOrderSchema,
  safeJsonSchema,
  safeJsonKeySchema,
  optionalHttpUrlSchema,
} from "./common.schema";

/**
 * Maximum character length for PageSection markdown content (50,000 characters)
 */
export const MAX_PAGE_SECTION_CONTENT_LENGTH = 50000;

/**
 * Validates section key (e.g. "home-hero", "services-overview", "cta-footer")
 */
export const sectionKeySchema = z
  .string()
  .trim()
  .min(2, "Section key must be at least 2 characters")
  .max(100, "Section key cannot exceed 100 characters")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Section key must be lowercase alphanumeric with single hyphens (e.g., 'home-hero')"
  );

/**
 * Validates payload for creating a new editorial PageSection
 */
export const createPageSectionSchema = z.object({
  key: sectionKeySchema,
  pageSlug: z
    .string()
    .trim()
    .min(1, "Page slug is required")
    .max(100, "Page slug cannot exceed 100 characters"),
  title: z
    .string()
    .trim()
    .min(1, "Section title is required")
    .max(200, "Section title cannot exceed 200 characters"),
  subtitle: z
    .string()
    .trim()
    .max(300, "Subtitle cannot exceed 300 characters")
    .optional()
    .nullable(),
  content: z
    .string()
    .min(1, "Section content cannot be empty")
    .max(
      MAX_PAGE_SECTION_CONTENT_LENGTH,
      `Section content cannot exceed ${MAX_PAGE_SECTION_CONTENT_LENGTH.toLocaleString()} characters`
    ),
  metadata: z
    .record(safeJsonKeySchema, safeJsonSchema)
    .optional()
    .nullable(),
  mediaUrl: optionalHttpUrlSchema,
  orderIndex: z
    .number()
    .int("Order index must be an integer")
    .min(0, "Order index cannot be negative")
    .default(0),
  isActive: z.boolean().default(true),
  contentItemId: entityIdSchema.optional().nullable(),
});

export type CreatePageSectionInput = z.infer<typeof createPageSectionSchema>;

/**
 * Validates payload for updating an existing PageSection
 */
export const updatePageSectionSchema = z.object({
  id: entityIdSchema,
  key: sectionKeySchema.optional(),
  pageSlug: z
    .string()
    .trim()
    .min(1, "Page slug cannot be empty")
    .max(100, "Page slug cannot exceed 100 characters")
    .optional(),
  title: z
    .string()
    .trim()
    .min(1, "Section title cannot be empty")
    .max(200, "Section title cannot exceed 200 characters")
    .optional(),
  subtitle: z
    .string()
    .trim()
    .max(300, "Subtitle cannot exceed 300 characters")
    .optional()
    .nullable(),
  content: z
    .string()
    .min(1, "Section content cannot be empty")
    .max(
      MAX_PAGE_SECTION_CONTENT_LENGTH,
      `Section content cannot exceed ${MAX_PAGE_SECTION_CONTENT_LENGTH.toLocaleString()} characters`
    )
    .optional(),
  metadata: z
    .record(safeJsonKeySchema, safeJsonSchema)
    .optional()
    .nullable(),
  mediaUrl: optionalHttpUrlSchema,
  orderIndex: z
    .number()
    .int("Order index must be an integer")
    .min(0, "Order index cannot be negative")
    .optional(),
  isActive: z.boolean().optional(),
});

export type UpdatePageSectionInput = z.infer<typeof updatePageSectionSchema>;

/**
 * Filter and pagination schema for listing PageSections
 */
export const pageSectionQuerySchema = paginationSchema.extend({
  pageSlug: z.string().trim().max(100).optional(),
  isActive: z.coerce.boolean().optional(),
  sortBy: z.enum(["orderIndex", "createdAt", "updatedAt", "key"]).default("orderIndex"),
  sortOrder: sortOrderSchema.default("asc"),
});

export type PageSectionQueryInput = z.infer<typeof pageSectionQuerySchema>;
