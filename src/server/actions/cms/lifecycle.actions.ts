/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";


import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/server/actions/auth.actions";
import {
  publishContentItem,
  archiveContentItem,
} from "@/server/services/cms/publishing.service";
import {
  createWorkingRevision,
  pruneWorkingDraftRevisions,
} from "@/server/repositories/cms/content-revision.repo";
import {
  submitForReviewSchema,
  rejectRevisionSchema,
  publishRevisionSchema,
  archiveContentSchema,
  type SubmitForReviewInput,
  type RejectRevisionInput,
  type PublishRevisionInput,
  type ArchiveContentInput,
} from "@/validations/cms";

import {
  ContentItemNotFoundError,
  ContentRevisionNotFoundError,
} from "@/server/repositories/cms/cms-repository.errors";

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Saves or updates a working draft revision.
 */
export async function saveContentDraftAction(input: {
  contentItemId: string;
  title: string;
  snapshotData: Record<string, unknown>;
  changeSummary?: string;
}): Promise<ActionResult<{ revisionId: string; versionNumber: number }>> {
  try {
    const current = await getCurrentAdmin();
    if (!current || !current.user.isActive) {
      return {
        success: false,
        error: { code: "UNAUTHENTICATED", message: "Active administrator session required." },
      };
    }

    const item = await prisma.contentItem.findUnique({
      where: { id: input.contentItemId },
    });
    if (!item) {
      throw new ContentItemNotFoundError(input.contentItemId);
    }

    const revision = await createWorkingRevision({
      contentItemId: input.contentItemId,
      title: input.title,
      snapshotData: input.snapshotData as any,
      authorId: current.user.id,
      authorName: current.user.name,
      changeSummary: input.changeSummary || null,
    });


    // Prune excess drafts (retention limit: 20)
    await pruneWorkingDraftRevisions(input.contentItemId);

    return {
      success: true,
      data: {
        revisionId: revision.id,
        versionNumber: revision.versionNumber,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to save draft revision.";
    return {
      success: false,
      error: { code: "DRAFT_SAVE_FAILED", message: msg },
    };
  }
}

/**
 * Submits a draft revision for editorial review.
 */
export async function submitForReviewAction(
  rawInput: SubmitForReviewInput
): Promise<ActionResult<{ revisionId: string; status: string }>> {
  try {
    const current = await getCurrentAdmin();
    if (!current || !current.user.isActive) {
      return {
        success: false,
        error: { code: "UNAUTHENTICATED", message: "Active administrator session required." },
      };
    }

    const validated = submitForReviewSchema.parse(rawInput);

    const revision = await prisma.contentRevision.findUnique({
      where: { id: validated.revisionId },
    });
    if (!revision) {
      throw new ContentRevisionNotFoundError(validated.revisionId);
    }

    const updated = await prisma.contentRevision.update({
      where: { id: validated.revisionId },
      data: {
        revisionStatus: "PENDING_REVIEW",
        changeSummary: validated.notes ?? revision.changeSummary,
      },
    });

    return {
      success: true,
      data: {
        revisionId: updated.id,
        status: updated.revisionStatus,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to submit revision for review.";
    return {
      success: false,
      error: { code: "SUBMIT_REVIEW_FAILED", message: msg },
    };
  }
}

/**
 * Rejects a revision under review with actionable feedback.
 */
export async function rejectRevisionAction(
  rawInput: RejectRevisionInput
): Promise<ActionResult<{ revisionId: string; status: string }>> {
  try {
    const current = await getCurrentAdmin();
    if (!current || !current.user.isActive) {
      return {
        success: false,
        error: { code: "UNAUTHENTICATED", message: "Active administrator session required." },
      };
    }

    // Role check: Only SUPER_ADMIN and ADMIN can reject revisions
    if (current.user.role === "EDITOR") {
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "Editors cannot reject editorial revisions." },
      };
    }

    const validated = rejectRevisionSchema.parse(rawInput);

    const updated = await prisma.contentRevision.update({
      where: { id: validated.revisionId },
      data: {
        revisionStatus: "REJECTED",
        rejectionNote: validated.rejectionReason,
      },
    });

    return {
      success: true,
      data: {
        revisionId: updated.id,
        status: updated.revisionStatus,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to reject revision.";
    return {
      success: false,
      error: { code: "REJECT_FAILED", message: msg },
    };
  }
}

/**
 * Executes 9-step atomic publishing transaction for a ContentItem revision.
 */
export async function publishRevisionAction(
  rawInput: PublishRevisionInput
): Promise<ActionResult<{ contentItemId: string; publishedRevisionId: string; version: number }>> {
  try {
    const current = await getCurrentAdmin();
    if (!current || !current.user.isActive) {
      return {
        success: false,
        error: { code: "UNAUTHENTICATED", message: "Active administrator session required." },
      };
    }

    // Role check: Only SUPER_ADMIN and ADMIN can publish
    if (current.user.role === "EDITOR") {
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "Editors are strictly prohibited from publishing live content." },
      };
    }

    const validated = publishRevisionSchema.parse(rawInput);

    const result = await publishContentItem({
      contentItemId: validated.contentItemId,
      revisionId: validated.revisionId,
      expectedVersion: validated.expectedVersion,
      actor: current.user,
      changeSummary: validated.changeSummary,
    });

    // Invalidate public caches on publication
    try {
      revalidatePath("/");
      revalidatePath(`/${result.slug}`);
      revalidatePath("/services");
      revalidatePath("/pricing");
      revalidatePath("/portfolio");
    } catch {
      // Revalidation best-effort outside request scope
    }

    return {
      success: true,
      data: {
        contentItemId: result.contentItemId,
        publishedRevisionId: result.publishedRevisionId,
        version: result.version,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to publish revision.";
    const code = err instanceof Object && "code" in err ? String(err.code) : "PUBLISH_FAILED";
    return {
      success: false,
      error: { code, message: msg },
    };
  }
}

/**
 * Archives a ContentItem and deactivates its domain record.
 */
export async function archiveContentItemAction(
  rawInput: ArchiveContentInput
): Promise<ActionResult<{ contentItemId: string; version: number }>> {
  try {
    const current = await getCurrentAdmin();
    if (!current || !current.user.isActive) {
      return {
        success: false,
        error: { code: "UNAUTHENTICATED", message: "Active administrator session required." },
      };
    }

    if (current.user.role === "EDITOR") {
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "Editors cannot archive content items." },
      };
    }

    const validated = archiveContentSchema.parse(rawInput);

    const result = await archiveContentItem({
      contentItemId: validated.contentItemId,
      expectedVersion: validated.expectedVersion,
      actor: current.user,
      reason: validated.reason,
    });



    try {
      revalidatePath("/");
      revalidatePath("/services");
      revalidatePath("/pricing");
      revalidatePath("/portfolio");
    } catch {
      // Best effort
    }

    return {
      success: true,
      data: result,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to archive content item.";
    const code = err instanceof Object && "code" in err ? String(err.code) : "ARCHIVE_FAILED";
    return {
      success: false,
      error: { code, message: msg },
    };
  }
}

/**
 * Restores a historical ContentRevision by copying its snapshotData into a new working draft.
 * Append-only: Historical revisions are NEVER mutated or overwritten.
 */
export async function restoreRevisionAction(
  revisionId: string
): Promise<ActionResult<{ newRevisionId: string; versionNumber: number }>> {
  try {
    const current = await getCurrentAdmin();
    if (!current || !current.user.isActive) {
      return {
        success: false,
        error: { code: "UNAUTHENTICATED", message: "Active administrator session required." },
      };
    }

    if (current.user.role === "EDITOR") {
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "Editors cannot restore historical revisions." },
      };
    }

    const targetRev = await prisma.contentRevision.findUnique({
      where: { id: revisionId },
    });
    if (!targetRev) {
      throw new ContentRevisionNotFoundError(revisionId);
    }

    const newRev = await createWorkingRevision({
      contentItemId: targetRev.contentItemId,
      title: `Restored from v${targetRev.versionNumber}: ${targetRev.title}`,
      snapshotData: targetRev.snapshotData as any,
      authorId: current.user.id,
      authorName: current.user.name,
      changeSummary: `Restored snapshot from revision v${targetRev.versionNumber}`,
    });

    return {
      success: true,
      data: {
        newRevisionId: newRev.id,
        versionNumber: newRev.versionNumber,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to restore revision.";
    return {
      success: false,
      error: { code: "RESTORE_FAILED", message: msg },
    };
  }
}
