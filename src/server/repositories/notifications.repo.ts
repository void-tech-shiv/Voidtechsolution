import { prisma } from "@/lib/prisma";
import type { AdminNotification, Prisma } from "@prisma/client";

export interface CreateAdminNotificationInput {
  recipientId: string;
  enquiryId?: string | null;
  type: string; // "NEW_LEAD" | "LEAD_ASSIGNED" | "STATUS_CHANGED" | "FOLLOWUP_DUE" | "LEAD_WON"
  title: string;
  message: string;
}

/**
 * Creates an in-app administrative notification.
 * Enforces recipient isolation at query and mutation layers.
 */
export async function createAdminNotification(
  input: CreateAdminNotificationInput,
  tx?: Prisma.TransactionClient
): Promise<AdminNotification> {
  const db = tx || prisma;
  try {
    return await db.adminNotification.create({
      data: {
        recipientId: input.recipientId,
        enquiryId: input.enquiryId || null,
        type: input.type,
        title: input.title.trim(),
        message: input.message.trim(),
        isRead: false,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[notifications.repo] createAdminNotification failed:", msg);
    throw new Error(`Failed to create notification for admin '${input.recipientId}': Database write operation failed.`);
  }
}

/**
 * Retrieves notifications for a specific administrator with strict recipient isolation.
 */
export async function getAdminNotifications(
  recipientId: string,
  unreadOnly = false,
  limit = 50
): Promise<AdminNotification[]> {
  try {
    const where: Prisma.AdminNotificationWhereInput = { recipientId };
    if (unreadOnly) {
      where.isRead = false;
    }

    return await prisma.adminNotification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  } catch (error) {
    console.warn(`[notifications.repo] getAdminNotifications failed for recipient '${recipientId}':`, error);
    return [];
  }
}

/**
 * Retrieves the count of unread notifications for an administrator.
 */
export async function getUnreadNotificationCount(recipientId: string): Promise<number> {
  try {
    return await prisma.adminNotification.count({
      where: { recipientId, isRead: false },
    });
  } catch (error) {
    console.warn(`[notifications.repo] getUnreadNotificationCount failed for recipient '${recipientId}':`, error);
    return 0;
  }
}

/**
 * Marks a single notification as read, ensuring it belongs to the authenticated recipient.
 */
export async function markNotificationAsRead(
  notificationId: string,
  recipientId: string
): Promise<AdminNotification> {
  try {
    // Check ownership before updating
    const existing = await prisma.adminNotification.findUnique({
      where: { id: notificationId },
    });

    if (!existing) {
      throw new Error(`Notification '${notificationId}' not found.`);
    }

    if (existing.recipientId !== recipientId) {
      throw new Error("Access denied: You cannot modify notifications belonging to another administrator.");
    }

    return await prisma.adminNotification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error(`[notifications.repo] markNotificationAsRead failed for '${notificationId}':`, msg);
    throw new Error(`Failed to update notification: ${msg}`);
  }
}

/**
 * Marks all notifications as read for a specific administrator.
 */
export async function markAllNotificationsAsRead(recipientId: string): Promise<number> {
  try {
    const result = await prisma.adminNotification.updateMany({
      where: { recipientId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return result.count;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error(`[notifications.repo] markAllNotificationsAsRead failed for '${recipientId}':`, msg);
    throw new Error(`Failed to mark notifications read: ${msg}`);
  }
}
