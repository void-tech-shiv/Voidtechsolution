import { prisma } from "@/lib/prisma";
import type { LeadAssignment, Prisma } from "@prisma/client";

export interface AssignLeadInput {
  enquiryId: string;
  adminId: string;
  assignedById?: string | null;
  assignedByName?: string | null;
  notes?: string | null;
}

/**
 * Assigns a lead to an eligible administrator inside a transaction.
 * Automatically deactivates any existing active assignment and updates Enquiry.assignedAdminId.
 */
export async function assignLeadToAdmin(
  input: AssignLeadInput,
  tx?: Prisma.TransactionClient
): Promise<LeadAssignment> {
  const execute = async (client: Prisma.TransactionClient) => {
    // 1. Verify target admin exists and is active
    const targetAdmin = await client.adminUser.findUnique({
      where: { id: input.adminId },
      select: { id: true, name: true, email: true, isActive: true, role: true },
    });

    if (!targetAdmin) {
      throw new Error(`Target administrator with ID '${input.adminId}' not found.`);
    }

    if (!targetAdmin.isActive) {
      throw new Error(`Cannot assign lead to deactivated administrator '${targetAdmin.name}'.`);
    }

    // 2. Mark any current active assignment as inactive
    await client.leadAssignment.updateMany({
      where: { enquiryId: input.enquiryId, isActive: true },
      data: { isActive: false, unassignedAt: new Date() },
    });

    // 3. Create new active assignment record
    const assignment = await client.leadAssignment.create({
      data: {
        enquiryId: input.enquiryId,
        adminId: input.adminId,
        assignedById: input.assignedById || null,
        assignedByName: input.assignedByName || null,
        isActive: true,
        notes: input.notes?.trim() || null,
      },
    });

    // 4. Update the primary assignedAdminId on the enquiry
    await client.enquiry.update({
      where: { id: input.enquiryId },
      data: { assignedAdminId: input.adminId },
    });

    return assignment;
  };

  try {
    if (tx) {
      return await execute(tx);
    } else {
      return await prisma.$transaction(async (client) => execute(client));
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[lead-assignments.repo] assignLeadToAdmin failed:", msg);
    throw new Error(`Failed to assign lead '${input.enquiryId}': ${msg}`);
  }
}

/**
 * Unassigns a lead from its current administrator.
 */
export async function unassignLead(
  enquiryId: string,
  tx?: Prisma.TransactionClient
): Promise<void> {
  const execute = async (client: Prisma.TransactionClient) => {
    await client.leadAssignment.updateMany({
      where: { enquiryId, isActive: true },
      data: { isActive: false, unassignedAt: new Date() },
    });

    await client.enquiry.update({
      where: { id: enquiryId },
      data: { assignedAdminId: null },
    });
  };

  try {
    if (tx) {
      await execute(tx);
    } else {
      await prisma.$transaction(async (client) => execute(client));
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[lead-assignments.repo] unassignLead failed:", msg);
    throw new Error(`Failed to unassign lead '${enquiryId}': ${msg}`);
  }
}

/**
 * Retrieves the historical assignment log for an enquiry.
 */
export async function getLeadAssignmentHistory(enquiryId: string): Promise<LeadAssignment[]> {
  try {
    return await prisma.leadAssignment.findMany({
      where: { enquiryId },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { assignedAt: "desc" },
    });
  } catch (error) {
    console.warn(`[lead-assignments.repo] getLeadAssignmentHistory failed for '${enquiryId}':`, error);
    return [];
  }
}

/**
 * Retrieves the currently active assignment for a lead, if one exists.
 */
export async function getActiveAssignment(enquiryId: string): Promise<LeadAssignment | null> {
  try {
    return await prisma.leadAssignment.findFirst({
      where: { enquiryId, isActive: true },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  } catch (error) {
    console.warn(`[lead-assignments.repo] getActiveAssignment failed for '${enquiryId}':`, error);
    return null;
  }
}
