"use server";

import { headers } from "next/headers";
import type { EnquiryStatus, ServiceCategory, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/server/actions/auth.actions";
import { validateRequestOrigin } from "@/server/security/origin";
import { requirePermission } from "@/server/security/rbac";
import { recordAuditEvent } from "@/server/security/audit";
import {
  getEnquiryById,
  updateEnquiryStatus,
  ConcurrencyConflictError,
} from "@/server/repositories/enquiries.repo";
import {
  createLeadNote,
  togglePinLeadNote,
  deleteLeadNote,
} from "@/server/repositories/lead-notes.repo";
import {
  createLeadFollowUp,
  toggleFollowUpComplete,
  deleteLeadFollowUp,
} from "@/server/repositories/lead-followups.repo";
import {
  assignLeadToAdmin,
  unassignLead,
} from "@/server/repositories/lead-assignments.repo";
import {
  createLeadActivity,
} from "@/server/repositories/lead-activities.repo";
import {
  createAdminNotification,
  getAdminNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/server/repositories/notifications.repo";
import { getAllAdmins } from "@/server/repositories/users.repo";
import type { KanbanLeadItem } from "@/components/admin/crm/crm-lead-card";
import {
  leadStageUpdateSchema,
  createLeadNoteSchema,
  createLeadFollowUpSchema,
  assignLeadSchema,
  CRM_STAGES,
  type LeadStageUpdateInput,
  type CreateLeadNoteInput,
  type CreateLeadFollowUpInput,
  type AssignLeadInput,
} from "@/validations/crm";

export interface ActionResult<T = unknown> {
  success: boolean;
  error?: string;
  code?: string;
  data?: T;
}

export interface CrmMetrics {
  totalLeads: number;
  newLeads: number;
  activePipelineValueInr: number;
  wonRevenueInr: number;
  winRatePercentage: number;
  overdueFollowUpsCount: number;
  stageDistribution: Record<EnquiryStatus, { count: number; totalValueInr: number }>;
}

export interface KanbanStageColumn {
  stage: EnquiryStatus;
  label: string;
  count: number;
  totalValueInr: number;
  leads: KanbanLeadItem[];
}

/**
 * Helper to authenticate and verify origin for Server Actions
 */
async function authenticateRequest() {
  const reqHeaders = await headers();
  if (!validateRequestOrigin(reqHeaders)) {
    return { error: "Cross-origin request rejected." };
  }

  const current = await getCurrentAdmin();
  if (!current || !current.user.isActive) {
    return { error: "Authentication required." };
  }

  return { admin: current.user, headers: reqHeaders };
}

/**
 * Retrieves high-level CRM KPIs and pipeline metrics.
 * Calculates values from actual database records via server-side aggregation.
 */
export async function getCrmMetricsAction(): Promise<ActionResult<CrmMetrics>> {
  const auth = await authenticateRequest();
  if ("error" in auth) {
    return { success: false, error: auth.error };
  }

  try {
    requirePermission(auth.admin, "enquiries:view");

    // 1. Gather all enquiry records for active and terminal calculation
    const allEnquiries = await prisma.enquiry.findMany({
      select: {
        id: true,
        status: true,
        estimatedValueInr: true,
        budgetRange: true,
      },
    });

    // 2. Count uncompleted overdue follow-ups
    const now = new Date();
    const overdueCount = await prisma.leadFollowUp.count({
      where: {
        isCompleted: false,
        dueAt: { lt: now },
      },
    });

    const activeStages: EnquiryStatus[] = [
      "NEW",
      "CONTACTED",
      "QUALIFIED",
      "PROPOSAL_SENT",
      "NEGOTIATION",
    ];

    const totalLeads = allEnquiries.length;
    let newLeads = 0;
    let activePipelineValueInr = 0;
    let wonRevenueInr = 0;
    let wonCount = 0;
    let lostCount = 0;

    const stageDistribution: Record<
      EnquiryStatus,
      { count: number; totalValueInr: number }
    > = {
      NEW: { count: 0, totalValueInr: 0 },
      CONTACTED: { count: 0, totalValueInr: 0 },
      QUALIFIED: { count: 0, totalValueInr: 0 },
      PROPOSAL_SENT: { count: 0, totalValueInr: 0 },
      NEGOTIATION: { count: 0, totalValueInr: 0 },
      WON: { count: 0, totalValueInr: 0 },
      LOST: { count: 0, totalValueInr: 0 },
      ON_HOLD: { count: 0, totalValueInr: 0 },
    };

    for (const enq of allEnquiries) {
      const val = enq.estimatedValueInr || 0;
      if (stageDistribution[enq.status]) {
        stageDistribution[enq.status].count += 1;
        stageDistribution[enq.status].totalValueInr += val;
      }

      if (enq.status === "NEW") {
        newLeads += 1;
      }
      if (activeStages.includes(enq.status)) {
        activePipelineValueInr += val;
      }
      if (enq.status === "WON") {
        wonRevenueInr += val;
        wonCount += 1;
      }
      if (enq.status === "LOST") {
        lostCount += 1;
      }
    }

    // Explicit win-rate denominator: wonCount / (wonCount + lostCount) * 100
    // If no terminal leads exist, win rate is explicitly 0 to avoid misleading metrics
    const terminalCount = wonCount + lostCount;
    const winRatePercentage =
      terminalCount > 0 ? Math.round((wonCount / terminalCount) * 100) : 0;

    return {
      success: true,
      data: {
        totalLeads,
        newLeads,
        activePipelineValueInr,
        wonRevenueInr,
        winRatePercentage,
        overdueFollowUpsCount: overdueCount,
        stageDistribution,
      },
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to load metrics";
    return { success: false, error: msg };
  }
}

/**
 * Retrieves leads grouped by Kanban stage with optional server-side filtering.
 */
export async function getKanbanLeadsAction(params: {
  category?: ServiceCategory;
  assignedAdminId?: string;
  search?: string;
  hasOverdueFollowUp?: boolean;
} = {}): Promise<ActionResult<KanbanStageColumn[]>> {
  const auth = await authenticateRequest();
  if ("error" in auth) {
    return { success: false, error: auth.error };
  }

  try {
    requirePermission(auth.admin, "enquiries:view");

    const where: Prisma.EnquiryWhereInput = {};

    if (params.category) {
      where.serviceCategory = params.category;
    }
    if (params.assignedAdminId) {
      where.assignedAdminId = params.assignedAdminId;
    }
    if (params.hasOverdueFollowUp) {
      where.followUps = {
        some: {
          isCompleted: false,
          dueAt: { lt: new Date() },
        },
      };
    }
    if (params.search && params.search.trim() !== "") {
      const q = params.search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { companyName: { contains: q, mode: "insensitive" } },
        { message: { contains: q, mode: "insensitive" } },
      ];
    }

    const leads = await prisma.enquiry.findMany({
      where,
      include: {
        assignedAdmin: {
          select: { id: true, name: true, email: true, role: true },
        },
        _count: {
          select: {
            notes: true,
            followUps: true,
          },
        },
        followUps: {
          where: { isCompleted: false },
          orderBy: { dueAt: "asc" },
          take: 1,
          select: {
            id: true,
            title: true,
            dueAt: true,
            priority: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const STAGE_LABELS: Record<EnquiryStatus, string> = {
      NEW: "New",
      CONTACTED: "Contacted",
      QUALIFIED: "Qualified",
      PROPOSAL_SENT: "Proposal Sent",
      NEGOTIATION: "Negotiation",
      WON: "Won",
      LOST: "Lost",
      ON_HOLD: "On Hold",
    };

    const columns: KanbanStageColumn[] = CRM_STAGES.map((stage) => {
      const stageLeads = leads.filter((l) => l.status === stage);
      const totalVal = stageLeads.reduce(
        (sum, item) => sum + (item.estimatedValueInr || 0),
        0
      );
      return {
        stage,
        label: STAGE_LABELS[stage],
        count: stageLeads.length,
        totalValueInr: totalVal,
        leads: stageLeads as unknown as KanbanLeadItem[],
      };
    });

    return { success: true, data: columns };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to load Kanban leads";
    return { success: false, error: msg };
  }
}

/**
 * Retrieves full details and relations for a single lead.
 */
export async function getLeadDetailAction(enquiryId: string): Promise<ActionResult<Record<string, unknown>>> {
  const auth = await authenticateRequest();
  if ("error" in auth) {
    return { success: false, error: auth.error };
  }

  try {
    requirePermission(auth.admin, "enquiries:view");

    const lead = await getEnquiryById(enquiryId, true);
    if (!lead) {
      return { success: false, error: `Lead not found with ID '${enquiryId}'` };
    }

    return { success: true, data: lead };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to load lead details";
    return { success: false, error: msg };
  }
}

/**
 * Updates a lead's pipeline stage with optimistic concurrency control (OCC).
 * Enforces mandatory non-empty lostReason for LOST status.
 */
export async function updateLeadStageAction(
  rawInput: LeadStageUpdateInput
): Promise<ActionResult<Record<string, unknown>>> {
  const auth = await authenticateRequest();
  if ("error" in auth) {
    return { success: false, error: auth.error };
  }

  const parsed = leadStageUpdateSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Validation failed",
    };
  }

  const input = parsed.data;

  try {
    requirePermission(auth.admin, "enquiries:update_status");

    // Retrieve current lead state for comparison and activity logging
    const existing = await getEnquiryById(input.enquiryId);
    if (!existing) {
      return { success: false, error: "Lead not found" };
    }

    const previousStatus = existing.status;
    const expectedUpdatedAt = input.expectedUpdatedAt
      ? new Date(input.expectedUpdatedAt)
      : undefined;

    // Perform atomic OCC update via enquiries repository
    const updated = await updateEnquiryStatus(input.enquiryId, input.newStatus, {
      expectedUpdatedAt,
      lostReason: input.lostReason,
      estimatedValueInr: input.estimatedValueInr,
      internalNotes: input.internalNotes,
    });

    // Record immutable activity log
    await createLeadActivity({
      enquiryId: input.enquiryId,
      type: "STATUS_CHANGE",
      description: `Stage moved from ${previousStatus} to ${input.newStatus}${
        input.lostReason ? ` (Reason: ${input.lostReason})` : ""
      }`,
      actorId: auth.admin.id,
      actorName: auth.admin.name,
      metadata: {
        from: previousStatus,
        to: input.newStatus,
        lostReason: input.lostReason || null,
      },
    });

    // Notify assigned admin if different from acting user
    if (updated.assignedAdminId && updated.assignedAdminId !== auth.admin.id) {
      await createAdminNotification({
        recipientId: updated.assignedAdminId,
        enquiryId: updated.id,
        type: input.newStatus === "WON" ? "LEAD_WON" : "STATUS_CHANGED",
        title: `Lead Status Updated: ${updated.name}`,
        message: `${auth.admin.name} updated stage to ${input.newStatus}.`,
      });
    }

    // Record platform audit event
    await recordAuditEvent({
      action: "LEAD_STAGE_UPDATED",
      entity: "Enquiry",
      entityId: updated.id,
      actorId: auth.admin.id,
      actorEmail: auth.admin.email,
      details: {
        from: previousStatus,
        to: input.newStatus,
        lostReason: input.lostReason || null,
      },
    });

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof ConcurrencyConflictError) {
      return {
        success: false,
        code: "CONFLICT_DETECTED",
        error: "Conflict: This lead was modified by another administrator. Please refresh.",
      };
    }
    const msg = error instanceof Error ? error.message : "Failed to update lead stage";
    return { success: false, error: msg };
  }
}

/**
 * Creates an internal note on a lead.
 * Notes are strictly private and never exposed to prospective clients.
 */
export async function createLeadNoteAction(
  rawInput: CreateLeadNoteInput
): Promise<ActionResult<Record<string, unknown>>> {
  const auth = await authenticateRequest();
  if ("error" in auth) {
    return { success: false, error: auth.error };
  }

  const parsed = createLeadNoteSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid note input",
    };
  }

  const input = parsed.data;

  try {
    requirePermission(auth.admin, "enquiries:update_status");

    const note = await createLeadNote({
      enquiryId: input.enquiryId,
      authorId: auth.admin.id,
      authorName: auth.admin.name,
      content: input.content,
      isPinned: input.isPinned,
    });

    // Record activity
    await createLeadActivity({
      enquiryId: input.enquiryId,
      type: "NOTE_ADDED",
      description: `Internal note added by ${auth.admin.name}`,
      actorId: auth.admin.id,
      actorName: auth.admin.name,
      metadata: { noteId: note.id, isPinned: note.isPinned },
    });

    // Record audit event
    await recordAuditEvent({
      action: "LEAD_NOTE_CREATED",
      entity: "LeadNote",
      entityId: note.id,
      actorId: auth.admin.id,
      actorEmail: auth.admin.email,
      details: { enquiryId: input.enquiryId },
    });

    return { success: true, data: note };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to create note";
    return { success: false, error: msg };
  }
}

/**
 * Toggles a note's pinned status.
 */
export async function togglePinLeadNoteAction(
  noteId: string,
  isPinned: boolean
): Promise<ActionResult<Record<string, unknown>>> {
  const auth = await authenticateRequest();
  if ("error" in auth) {
    return { success: false, error: auth.error };
  }

  try {
    requirePermission(auth.admin, "enquiries:update_status");
    const updated = await togglePinLeadNote(noteId, isPinned);
    return { success: true, data: updated };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to toggle note pin";
    return { success: false, error: msg };
  }
}

/**
 * Deletes an internal note. Restricted to SUPER_ADMIN to preserve audit trail.
 */
export async function deleteLeadNoteAction(noteId: string): Promise<ActionResult<Record<string, unknown>>> {
  const auth = await authenticateRequest();
  if ("error" in auth) {
    return { success: false, error: auth.error };
  }

  try {
    requirePermission(auth.admin, "enquiries:delete");
    const deleted = await deleteLeadNote(noteId);

    await recordAuditEvent({
      action: "LEAD_NOTE_DELETED",
      entity: "LeadNote",
      entityId: noteId,
      actorId: auth.admin.id,
      actorEmail: auth.admin.email,
      details: { enquiryId: deleted.enquiryId },
    });

    return { success: true, data: deleted as unknown as Record<string, unknown> };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to delete note";
    return { success: false, error: msg };
  }
}

/**
 * Schedules a follow-up task for a lead.
 * Automatically synchronizes Enquiry.nextFollowUpAt cache.
 */
export async function createLeadFollowUpAction(
  rawInput: CreateLeadFollowUpInput
): Promise<ActionResult<Record<string, unknown>>> {
  const auth = await authenticateRequest();
  if ("error" in auth) {
    return { success: false, error: auth.error };
  }

  const parsed = createLeadFollowUpSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid follow-up input",
    };
  }

  const input = parsed.data;

  try {
    requirePermission(auth.admin, "enquiries:update_status");

    const dueDate = new Date(input.dueAt);
    const followUp = await createLeadFollowUp({
      enquiryId: input.enquiryId,
      assignedToId: input.assignedToId || null,
      title: input.title,
      description: input.description || null,
      dueAt: dueDate,
      priority: input.priority,
    });

    // Record activity
    await createLeadActivity({
      enquiryId: input.enquiryId,
      type: "FOLLOWUP_CREATED",
      description: `Follow-up "${input.title}" scheduled for ${dueDate.toLocaleDateString()}`,
      actorId: auth.admin.id,
      actorName: auth.admin.name,
      metadata: { followUpId: followUp.id, priority: input.priority },
    });

    // Notify assigned admin if specified and different from actor
    if (input.assignedToId && input.assignedToId !== auth.admin.id) {
      await createAdminNotification({
        recipientId: input.assignedToId,
        enquiryId: input.enquiryId,
        type: "FOLLOWUP_DUE",
        title: `Follow-Up Assigned: ${input.title}`,
        message: `${auth.admin.name} assigned you a follow-up task due on ${dueDate.toLocaleDateString()}.`,
      });
    }

    return { success: true, data: followUp as unknown as Record<string, unknown> };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to schedule follow-up";
    return { success: false, error: msg };
  }
}

/**
 * Toggles a follow-up task's completion status.
 */
export async function toggleLeadFollowUpAction(
  followUpId: string,
  isCompleted: boolean
): Promise<ActionResult<Record<string, unknown>>> {
  const auth = await authenticateRequest();
  if ("error" in auth) {
    return { success: false, error: auth.error };
  }

  try {
    requirePermission(auth.admin, "enquiries:update_status");

    const updated = await toggleFollowUpComplete(
      followUpId,
      isCompleted,
      auth.admin.id
    );

    // Record activity
    await createLeadActivity({
      enquiryId: updated.enquiryId,
      type: isCompleted ? "FOLLOWUP_COMPLETED" : "FOLLOWUP_REOPENED",
      description: `Follow-up "${updated.title}" marked as ${
        isCompleted ? "completed" : "reopened"
      } by ${auth.admin.name}`,
      actorId: auth.admin.id,
      actorName: auth.admin.name,
      metadata: { followUpId: updated.id, isCompleted },
    });

    return { success: true, data: updated as unknown as Record<string, unknown> };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to update follow-up";
    return { success: false, error: msg };
  }
}

/**
 * Deletes a scheduled follow-up task.
 */
export async function deleteLeadFollowUpAction(
  followUpId: string
): Promise<ActionResult<Record<string, unknown>>> {
  const auth = await authenticateRequest();
  if ("error" in auth) {
    return { success: false, error: auth.error };
  }

  try {
    requirePermission(auth.admin, "enquiries:update_status");
    const deleted = await deleteLeadFollowUp(followUpId);
    return { success: true, data: deleted as unknown as Record<string, unknown> };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to delete follow-up";
    return { success: false, error: msg };
  }
}

/**
 * Assigns or reassigns a lead to an eligible administrator.
 */
export async function assignLeadAction(
  rawInput: AssignLeadInput
): Promise<ActionResult<Record<string, unknown>>> {
  const auth = await authenticateRequest();
  if ("error" in auth) {
    return { success: false, error: auth.error };
  }

  const parsed = assignLeadSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid assignment data",
    };
  }

  const input = parsed.data;

  try {
    requirePermission(auth.admin, "enquiries:update_status");

    const assignment = await assignLeadToAdmin({
      enquiryId: input.enquiryId,
      adminId: input.adminId,
      assignedById: auth.admin.id,
      assignedByName: auth.admin.name,
      notes: input.notes,
    });

    // Fetch target admin details for naming
    const targetAdmin = await prisma.adminUser.findUnique({
      where: { id: input.adminId },
      select: { name: true, email: true },
    });

    // Record activity
    await createLeadActivity({
      enquiryId: input.enquiryId,
      type: "ASSIGNMENT",
      description: `Lead assigned to ${targetAdmin?.name || input.adminId} by ${auth.admin.name}`,
      actorId: auth.admin.id,
      actorName: auth.admin.name,
      metadata: { targetAdminId: input.adminId, notes: input.notes || null },
    });

    // Dispatch notification to assigned administrator
    if (input.adminId !== auth.admin.id) {
      await createAdminNotification({
        recipientId: input.adminId,
        enquiryId: input.enquiryId,
        type: "LEAD_ASSIGNED",
        title: "New Lead Assigned",
        message: `${auth.admin.name} assigned you a client lead.`,
      });
    }

    // Platform audit log
    await recordAuditEvent({
      action: "LEAD_ASSIGNED",
      entity: "Enquiry",
      entityId: input.enquiryId,
      actorId: auth.admin.id,
      actorEmail: auth.admin.email,
      details: { targetAdminId: input.adminId },
    });

    return { success: true, data: assignment as unknown as Record<string, unknown> };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to assign lead";
    return { success: false, error: msg };
  }
}

/**
 * Unassigns a lead from its current administrator.
 */
export async function unassignLeadAction(enquiryId: string): Promise<ActionResult<Record<string, unknown>>> {
  const auth = await authenticateRequest();
  if ("error" in auth) {
    return { success: false, error: auth.error };
  }

  try {
    requirePermission(auth.admin, "enquiries:update_status");

    await unassignLead(enquiryId);

    await createLeadActivity({
      enquiryId,
      type: "UNASSIGNED",
      description: `Lead unassigned by ${auth.admin.name}`,
      actorId: auth.admin.id,
      actorName: auth.admin.name,
    });

    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to unassign lead";
    return { success: false, error: msg };
  }
}

/**
 * Retrieves notifications for the authenticated administrator.
 * Strictly enforces recipient isolation.
 */
export async function getAdminNotificationsAction(unreadOnly = false): Promise<
  ActionResult<{ items: Record<string, unknown>[]; unreadCount: number }>
> {
  const auth = await authenticateRequest();
  if ("error" in auth) {
    return { success: false, error: auth.error };
  }

  try {
    const [items, unreadCount] = await Promise.all([
      getAdminNotifications(auth.admin.id, unreadOnly, 30),
      getUnreadNotificationCount(auth.admin.id),
    ]);

    return { success: true, data: { items: items as unknown as Record<string, unknown>[], unreadCount } };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to load notifications";
    return { success: false, error: msg };
  }
}

/**
 * Marks a notification as read, ensuring recipient ownership.
 */
export async function markNotificationReadAction(
  notificationId: string
): Promise<ActionResult<Record<string, unknown>>> {
  const auth = await authenticateRequest();
  if ("error" in auth) {
    return { success: false, error: auth.error };
  }

  try {
    const updated = await markNotificationAsRead(notificationId, auth.admin.id);
    return { success: true, data: updated as unknown as Record<string, unknown> };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to mark notification read";
    return { success: false, error: msg };
  }
}

/**
 * Marks all notifications as read for the authenticated recipient.
 */
export async function markAllNotificationsReadAction(): Promise<ActionResult<number>> {
  const auth = await authenticateRequest();
  if ("error" in auth) {
    return { success: false, error: auth.error };
  }

  try {
    const count = await markAllNotificationsAsRead(auth.admin.id);
    return { success: true, data: count };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to mark all read";
    return { success: false, error: msg };
  }
}

/**
 * Retrieves active administrators eligible for lead assignments.
 */
export async function getActiveAdminsAction(): Promise<ActionResult<Array<{ id: string; name: string; email: string; role: string }>>> {
  const auth = await authenticateRequest();
  if ("error" in auth) {
    return { success: false, error: auth.error };
  }

  try {
    requirePermission(auth.admin, "enquiries:view");
    const admins = await getAllAdmins();
    const active = admins
      .filter((a) => a.isActive)
      .map((a) => ({
        id: a.id,
        name: a.name,
        email: a.email,
        role: a.role,
      }));

    return { success: true, data: active };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to load administrators";
    return { success: false, error: msg };
  }
}

/**
 * Retrieves follow-up tasks across leads for the dedicated Follow-up Management View.
 */
export async function getFollowUpsViewAction(params: {
  status?: "all" | "upcoming" | "overdue" | "completed";
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  assignedToId?: string;
} = {}): Promise<ActionResult<Record<string, unknown>[]>> {
  const auth = await authenticateRequest();
  if ("error" in auth) {
    return { success: false, error: auth.error };
  }

  try {
    requirePermission(auth.admin, "enquiries:view");

    const now = new Date();
    const where: Prisma.LeadFollowUpWhereInput = {};

    if (params.status === "upcoming") {
      where.isCompleted = false;
      where.dueAt = { gte: now };
    } else if (params.status === "overdue") {
      where.isCompleted = false;
      where.dueAt = { lt: now };
    } else if (params.status === "completed") {
      where.isCompleted = true;
    }

    if (params.priority) {
      where.priority = params.priority;
    }

    if (params.assignedToId) {
      where.assignedToId = params.assignedToId;
    }

    const items = await prisma.leadFollowUp.findMany({
      where,
      include: {
        enquiry: {
          select: {
            id: true,
            name: true,
            companyName: true,
            status: true,
            serviceCategory: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [{ isCompleted: "asc" }, { dueAt: "asc" }],
      take: 100,
    });

    return { success: true, data: items };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to load follow-up tasks";
    return { success: false, error: msg };
  }
}
