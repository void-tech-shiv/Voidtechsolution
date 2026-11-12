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
 * Synchronizes an enquiry's nextFollowUpAt cache to always reflect the earliest uncompleted follow-up.
 */
export async function syncEnquiryNextFollowUpAt(
  enquiryId: string,
  tx?: Prisma.TransactionClient
): Promise<void> {
  const db = tx || prisma;
  try {
    const nextEarliest = await db.leadFollowUp.findFirst({
      where: { enquiryId, isCompleted: false },
      orderBy: { dueAt: "asc" },
      select: { dueAt: true },
    });
    await db.enquiry.update({
      where: { id: enquiryId },
      data: { nextFollowUpAt: nextEarliest ? nextEarliest.dueAt : null },
    });
  } catch (error) {
    console.warn(`[lead-followups.repo] syncEnquiryNextFollowUpAt failed for '${enquiryId}':`, error);
  }
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

    // Synchronize enquiry nextFollowUpAt with the earliest active uncompleted task
    await syncEnquiryNextFollowUpAt(input.enquiryId, db);

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
    const updated = await prisma.leadFollowUp.update({
      where: { id: followUpId },
      data: {
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
        completedById: isCompleted ? completedById || null : null,
      },
    });

    // Synchronize enquiry nextFollowUpAt cache
    await syncEnquiryNextFollowUpAt(updated.enquiryId);

    return updated;
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
    const deleted = await prisma.leadFollowUp.delete({
      where: { id: followUpId },
    });

    // Synchronize enquiry nextFollowUpAt cache
    await syncEnquiryNextFollowUpAt(deleted.enquiryId);

    return deleted;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error(`[lead-followups.repo] deleteLeadFollowUp failed for '${followUpId}':`, msg);
    throw new Error(`Failed to delete follow-up '${followUpId}': Database write operation failed.`);
  }
}

