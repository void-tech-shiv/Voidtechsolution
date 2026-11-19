"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/server/actions/auth.actions";
import { validateRequestOrigin } from "@/server/security/origin";
import { requirePermission, type PermissionKey } from "@/server/security/rbac";
import {
  calculateQuote, canTransitionProposal, parseProposalForm,
  DEFAULT_MILESTONES, PROJECT_STATES, type ProposalState,
} from "@/server/agency/proposals";

async function authorized(permission: PermissionKey) {
  const h = await headers();
  if (!validateRequestOrigin(h)) throw new Error("Cross-origin request rejected.");
  const current = await getCurrentAdmin();
  requirePermission(current?.user, permission);
  return current!.user;
}

const idSchema = z.string().min(5).max(100);

function validId(form: FormData, key: string) {
  return idSchema.safeParse(form.get(key)).data;
}

export async function createAgencyProposalAction(form: FormData): Promise<void> {
  const admin = await authorized("proposals:manage");
  const parsed = parseProposalForm(form);
  if (!parsed.success) redirect("/admin/proposals?error=validation");
  const input = parsed.data;

  let totals: ReturnType<typeof calculateQuote>;
  try {
    totals = calculateQuote(input.items, input.discountInr);
  } catch {
    redirect("/admin/proposals?error=amount");
  }

  const exists = await prisma.enquiry.findUnique({
    where: { id: input.enquiryId },
    select: { id: true },
  });
  if (!exists) redirect("/admin/proposals?error=enquiry");

  const deadline = input.validUntil ? new Date(input.validUntil + "T23:59:59.999Z") : null;
  if (deadline && (Number.isNaN(deadline.getTime()) || deadline.getTime() < Date.now())) {
    redirect("/admin/proposals?error=validity");
  }

  const proposal = await prisma.agencyProposal.create({
    data: {
      enquiryId: exists.id,
      title: input.title,
      scope: input.scope,
      terms: input.terms,
      currency: "INR",
      subtotalInr: totals.subtotalInr,
      discountInr: totals.discountInr,
      totalInr: totals.totalInr,
      validUntil: deadline,
      createdById: admin.id,
      items: {
        create: totals.lines.map((line) => ({
          description: line.description,
          quantity: line.quantity,
          unitPriceInr: line.unitPriceInr,
          lineTotalInr: line.lineTotalInr,
          orderIndex: line.orderIndex,
        })),
      },
    },
  });

  await prisma.auditLog.create({
    data: { action: "AGENCY_PROPOSAL_CREATED", entity: "AgencyProposal",
      entityId: proposal.id, actorId: admin.id, actorEmail: admin.email,
      details: { enquiryId: input.enquiryId, totalInr: totals.totalInr } },
  });
  revalidatePath("/admin/proposals");
  redirect("/admin/proposals/" + proposal.id);
}

export async function changeAgencyProposalStatusAction(form: FormData): Promise<void> {
  const admin = await authorized("proposals:manage");
  const proposalId = validId(form, "proposalId");
  const requested = z.enum(["SENT", "ACCEPTED", "REJECTED"]).safeParse(form.get("status"));
  if (!proposalId || !requested.success) redirect("/admin/proposals?error=validation");

  const proposal = await prisma.agencyProposal.findUnique({
    where: { id: proposalId },
    select: { id: true, status: true, enquiryId: true, totalInr: true, validUntil: true },
  });
  if (!proposal || !canTransitionProposal(proposal.status as ProposalState, requested.data)) {
    redirect("/admin/proposals/" + proposalId + "?error=transition");
  }
  if (requested.data === "ACCEPTED" && proposal.validUntil &&
      proposal.validUntil.getTime() < Date.now()) {
    redirect("/admin/proposals/" + proposalId + "?error=expired");
  }

  const changedAt = new Date();
  const data = {
    status: requested.data,
    ...(requested.data === "SENT" ? { sentAt: changedAt } :
      requested.data === "ACCEPTED" ? { acceptedAt: changedAt } :
      { rejectedAt: changedAt }),
  };

  const changed = await prisma.$transaction(async (tx) => {
    // Conditional update prevents conflicting transitions by two administrators.
    const result = await tx.agencyProposal.updateMany({
      where: { id: proposalId, status: proposal.status },
      data,
    });
    if (result.count !== 1) return false;

    if (requested.data === "ACCEPTED") {
      await tx.enquiry.update({
        where: { id: proposal.enquiryId },
        data: { status: "WON", estimatedValueInr: proposal.totalInr },
      });
    } else if (requested.data === "SENT") {
      await tx.enquiry.update({
        where: { id: proposal.enquiryId },
        data: { status: "PROPOSAL_SENT" },
      });
    }
    await tx.auditLog.create({
      data: { action: "AGENCY_PROPOSAL_STATUS_UPDATED", entity: "AgencyProposal",
        entityId: proposalId, actorId: admin.id, actorEmail: admin.email,
        details: { from: proposal.status, to: requested.data } },
    });
    return true;
  });
  revalidatePath("/admin/proposals");
  revalidatePath("/admin/crm");
  redirect("/admin/proposals/" + proposalId + (changed ? "?updated=1" : "?error=conflict"));
}

export async function convertProposalToProjectAction(form: FormData): Promise<void> {
  const admin = await authorized("projects:manage");
  const proposalId = validId(form, "proposalId");
  if (!proposalId) redirect("/admin/proposals?error=validation");

  const existing = await prisma.agencyProject.findUnique({ where: { proposalId }, select: { id: true } });
  if (existing) redirect("/admin/projects/" + existing.id);

  const proposal = await prisma.agencyProposal.findUnique({
    where: { id: proposalId },
    select: { id: true, enquiryId: true, title: true, status: true },
  });
  if (!proposal || proposal.status !== "ACCEPTED") {
    redirect("/admin/proposals/" + proposalId + "?error=not-accepted");
  }

  let projectId: string;
  try {
    const project = await prisma.agencyProject.create({
      data: {
        proposalId: proposal.id,
        enquiryId: proposal.enquiryId,
        title: proposal.title,
        status: "PLANNED",
        milestones: {
          create: DEFAULT_MILESTONES.map((title, orderIndex) => ({ title, orderIndex })),
        },
      },
      select: { id: true },
    });
    projectId = project.id;
  } catch (error) {
    // The unique proposalId constraint is the source of truth under races.
    const raced = await prisma.agencyProject.findUnique({
      where: { proposalId }, select: { id: true },
    });
    if (!raced) throw error;
    projectId = raced.id;
  }

  await prisma.auditLog.create({
    data: { action: "AGENCY_PROJECT_CREATED", entity: "AgencyProject",
      entityId: projectId, actorId: admin.id, actorEmail: admin.email,
      details: { proposalId } },
  });
  revalidatePath("/admin/projects");
  revalidatePath("/admin/proposals");
  redirect("/admin/projects/" + projectId);
}

export async function updateAgencyProjectAction(form: FormData): Promise<void> {
  const admin = await authorized("projects:manage");
  const projectId = validId(form, "projectId");
  if (!projectId) redirect("/admin/projects?error=validation");

  const status = z.enum(PROJECT_STATES).safeParse(form.get("status"));
  const notes = z.string().max(5_000).safeParse(form.get("notes"));
  const date = z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]).safeParse(form.get("dueAt"));
  if (!status.success || !notes.success || !date.success) {
    redirect("/admin/projects/" + projectId + "?error=validation");
  }

  const dueAt = date.data ? new Date(date.data + "T23:59:59.999Z") : null;
  if (dueAt && Number.isNaN(dueAt.getTime())) {
    redirect("/admin/projects/" + projectId + "?error=validation");
  }
  if (status.data === "COMPLETED") {
    const incomplete = await prisma.agencyProjectMilestone.count({
      where: { projectId, isCompleted: false },
    });
    if (incomplete > 0) redirect("/admin/projects/" + projectId + "?error=milestones");
  }

  await prisma.agencyProject.update({
    where: { id: projectId },
    data: { status: status.data, notes: notes.data.trim() || null, dueAt },
  });
  await prisma.auditLog.create({
    data: { action: "AGENCY_PROJECT_UPDATED", entity: "AgencyProject",
      entityId: projectId, actorId: admin.id, actorEmail: admin.email,
      details: { status: status.data } },
  });
  revalidatePath("/admin/projects");
  redirect("/admin/projects/" + projectId + "?updated=1");
}

export async function setAgencyMilestoneAction(form: FormData): Promise<void> {
  const admin = await authorized("projects:manage");
  const milestoneId = validId(form, "milestoneId");
  const shouldComplete = form.get("completed");
  if (!milestoneId || (shouldComplete !== "true" && shouldComplete !== "false")) {
    redirect("/admin/projects?error=validation");
  }
  const row = await prisma.agencyProjectMilestone.findUnique({
    where: { id: milestoneId },
    select: { id: true, projectId: true },
  });
  if (!row) redirect("/admin/projects?error=missing");
  const completed = shouldComplete === "true";
  await prisma.agencyProjectMilestone.updateMany({
    where: { id: milestoneId, isCompleted: !completed },
    data: { isCompleted: completed, completedAt: completed ? new Date() : null },
  });
  await prisma.auditLog.create({
    data: { action: "AGENCY_MILESTONE_UPDATED", entity: "AgencyProjectMilestone",
      entityId: milestoneId, actorId: admin.id, actorEmail: admin.email,
      details: { projectId: row.projectId, completed } },
  });
  revalidatePath("/admin/projects/" + row.projectId);
  redirect("/admin/projects/" + row.projectId);
}
