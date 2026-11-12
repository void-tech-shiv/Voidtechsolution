import { prisma } from "@/lib/prisma";
import type { LeadActivity, Prisma } from "@prisma/client";

export interface CreateLeadActivityInput {
  enquiryId: string;
  type: string; // e.g. "STATUS_CHANGE", "ASSIGNMENT", "NOTE_ADDED", "FOLLOWUP_CREATED", "FOLLOWUP_COMPLETED"
  description: string;
  actorId?: string | null;
  actorName?: string | null;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Records an immutable lifecycle activity event on a lead.
 * History is append-only and cannot be rewritten by normal workflows.
 */
export async function createLeadActivity(
  input: CreateLeadActivityInput,
  tx?: Prisma.TransactionClient
): Promise<LeadActivity> {
  const db = tx || prisma;
  try {
    return await db.leadActivity.create({
      data: {
        enquiryId: input.enquiryId,
        type: input.type,
        description: input.description,
        actorId: input.actorId || null,
        actorName: input.actorName || null,
        metadata: input.metadata || undefined,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[lead-activities.repo] createLeadActivity failed:", msg);
    throw new Error(`Failed to record lead activity for '${input.enquiryId}': Database write operation failed.`);
  }
}

/**
 * Retrieves the activity timeline for a specific lead, ordered chronologically.
 */
export async function getLeadActivities(
  enquiryId: string,
  limit = 100
): Promise<LeadActivity[]> {
  try {
    return await prisma.leadActivity.findMany({
      where: { enquiryId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  } catch (error) {
    console.warn(`[lead-activities.repo] getLeadActivities failed for enquiry '${enquiryId}':`, error);
    return [];
  }
}
