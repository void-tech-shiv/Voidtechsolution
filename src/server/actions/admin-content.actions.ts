"use server";

import { headers } from "next/headers";
import type { EnquiryStatus } from "@prisma/client";
import { getCurrentAdmin } from "@/server/actions/auth.actions";
import { validateRequestOrigin } from "@/server/security/origin";
import { requirePermission, AuthorizationError } from "@/server/security/rbac";
import { recordAuditEvent, AUDIT_ACTIONS } from "@/server/security/audit";
import {
  updateEnquiryStatus,
  appendEnquiryNote,
  deleteEnquiry,
} from "@/server/repositories/enquiries.repo";
import { setSetting } from "@/server/repositories/settings.repo";
import { updateService } from "@/server/repositories/services.repo";
import { createFaq } from "@/server/repositories/faq.repo";
import { prisma } from "@/lib/prisma";

export interface ActionResult<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

/**
 * Server Action: Update Enquiry Status.
 * Requires: enquiries:update_status (SUPER_ADMIN and ADMIN; EDITOR denied).
 */
export async function updateEnquiryStatusAction(
  enquiryId: string,
  status: EnquiryStatus,
  internalNotes?: string
): Promise<ActionResult> {
  const reqHeaders = await headers();
  if (!validateRequestOrigin(reqHeaders)) {
    return { success: false, error: "Cross-origin request rejected." };
  }

  const current = await getCurrentAdmin();
  if (!current) {
    return { success: false, error: "Authentication required." };
  }

  try {
    requirePermission(current.user, "enquiries:update_status");

    const updated = await updateEnquiryStatus(enquiryId, status, internalNotes);

    const ip = reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const userAgent = reqHeaders.get("user-agent") || "unknown";

    await recordAuditEvent({
      action: AUDIT_ACTIONS.ENQUIRY_STATUS_UPDATED,
      entity: "Enquiry",
      entityId: updated.id,
      actorId: current.user.id,
      actorEmail: current.user.email,
      ipAddress: ip,
      userAgent,
      details: {
        enquiryId: updated.id,
        newStatus: updated.status,
        clientEmail: updated.email,
      },
    });

    return { success: true, data: updated };
  } catch (err) {
    const msg = err instanceof AuthorizationError || err instanceof Error ? err.message : "Failed to update enquiry status.";
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Append Note to Enquiry.
 * Requires: enquiries:update_status (SUPER_ADMIN and ADMIN).
 */
export async function appendEnquiryNoteAction(
  enquiryId: string,
  note: string
): Promise<ActionResult> {
  const reqHeaders = await headers();
  if (!validateRequestOrigin(reqHeaders)) {
    return { success: false, error: "Cross-origin request rejected." };
  }

  const current = await getCurrentAdmin();
  if (!current) {
    return { success: false, error: "Authentication required." };
  }

  try {
    requirePermission(current.user, "enquiries:update_status");

    const updated = await appendEnquiryNote(enquiryId, note, current.user.name);
    return { success: true, data: updated };
  } catch (err) {
    const msg = err instanceof AuthorizationError || err instanceof Error ? err.message : "Failed to append note.";
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Permanently Delete Enquiry.
 * Requires: enquiries:delete (SUPER_ADMIN only).
 */
export async function deleteEnquiryAction(enquiryId: string): Promise<ActionResult> {
  const reqHeaders = await headers();
  if (!validateRequestOrigin(reqHeaders)) {
    return { success: false, error: "Cross-origin request rejected." };
  }

  const current = await getCurrentAdmin();
  if (!current) {
    return { success: false, error: "Authentication required." };
  }

  try {
    requirePermission(current.user, "enquiries:delete");

    const deleted = await deleteEnquiry(enquiryId);

    const ip = reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const userAgent = reqHeaders.get("user-agent") || "unknown";

    await recordAuditEvent({
      action: AUDIT_ACTIONS.ENQUIRY_DELETED,
      entity: "Enquiry",
      entityId: deleted.id,
      actorId: current.user.id,
      actorEmail: current.user.email,
      ipAddress: ip,
      userAgent,
      details: {
        enquiryId: deleted.id,
        clientEmail: deleted.email,
      },
    });

    return { success: true, data: { deletedId: deleted.id } };
  } catch (err) {
    const msg = err instanceof AuthorizationError || err instanceof Error ? err.message : "Failed to delete enquiry.";
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Update Site Setting.
 * Requires: settings:manage (SUPER_ADMIN only).
 */
export async function updateSiteSettingAction(
  key: string,
  value: string,
  description?: string
): Promise<ActionResult> {
  const reqHeaders = await headers();
  if (!validateRequestOrigin(reqHeaders)) {
    return { success: false, error: "Cross-origin request rejected." };
  }

  const current = await getCurrentAdmin();
  if (!current) {
    return { success: false, error: "Authentication required." };
  }

  try {
    requirePermission(current.user, "settings:manage");

    const updated = await setSetting(key, value, description);

    const ip = reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const userAgent = reqHeaders.get("user-agent") || "unknown";

    await recordAuditEvent({
      action: AUDIT_ACTIONS.SETTINGS_UPDATED,
      entity: "SiteSetting",
      entityId: updated.id,
      actorId: current.user.id,
      actorEmail: current.user.email,
      ipAddress: ip,
      userAgent,
      details: {
        key: updated.key,
        value: updated.value,
      },
    });

    return { success: true, data: updated };
  } catch (err) {
    const msg = err instanceof AuthorizationError || err instanceof Error ? err.message : "Failed to update setting.";
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Toggle Service Active Status.
 * Requires: services:manage (SUPER_ADMIN, ADMIN, EDITOR).
 */
export async function toggleServiceActiveAction(
  serviceId: string,
  isActive: boolean
): Promise<ActionResult> {
  const reqHeaders = await headers();
  if (!validateRequestOrigin(reqHeaders)) {
    return { success: false, error: "Cross-origin request rejected." };
  }

  const current = await getCurrentAdmin();
  if (!current) {
    return { success: false, error: "Authentication required." };
  }

  try {
    requirePermission(current.user, "services:manage");

    const updated = await updateService(serviceId, { isActive });
    return { success: true, data: updated };
  } catch (err) {
    const msg = err instanceof AuthorizationError || err instanceof Error ? err.message : "Failed to toggle service status.";
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Create FAQ.
 * Requires: faqs:manage (SUPER_ADMIN, ADMIN, EDITOR).
 */
export async function createFaqAction(
  question: string,
  answer: string,
  category: string,
  orderIndex = 0
): Promise<ActionResult> {
  const reqHeaders = await headers();
  if (!validateRequestOrigin(reqHeaders)) {
    return { success: false, error: "Cross-origin request rejected." };
  }

  const current = await getCurrentAdmin();
  if (!current) {
    return { success: false, error: "Authentication required." };
  }

  try {
    requirePermission(current.user, "faqs:manage");

    if (!question?.trim() || !answer?.trim()) {
      return { success: false, error: "Question and answer are required." };
    }

    const created = await createFaq({
      question: question.trim(),
      answer: answer.trim(),
      category: category.trim().toUpperCase(),
      orderIndex,
      isActive: true,
    });

    return { success: true, data: created };
  } catch (err) {
    const msg = err instanceof AuthorizationError || err instanceof Error ? err.message : "Failed to create FAQ.";
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Toggle Pricing Package Active Status.
 * Requires: pricing:manage (SUPER_ADMIN and ADMIN; EDITOR denied).
 */
export async function togglePricingPackageActiveAction(
  packageId: string,
  isActive: boolean
): Promise<ActionResult> {
  const reqHeaders = await headers();
  if (!validateRequestOrigin(reqHeaders)) {
    return { success: false, error: "Cross-origin request rejected." };
  }

  const current = await getCurrentAdmin();
  if (!current) {
    return { success: false, error: "Authentication required." };
  }

  try {
    requirePermission(current.user, "pricing:manage");

    const updated = await prisma.pricingPackage.update({
      where: { id: packageId },
      data: { isActive },
    });

    return { success: true, data: updated };
  } catch (err) {
    const msg = err instanceof AuthorizationError || err instanceof Error ? err.message : "Failed to toggle package status.";
    return { success: false, error: msg };
  }
}

