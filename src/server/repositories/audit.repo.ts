import { prisma } from "@/lib/prisma";
import type { AuditLog, Prisma } from "@prisma/client";

export interface CreateAuditLogParams {
  action: string;
  entity: string;
  entityId?: string;
  actorId?: string;
  actorEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Prisma.InputJsonValue;
}

/**
 * Creates an immutable audit log entry.
 * Write operation strictly catches and reports without leaking credentials.
 */
export async function createAuditLog(params: CreateAuditLogParams): Promise<AuditLog> {
  try {
    return await prisma.auditLog.create({
      data: {
        action: params.action,
        entity: params.entity,
        entityId: params.entityId || null,
        actorId: params.actorId || null,
        actorEmail: params.actorEmail || null,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
        details: params.details || undefined,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[audit.repo] createAuditLog failed:", msg);
    throw new Error("Failed to record audit log: Database write operation failed.");
  }
}

/**
 * Retrieves the most recent audit logs.
 */
export async function getRecentAuditLogs(limit = 50): Promise<AuditLog[]> {
  try {
    return await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  } catch (error) {
    console.warn("[audit.repo] getRecentAuditLogs query failed:", error);
    return [];
  }
}

/**
 * Retrieves audit logs for a specific entity.
 */
export async function getAuditLogsByEntity(
  entity: string,
  entityId?: string
): Promise<AuditLog[]> {
  try {
    const where: Prisma.AuditLogWhereInput = { entity };
    if (entityId) {
      where.entityId = entityId;
    }

    return await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.warn(`[audit.repo] getAuditLogsByEntity failed for '${entity}':`, error);
    return [];
  }
}

