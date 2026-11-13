import { z } from "zod";
import { RevisionLifecycleStatus } from "@/types/cms";
import {
  entityIdSchema,
  paginationSchema,
  sortOrderSchema,
  safeJsonSchema,
  safeJsonKeySchema,
} from "./common.schema";

/**
 * Validates payload for creating a new working draft revision.
 * Note: versionNumber, isPublishedSnapshot, authorId, and authorName are
 * strictly injected by the server from database sequence and authenticated session.
 */
export const createWorkingRevisionSchema = z.object({
  contentItemId: entityIdSchema,
  title: z
    .string()
    .trim()
    .min(1, "Revision title must be at least 1 character")
    .max(200, "Revision title cannot exceed 200 characters"),
  snapshotData: z
    .record(safeJsonKeySchema, safeJsonSchema)
    .refine(
      (data) => Object.keys(data).length > 0,
      "snapshotData must contain at least one content attribute"
    ),
  changeSummary: z
    .string()
    .trim()
    .max(500, "Change summary cannot exceed 500 characters")
    .optional(),
});

export type CreateWorkingRevisionInput = z.infer<
  typeof createWorkingRevisionSchema
>;

/**
 * Validates payload for updating an existing unpromoted working revision.
 * Only working drafts can be updated; published snapshots are rejected by database triggers.
 */
export const updateWorkingRevisionSchema = z.object({
  id: entityIdSchema,
  title: z
    .string()
    .trim()
    .min(1, "Revision title must be at least 1 character")
    .max(200, "Revision title cannot exceed 200 characters")
    .optional(),
  snapshotData: z
    .record(safeJsonKeySchema, safeJsonSchema)
    .optional(),
  changeSummary: z
    .string()
    .trim()
    .max(500, "Change summary cannot exceed 500 characters")
    .optional(),
});

export type UpdateWorkingRevisionInput = z.infer<
  typeof updateWorkingRevisionSchema
>;

/**
 * Filter and pagination schema for querying revision history of a ContentItem
 */
export const revisionQuerySchema = paginationSchema.extend({
  contentItemId: entityIdSchema.optional(),
  revisionStatus: z.nativeEnum(RevisionLifecycleStatus).optional(),
  isPublishedSnapshot: z
    .preprocess((val) => {
      if (typeof val === "string") {
        if (val.toLowerCase() === "true") return true;
        if (val.toLowerCase() === "false") return false;
      }
      return val;
    }, z.boolean().optional())
    .optional(),
  sortBy: z.enum(["createdAt", "versionNumber"]).default("versionNumber"),
  sortOrder: sortOrderSchema,
});

export type RevisionQueryInput = z.infer<typeof revisionQuerySchema>;
