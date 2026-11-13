import { z } from "zod";
import { entityIdSchema } from "./common.schema";

/**
 * Submit Revision For Review Schema
 * 
 * Initiates editorial review of a draft revision (DRAFT -> IN_REVIEW).
 */
export const submitForReviewSchema = z.object({
  contentItemId: entityIdSchema,
  revisionId: entityIdSchema,
  notes: z
    .string()
    .trim()
    .max(1000, "Review submission notes cannot exceed 1000 characters")
    .optional(),
});

export type SubmitForReviewInput = z.infer<typeof submitForReviewSchema>;

/**
 * Approve Revision Schema
 * 
 * Approves a revision under editorial review (IN_REVIEW -> APPROVED).
 */
export const approveRevisionSchema = z.object({
  contentItemId: entityIdSchema,
  revisionId: entityIdSchema,
  approvalNotes: z
    .string()
    .trim()
    .max(1000, "Approval notes cannot exceed 1000 characters")
    .optional(),
});

export type ApproveRevisionInput = z.infer<typeof approveRevisionSchema>;

/**
 * Reject Revision Schema
 * 
 * Rejects a revision under review, providing actionable feedback (IN_REVIEW -> REJECTED).
 * A rejection reason of at least 5 characters is mandatory.
 */
export const rejectRevisionSchema = z.object({
  contentItemId: entityIdSchema,
  revisionId: entityIdSchema,
  rejectionReason: z
    .string({ required_error: "A rejection reason must be provided" })
    .trim()
    .min(5, "Rejection reason must be at least 5 characters explaining what needs revision")
    .max(1000, "Rejection reason cannot exceed 1000 characters"),
});

export type RejectRevisionInput = z.infer<typeof rejectRevisionSchema>;

/**
 * Publish Revision Schema
 * 
 * Promotes an approved or draft revision to the live published state.
 * Implements Optimistic Concurrency Control (OCC) via expectedVersion.
 * Note: Pointers and timestamps are strictly materialized server-side.
 */
export const publishRevisionSchema = z.object({
  contentItemId: entityIdSchema,
  revisionId: entityIdSchema,
  expectedVersion: z
    .number({
      required_error:
        "expectedVersion is required for Optimistic Concurrency Control (OCC)",
    })
    .int("Version must be an integer")
    .positive("Version must be greater than 0"),
  changeSummary: z
    .string()
    .trim()
    .max(500, "Change summary cannot exceed 500 characters")
    .optional(),
});

export type PublishRevisionInput = z.infer<typeof publishRevisionSchema>;

/**
 * Archive Content Item Schema
 * 
 * Moves a content item and its published revision to ARCHIVED status.
 * Requires expectedVersion for OCC.
 */
export const archiveContentSchema = z.object({
  contentItemId: entityIdSchema,
  expectedVersion: z
    .number({
      required_error: "expectedVersion is required for OCC verification",
    })
    .int("Version must be an integer")
    .positive("Version must be greater than 0"),
  reason: z
    .string()
    .trim()
    .max(500, "Archive reason cannot exceed 500 characters")
    .optional(),
});

export type ArchiveContentInput = z.infer<typeof archiveContentSchema>;

/**
 * Restore Content Item Schema
 * 
 * Restores an ARCHIVED content item back to DRAFT status.
 * Requires expectedVersion for OCC.
 */
export const restoreContentSchema = z.object({
  contentItemId: entityIdSchema,
  expectedVersion: z
    .number({
      required_error: "expectedVersion is required for OCC verification",
    })
    .int("Version must be an integer")
    .positive("Version must be greater than 0"),
});

export type RestoreContentInput = z.infer<typeof restoreContentSchema>;
