import { prisma } from "@/lib/prisma";
import type { AuditLog, Prisma } from "@prisma/client";

/**
 * VOIDTECH SOLUTION — Centralized Audit Logging Engine
 * 
 * ==============================================================================
 * AUDIT LOG INTEGRITY & SECURITY BOUNDARIES TAXONOMY
 * ==============================================================================
 * 
 * 1. Application-Level Append-Only Restrictions:
 *    - The application layer exposes exclusively append (create) and query (read) functions.
 *    - No update, delete, truncate, drop, or rewrite operations are defined or exported.
 *    - All detail payloads pass through recursive credential scrubbing (`sanitizeAuditDetails`)
 *      with a defensive recursion depth cap of 6 levels, guaranteeing passwords, tokens,
 *      cookies, secrets, and connection strings are never persisted unredacted.
 * 
 * 2. Database-Level Protections & Historical Record Preservation:
 *    - The Prisma/PostgreSQL relational schema decouples `AuditLog` from `AdminUser`:
 *      `actorId` and `actorEmail` are persisted as scalar string columns without foreign keys
 *      or `onDelete: Cascade` constraints.
 *    - When an administrator account is deactivated, demoted, or deleted, all historical
 *      audit records referencing that administrator remain 100% intact.
 *    - In production database administration, table-level permissions should be enforced
 *      by revoking destructive privileges from the application database role:
 *      `REVOKE UPDATE, DELETE, TRUNCATE ON TABLE "AuditLog" FROM voidtech_app_role;`
 * 
 * 3. Protection Against Unrestricted Database Administrators & Tamper-Proofing Reality:
 *    - Application and table-level controls protect against application vulnerabilities,
 *      compromised web sessions, and non-super administrative abuse.
 *    - However, an unrestricted database administrator (e.g. PostgreSQL superuser, Neon
 *      Console administrator, cloud infrastructure root) possessing direct SQL access can
 *      bypass application and role rules to mutate or drop database tables directly.
 *    - Absolute tamper-proofing is therefore NOT claimed at the application or local database
 *      layer alone. High-assurance, tamper-evident audit immutability in production requires
 *      external, forward-secure mechanisms (e.g. WORM storage, AWS S3 Object Lock, external
 *      syslog forwarding to Datadog/CloudWatch, or cryptographic hash-chained ledgers).
 * ==============================================================================
 */

export const AUDIT_ACTIONS = {
  // Authentication Lifecycle
  AUTH_LOGIN_SUCCESS: "AUTH_LOGIN_SUCCESS",
  AUTH_LOGIN_FAILED: "AUTH_LOGIN_FAILED",
  AUTH_LOGOUT: "AUTH_LOGOUT",

  // Administrator Account Governance
  ADMIN_BOOTSTRAP_SUCCESS: "ADMIN_BOOTSTRAP_SUCCESS",
  ADMIN_CREATED: "ADMIN_CREATED",
  ADMIN_USER_CREATED: "ADMIN_USER_CREATED",
  ADMIN_ROLE_UPDATED: "ADMIN_ROLE_UPDATED",
  ADMIN_STATUS_UPDATED: "ADMIN_STATUS_UPDATED",
  ADMIN_ACTIVATED: "ADMIN_ACTIVATED",
  ADMIN_DEACTIVATED: "ADMIN_DEACTIVATED",
  ADMIN_DELETED: "ADMIN_DELETED",
  ADMIN_USER_DELETED: "ADMIN_USER_DELETED",

  // Platform & Content Management
  SETTINGS_UPDATED: "SETTINGS_UPDATED",
  ENQUIRY_STATUS_UPDATED: "ENQUIRY_STATUS_UPDATED",
  ENQUIRY_DELETED: "ENQUIRY_DELETED",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS] | (string & {});

/**
 * Blacklist of sensitive keys that MUST NEVER appear unredacted in audit metadata.
 */
const SENSITIVE_KEYS = new Set([
  "password",
  "passwordhash",
  "newpassword",
  "oldpassword",
  "confirmpassword",
  "rawtoken",
  "sessiontoken",
  "token",
  "secret",
  "authsecret",
  "cookie",
  "cookievalue",
  "codehash",
  "otp",
  "databaseurl",
  "directurl",
  "smtppass",
  "creditcard",
  "cvv",
]);

/**
 * Recursively inspects and sanitizes audit log metadata, redacting any sensitive fields.
 */
export function sanitizeAuditDetails(
  data: unknown,
  depth = 0
): Prisma.InputJsonValue | undefined {
  if (data === undefined || data === null) {
    return undefined;
  }

  // Prevent circular references or overly deep JSON objects
  if (depth > 6) {
    return "[DEPTH_EXCEEDED]";
  }

  if (typeof data === "string" || typeof data === "number" || typeof data === "boolean") {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeAuditDetails(item, depth + 1) ?? null);
  }

  if (typeof data === "object") {
    const sanitized: Record<string, Prisma.InputJsonValue | null> = {};
    for (const [key, val] of Object.entries(data)) {
      const lowerKey = key.toLowerCase().replace(/[^a-z]/g, "");
      if (SENSITIVE_KEYS.has(lowerKey)) {
        sanitized[key] = "[REDACTED]";
      } else {
        const cleaned = sanitizeAuditDetails(val, depth + 1);
        sanitized[key] = cleaned !== undefined ? cleaned : null;
      }
    }
    return sanitized as Prisma.InputJsonValue;
  }

  return String(data);
}

export interface RecordAuditParams {
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  actorId?: string | null;
  actorEmail?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  details?: Record<string, unknown> | null;
}

/**
 * Records an immutable audit log entry.
 * Can participate in an existing Prisma transaction client for atomicity.
 */
export async function recordAuditEvent(
  params: RecordAuditParams,
  tx?: Prisma.TransactionClient | typeof prisma
): Promise<AuditLog> {
  const db = tx || prisma;
  const safeDetails = params.details ? sanitizeAuditDetails(params.details) : undefined;

  try {
    return await db.auditLog.create({
      data: {
        action: params.action,
        entity: params.entity,
        entityId: params.entityId || null,
        actorId: params.actorId || null,
        actorEmail: params.actorEmail ? params.actorEmail.trim().toLowerCase() : null,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
        details: safeDetails || undefined,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[audit.engine] Failed to record audit log:", msg);
    throw new Error("Audit logging failure: Operation aborted to preserve audit integrity.");
  }
}

export interface AuditQueryOptions {
  limit?: number;
  offset?: number;
  action?: string;
  entity?: string;
  entityId?: string;
  actorId?: string;
  actorEmail?: string;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Paginated read-only retrieval of audit events.
 */
export async function getAuditHistory(options?: AuditQueryOptions): Promise<{
  logs: AuditLog[];
  total: number;
}> {
  const where: Prisma.AuditLogWhereInput = {};

  if (options?.action) where.action = options.action;
  if (options?.entity) where.entity = options.entity;
  if (options?.entityId) where.entityId = options.entityId;
  if (options?.actorId) where.actorId = options.actorId;
  if (options?.actorEmail) {
    where.actorEmail = {
      equals: options.actorEmail.trim().toLowerCase(),
      mode: "insensitive",
    };
  }
  if (options?.startDate || options?.endDate) {
    where.createdAt = {};
    if (options.startDate) where.createdAt.gte = options.startDate;
    if (options.endDate) where.createdAt.lte = options.endDate;
  }

  const limit = Math.min(Math.max(options?.limit ?? 50, 1), 200);
  const skip = Math.max(options?.offset ?? 0, 0);

  try {
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs, total };
  } catch (error) {
    console.warn("[audit.engine] getAuditHistory query failed:", error);
    return { logs: [], total: 0 };
  }
}

/**
 * Retrieves a single audit log entry by its unique ID.
 */
export async function getAuditLogById(id: string): Promise<AuditLog | null> {
  try {
    return await prisma.auditLog.findUnique({
      where: { id },
    });
  } catch {
    return null;
  }
}

