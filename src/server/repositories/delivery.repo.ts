import { prisma } from "@/lib/prisma";
import type { EmailDelivery, EmailDeliveryStatus } from "@prisma/client";

export interface CreateDeliveryParams {
  recipient: string;
  subject: string;
  template: string;
  status?: EmailDeliveryStatus;
  providerMessageId?: string;
  failureCode?: string;
  errorMessage?: string;
  sentAt?: Date;
}

/**
 * Creates an email delivery audit record in the database.
 */
export async function createEmailDelivery(
  params: CreateDeliveryParams
): Promise<EmailDelivery> {
  try {
    return await prisma.emailDelivery.create({
      data: {
        recipient: params.recipient,
        subject: params.subject,
        template: params.template,
        status: params.status || "PENDING",
        providerMessageId: params.providerMessageId || null,
        failureCode: params.failureCode || null,
        errorMessage: params.errorMessage || null,
        sentAt: params.sentAt || null,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[delivery.repo] createEmailDelivery failed:", msg);
    // Return an in-memory representation so email dispatching doesn't crash if DB is offline
    return {
      id: `fallback-del-${Date.now()}`,
      recipient: params.recipient,
      subject: params.subject,
      template: params.template,
      status: params.status || "PENDING",
      providerMessageId: params.providerMessageId || null,
      failureCode: params.failureCode || null,
      errorMessage: params.errorMessage || null,
      retryCount: 0,
      sentAt: params.sentAt || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

/**
 * Updates the status of an email delivery record.
 */
export async function updateEmailDeliveryStatus(
  id: string,
  update: {
    status: EmailDeliveryStatus;
    providerMessageId?: string;
    failureCode?: string;
    errorMessage?: string;
    retryCount?: number;
    sentAt?: Date;
  }
): Promise<EmailDelivery | null> {
  if (id.startsWith("fallback-del-")) {
    return null;
  }

  try {
    return await prisma.emailDelivery.update({
      where: { id },
      data: {
        status: update.status,
        providerMessageId: update.providerMessageId || undefined,
        failureCode: update.failureCode || undefined,
        errorMessage: update.errorMessage || undefined,
        retryCount: update.retryCount !== undefined ? update.retryCount : undefined,
        sentAt: update.sentAt || undefined,
      },
    });
  } catch (error) {
    console.warn(`[delivery.repo] updateEmailDeliveryStatus failed for id '${id}':`, error);
    return null;
  }
}

/**
 * Retrieves the most recent email delivery records.
 */
export async function getRecentEmailDeliveries(limit = 50): Promise<EmailDelivery[]> {
  try {
    return await prisma.emailDelivery.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  } catch (error) {
    console.warn("[delivery.repo] getRecentEmailDeliveries failed:", error);
    return [];
  }
}
