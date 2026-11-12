"use server";

import { headers } from "next/headers";
import { getCurrentAdmin } from "@/server/actions/auth.actions";
import {
  createAdminUser,
  updateAdminRole,
  setAdminActiveStatus,
  deleteAdminUser,
} from "@/server/repositories/users.repo";
import { hashPassword } from "@/server/security/password";
import { validateRequestOrigin } from "@/server/security/origin";
import { createAuditLog } from "@/server/repositories/audit.repo";
import {
  requirePermission,
  AuthorizationError,
  SoleSuperAdminProtectionError,
  ExactlyOneSuperAdminError,
  SelfModificationError,
} from "@/server/security/rbac";
import {
  createAdminSchema,
  updateAdminRoleSchema,
  setAdminStatusSchema,
} from "@/validations/admin-management";
import type { AdminUser, UserRole } from "@prisma/client";

export interface AdminActionResult<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

/**
 * Server Action: Provision a new administrator account (ADMIN or EDITOR).
 * Authorization: Restricted strictly to SUPER_ADMIN.
 */
export async function createAdminUserAction(
  input: unknown
): Promise<AdminActionResult<{ user: Omit<AdminUser, "passwordHash"> }>> {
  const reqHeaders = await headers();

  if (!validateRequestOrigin(reqHeaders)) {
    return {
      success: false,
      error: "Cross-origin request rejected. Please refresh and try again.",
    };
  }

  const current = await getCurrentAdmin();
  if (!current) {
    return { success: false, error: "Authentication required." };
  }

  try {
    requirePermission(current.user, "admins:manage");

    const parsed = createAdminSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid input data.",
      };
    }

    const { name, email, password, role } = parsed.data;
    const passwordHash = hashPassword(password);

    const newUser = await createAdminUser(
      {
        email,
        passwordHash,
        name,
        role: role as UserRole,
      },
      current.user
    );

    const ip = reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const userAgent = reqHeaders.get("user-agent") || "unknown";

    await createAuditLog({
      action: "ADMIN_USER_CREATED",
      entity: "AdminUser",
      entityId: newUser.id,
      actorId: current.user.id,
      actorEmail: current.user.email,
      ipAddress: ip,
      userAgent,
      details: {
        createdEmail: newUser.email,
        createdRole: newUser.role,
        createdName: newUser.name,
      },
    });

    // Strip passwordHash from return payload
    const { passwordHash: _, ...safeUser } = newUser;
    return {
      success: true,
      data: { user: safeUser },
    };
  } catch (err) {
    const errorMsg =
      err instanceof AuthorizationError ||
      err instanceof ExactlyOneSuperAdminError ||
      err instanceof Error
        ? err.message
        : "Failed to create administrator account.";
    return { success: false, error: errorMsg };
  }
}

/**
 * Server Action: Update an administrator's role.
 * Authorization: Restricted strictly to SUPER_ADMIN.
 */
export async function updateAdminRoleAction(
  input: unknown
): Promise<AdminActionResult<{ user: Omit<AdminUser, "passwordHash"> }>> {
  const reqHeaders = await headers();

  if (!validateRequestOrigin(reqHeaders)) {
    return {
      success: false,
      error: "Cross-origin request rejected. Please refresh and try again.",
    };
  }

  const current = await getCurrentAdmin();
  if (!current) {
    return { success: false, error: "Authentication required." };
  }

  try {
    requirePermission(current.user, "admins:change_role");

    const parsed = updateAdminRoleSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid input data.",
      };
    }

    const { targetUserId, role } = parsed.data;

    const updated = await updateAdminRole(targetUserId, role as UserRole, current.user);

    const ip = reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const userAgent = reqHeaders.get("user-agent") || "unknown";

    await createAuditLog({
      action: "ADMIN_ROLE_UPDATED",
      entity: "AdminUser",
      entityId: updated.id,
      actorId: current.user.id,
      actorEmail: current.user.email,
      ipAddress: ip,
      userAgent,
      details: {
        updatedUserId: updated.id,
        newRole: updated.role,
      },
    });

    const { passwordHash: _, ...safeUser } = updated;
    return {
      success: true,
      data: { user: safeUser },
    };
  } catch (err) {
    const errorMsg =
      err instanceof AuthorizationError ||
      err instanceof SoleSuperAdminProtectionError ||
      err instanceof ExactlyOneSuperAdminError ||
      err instanceof SelfModificationError ||
      err instanceof Error
        ? err.message
        : "Failed to update administrator role.";
    return { success: false, error: errorMsg };
  }
}

/**
 * Server Action: Update an administrator's active status.
 * Authorization: Restricted strictly to SUPER_ADMIN.
 */
export async function setAdminStatusAction(
  input: unknown
): Promise<AdminActionResult<{ user: Omit<AdminUser, "passwordHash"> }>> {
  const reqHeaders = await headers();

  if (!validateRequestOrigin(reqHeaders)) {
    return {
      success: false,
      error: "Cross-origin request rejected. Please refresh and try again.",
    };
  }

  const current = await getCurrentAdmin();
  if (!current) {
    return { success: false, error: "Authentication required." };
  }

  try {
    requirePermission(current.user, "admins:manage");

    const parsed = setAdminStatusSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid input data.",
      };
    }

    const { targetUserId, isActive } = parsed.data;

    const updated = await setAdminActiveStatus(targetUserId, isActive, current.user);

    const ip = reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const userAgent = reqHeaders.get("user-agent") || "unknown";

    await createAuditLog({
      action: isActive ? "ADMIN_ACTIVATED" : "ADMIN_DEACTIVATED",
      entity: "AdminUser",
      entityId: updated.id,
      actorId: current.user.id,
      actorEmail: current.user.email,
      ipAddress: ip,
      userAgent,
      details: {
        targetUserId: updated.id,
        isActive: updated.isActive,
      },
    });

    const { passwordHash: _, ...safeUser } = updated;
    return {
      success: true,
      data: { user: safeUser },
    };
  } catch (err) {
    const errorMsg =
      err instanceof AuthorizationError ||
      err instanceof SoleSuperAdminProtectionError ||
      err instanceof SelfModificationError ||
      err instanceof Error
        ? err.message
        : "Failed to update administrator status.";
    return { success: false, error: errorMsg };
  }
}

/**
 * Server Action: Permanently delete an administrator account.
 * Authorization: Restricted strictly to SUPER_ADMIN.
 */
export async function deleteAdminUserAction(
  targetUserId: string
): Promise<AdminActionResult<{ deletedId: string }>> {
  const reqHeaders = await headers();

  if (!validateRequestOrigin(reqHeaders)) {
    return {
      success: false,
      error: "Cross-origin request rejected. Please refresh and try again.",
    };
  }

  const current = await getCurrentAdmin();
  if (!current) {
    return { success: false, error: "Authentication required." };
  }

  try {
    requirePermission(current.user, "admins:manage");

    const deleted = await deleteAdminUser(targetUserId, current.user);

    const ip = reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const userAgent = reqHeaders.get("user-agent") || "unknown";

    await createAuditLog({
      action: "ADMIN_USER_DELETED",
      entity: "AdminUser",
      entityId: deleted.id,
      actorId: current.user.id,
      actorEmail: current.user.email,
      ipAddress: ip,
      userAgent,
      details: {
        deletedUserId: deleted.id,
        deletedEmail: deleted.email,
        deletedRole: deleted.role,
      },
    });

    return {
      success: true,
      data: { deletedId: deleted.id },
    };
  } catch (err) {
    const errorMsg =
      err instanceof AuthorizationError ||
      err instanceof SoleSuperAdminProtectionError ||
      err instanceof SelfModificationError ||
      err instanceof Error
        ? err.message
        : "Failed to delete administrator account.";
    return { success: false, error: errorMsg };
  }
}

