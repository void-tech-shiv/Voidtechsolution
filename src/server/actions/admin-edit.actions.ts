"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import type { FAQ, PortfolioProject, PricingPackage, Service, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/server/actions/auth.actions";
import { requirePermission, type PermissionKey } from "@/server/security/rbac";
import { validateRequestOrigin } from "@/server/security/origin";
import { recordAuditEvent } from "@/server/security/audit";
import {
  parseAdminEditForm,
  type AdminEditKind,
} from "@/validations/admin-edit";

export type EditableRecord = PricingPackage | Service | PortfolioProject | FAQ;
export interface AdminEditResult {
  success: boolean;
  error?: string;
  data?: EditableRecord;
}

const permissionFor: Record<AdminEditKind, PermissionKey> = {
  pricing: "pricing:manage",
  service: "services:manage",
  portfolio: "portfolio:manage",
  faq: "faqs:manage",
};

const pathsFor: Record<AdminEditKind, string[]> = {
  pricing: ["/", "/pricing", "/contact", "/admin/pricing"],
  service: ["/", "/services", "/admin/services"],
  portfolio: ["/", "/portfolio", "/admin/portfolio"],
  faq: ["/", "/pricing", "/admin/faqs"],
};

/**
 * Any edit requires a live server-verified admin session, same-origin POST,
 * validated input, and a database-level optimistic concurrency check.
 * CMS-managed records continue to use the separate revision/publish workflow.
 */
export async function saveAdminEditableContentAction(
  kind: AdminEditKind,
  form: FormData
): Promise<AdminEditResult> {
  try {
    const reqHeaders = await headers();
    if (!validateRequestOrigin(reqHeaders)) {
      return { success: false, error: "Cross-origin request rejected." };
    }
    const current = await getCurrentAdmin();
    requirePermission(current?.user, permissionFor[kind]);
    const parsed = parseAdminEditForm(kind, form);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Please check the edited fields.",
      };
    }
    const { id, expectedUpdatedAt, ...data } = parsed.data;

    const outcome = await prisma.$transaction(async (tx) => {
      const where = { id, updatedAt: expectedUpdatedAt };
      let result: EditableRecord;

      if (kind === "pricing") {
        const existing = await tx.pricingPackage.findUnique({
          where: { id }, select: { contentItemId: true },
        });
        if (!existing) return { success: false as const, error: "Pricing package not found in the database. Refresh the page." };
        if (existing.contentItemId) return { success: false as const, error: "This package is CMS-managed. Publish its changes from CMS instead." };
        const edited = await tx.pricingPackage.updateMany({
          where, data: data as Prisma.PricingPackageUpdateManyMutationInput,
        });
        if (edited.count !== 1) return { success: false as const, error: "Someone else changed this package. Refresh and try again." };
        result = await tx.pricingPackage.findUniqueOrThrow({ where: { id } });
      } else if (kind === "service") {
        const existing = await tx.service.findUnique({
          where: { id }, select: { contentItemId: true },
        });
        if (!existing) return { success: false as const, error: "Service not found in the database. Refresh the page." };
        if (existing.contentItemId) return { success: false as const, error: "This service is CMS-managed. Publish its changes from CMS instead." };
        const edited = await tx.service.updateMany({
          where, data: data as Prisma.ServiceUpdateManyMutationInput,
        });
        if (edited.count !== 1) return { success: false as const, error: "Someone else changed this service. Refresh and try again." };
        result = await tx.service.findUniqueOrThrow({ where: { id } });
      } else if (kind === "portfolio") {
        const existing = await tx.portfolioProject.findUnique({
          where: { id }, select: { contentItemId: true },
        });
        if (!existing) return { success: false as const, error: "Portfolio entry not found in the database. Refresh the page." };
        if (existing.contentItemId) return { success: false as const, error: "This entry is CMS-managed. Publish its changes from CMS instead." };
        const edited = await tx.portfolioProject.updateMany({
          where, data: data as Prisma.PortfolioProjectUpdateManyMutationInput,
        });
        if (edited.count !== 1) return { success: false as const, error: "Someone else changed this entry. Refresh and try again." };
        result = await tx.portfolioProject.findUniqueOrThrow({ where: { id } });
      } else {
        const existing = await tx.fAQ.findUnique({
          where: { id }, select: { contentItemId: true },
        });
        if (!existing) return { success: false as const, error: "FAQ not found in the database. Refresh the page." };
        if (existing.contentItemId) return { success: false as const, error: "This FAQ is CMS-managed. Publish its changes from CMS instead." };
        const edited = await tx.fAQ.updateMany({
          where, data: data as Prisma.FAQUpdateManyMutationInput,
        });
        if (edited.count !== 1) return { success: false as const, error: "Someone else changed this FAQ. Refresh and try again." };
        result = await tx.fAQ.findUniqueOrThrow({ where: { id } });
      }

      // Audit failures roll back the edit with the transaction.
      await recordAuditEvent({
        action: "ADMIN_CONTENT_EDITED",
        entity: kind === "pricing" ? "PricingPackage" : kind === "service" ? "Service" :
          kind === "portfolio" ? "PortfolioProject" : "FAQ",
        entityId: id,
        actorId: current!.user.id,
        actorEmail: current!.user.email,
        details: { kind, fields: Object.keys(data) },
      }, tx);

      return { success: true as const, data: result };
    });

    if (outcome.success) {
      for (const path of pathsFor[kind]) revalidatePath(path);
    }
    return outcome;
  } catch (error) {
    console.error("[admin-edit] Save rejected:", error instanceof Error ? error.name : "UnknownError");
    return { success: false, error: "Could not save the changes. Check permissions, reload and try again." };
  }
}
