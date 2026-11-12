import { prisma } from "@/lib/prisma";
import type { LeadFollowUp, Prisma } from "@prisma/client";

export interface CreateLeadFollowUpInput {
  enquiryId: string;
  assignedToId?: string | null;
  title: string;
  description?: string | null;
  dueAt: Date;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
}

/**
 * Creates a scheduled follow-up task for a lead.
 */
export async function createLeadFollowUp(
  input: CreateLeadFollowUpInput,
  tx?: Prisma.TransactionClient
): Promise<LeadFollowUp> {
  const db = tx || prisma;
  try {
    const followUp = await db.leadFollowUp.create({
      data: {
        enquiryId: input.enquiryId,
        assignedToId: input.assignedToId || null,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        dueAt: input.dueAt,
        priority: input.priority || "MEDIUM",
        isCompleted: false,
      },
    });

    // Update enquiry nextFollowUpAt if this is earlier or first
    await db.enquiry.update({
      where: { id: input.enquiryId },
      data: { nextFollowUpAt: input.dueAt },
    });

    return followUp;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[lead-followups.repo] createLeadFollowUp failed:", msg);
    throw new Error(`Failed to schedule follow-up for lead '${input.enquiryId}': Database write operation failed.`);
  }
}

/**
 * Retrieves all follow-up tasks for a specific lead.
 */
export async function getLeadFollowUps(enquiryId: string): Promise<LeadFollowUp[]> {
  try {
    return await prisma.leadFollowUp.findMany({
      where: { enquiryId },
      orderBy: [{ isCompleted: "asc" }, { dueAt: "asc" }],
    });
  } catch (error) {
    console.warn(`[lead-followups.repo] getLeadFollowUps failed for enquiry '${enquiryId}':`, error);
    return [];
  }
}

/**
 * Retrieves overdue follow-up tasks across the platform or for a specific administrator.
 */
export async function getOverdueFollowUps(assignedToId?: string): Promise<LeadFollowUp[]> {
  try {
    const where: Prisma.LeadFollowUpWhereInput = {
      isCompleted: false,
      dueAt: { lt: new Date() },
    };
    if (assignedToId) {
      where.assignedToId = assignedToId;
    }

    return await prisma.leadFollowUp.findMany({
      where,
      orderBy: { dueAt: "asc" },
    });
  } catch (error) {
    console.warn("[lead-followups.repo] getOverdueFollowUps failed:", error);
    return [];
  }
}

/**
 * Toggles a follow-up task's completion status.
 */
export async function toggleFollowUpComplete(
  followUpId: string,
  isCompleted: boolean,
  completedById?: string
): Promise<LeadFollowUp> {
  try {
    return await prisma.leadFollowUp.update({
      where: { id: followUpId },
      data: {
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
        completedById: isCompleted ? completedById || null : null,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error(`[lead-followups.repo] toggleFollowUpComplete failed for '${followUpId}':`, msg);
    throw new Error(`Failed to update follow-up '${followUpId}': Database write operation failed.`);
  }
}

/**
 * Deletes a scheduled follow-up task.
 */
export async function deleteLeadFollowUp(followUpId: string): Promise<LeadFollowUp> {
  try {
    return await prisma.leadFollowUp.delete({
      where: { id: followUpId },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error(`[lead-followups.repo] deleteLeadFollowUp failed for '${followUpId}':`, msg);
    throw new Error(`Failed to delete follow-up '${followUpId}': Database write operation failed.`);
  }
}
