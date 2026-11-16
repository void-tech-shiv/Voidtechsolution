import type { UserRole, AdminUser } from "@prisma/client";

/**
 * Centralized, type-safe administrative permission keys.
 * Every administrative operation in VOIDTECH SOLUTION maps to an explicit permission key.
 */
export type PermissionKey =
  | "dashboard:view"
  | "enquiries:view"
  | "enquiries:update_status"
  | "enquiries:delete"
  | "services:manage"
  | "pricing:manage"
  | "portfolio:manage"
  | "faqs:manage"
  | "settings:manage"
  | "audit_logs:view"
  | "admins:manage"
  | "admins:change_role"
  | "sessions:revoke_all"
  | "password:reset_admin";

/**
 * Approved Role-Based Access Control (RBAC) permission mapping.
 * Strictly three roles: SUPER_ADMIN, ADMIN, EDITOR.
 */
export const ROLE_PERMISSIONS: Record<UserRole, readonly PermissionKey[]> = {
  SUPER_ADMIN: [
    "dashboard:view",
    "enquiries:view",
    "enquiries:update_status",
    "enquiries:delete",
    "services:manage",
    "pricing:manage",
    "portfolio:manage",
    "faqs:manage",
    "settings:manage",
    "audit_logs:view",
    "admins:manage",
    "admins:change_role",
    "sessions:revoke_all",
    "password:reset_admin",
  ],
  ADMIN: [
    "dashboard:view",
    "enquiries:view",
    "enquiries:update_status",
    "services:manage",
    "pricing:manage",
    "portfolio:manage",
    "faqs:manage",
  ],
  EDITOR: [
    "dashboard:view",
    "enquiries:view",
    "services:manage",
    "portfolio:manage",
    "faqs:manage",
  ],
};

/**
 * Custom Authorization Error with machine-readable code.
 */
export class AuthorizationError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(
    message: string,
    code: "UNAUTHENTICATED" | "ACCOUNT_DEACTIVATED" | "FORBIDDEN" | string = "FORBIDDEN",
    statusCode = 403
  ) {
    super(message);
    this.name = "AuthorizationError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * Specific error raised when an operation violates the master SUPER_ADMIN protection invariant.
 */
export class SoleSuperAdminProtectionError extends AuthorizationError {
  constructor(message = "The master SUPER_ADMIN account cannot be deleted, demoted, or deactivated.") {
    super(message, "SOLE_SUPER_ADMIN_PROTECTED", 403);
    this.name = "SoleSuperAdminProtectionError";
  }
}

/**
 * Specific error raised when attempting to create a second SUPER_ADMIN account.
 */
export class ExactlyOneSuperAdminError extends AuthorizationError {
  constructor(message = "The system permits exactly one SUPER_ADMIN account. Creating additional SUPER_ADMIN accounts is forbidden.") {
    super(message, "EXACTLY_ONE_SUPER_ADMIN_ALLOWED", 409);
    this.name = "ExactlyOneSuperAdminError";
  }
}

/**
 * Specific error raised when an administrator attempts to modify their own role or active status.
 */
export class SelfModificationError extends AuthorizationError {
  constructor(message = "Administrators cannot modify their own role, status, or delete their own account.") {
    super(message, "SELF_MODIFICATION_FORBIDDEN", 400);
    this.name = "SelfModificationError";
  }
}

/**
 * Checks whether a given role holds the specified permission key.
 */
export function hasPermission(role: UserRole, permission: PermissionKey): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions.includes(permission);
}

/**
 * User subject interface required for permission evaluation.
 */
export type UserSubject = Pick<AdminUser, "id" | "role" | "isActive">;

/**
 * Asserts that the authenticated user holds the required permission.
 * Throws an AuthorizationError if unauthenticated, deactivated, or lacking permission.
 */
export function requirePermission(
  user: UserSubject | null | undefined,
  permission: PermissionKey
): void {
  if (!user) {
    throw new AuthorizationError("Authentication required.", "UNAUTHENTICATED", 401);
  }

  if (!user.isActive) {
    throw new AuthorizationError(
      "Administrator account is currently deactivated. Access denied.",
      "ACCOUNT_DEACTIVATED",
      403
    );
  }

  if (!hasPermission(user.role, permission)) {
    throw new AuthorizationError(
      `Forbidden: Administrator role '${user.role}' lacks the required '${permission}' permission.`,
      "FORBIDDEN",
      403
    );
  }
}

/**
 * Asserts that the authenticated user has one of the required roles.
 */
export function requireRole(
  user: UserSubject | null | undefined,
  requiredRole: UserRole | UserRole[]
): void {
  if (!user) {
    throw new AuthorizationError("Authentication required.", "UNAUTHENTICATED", 401);
  }

  if (!user.isActive) {
    throw new AuthorizationError(
      "Administrator account is currently deactivated. Access denied.",
      "ACCOUNT_DEACTIVATED",
      403
    );
  }

  const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  if (!allowedRoles.includes(user.role)) {
    throw new AuthorizationError(
      `Forbidden: Required role '${allowedRoles.join(" | ")}' but current role is '${user.role}'.`,
      "FORBIDDEN",
      403
    );
  }
}

/**
 * Validates whether an actor can create a new administrator with the specified role.
 * Invariant: Only SUPER_ADMIN can create accounts, and only ADMIN or EDITOR roles can be created.
 */
export function assertCanCreateAdmin(
  actor: UserSubject,
  requestedRole: UserRole,
  isBootstrap = false
): void {
  requirePermission(actor, "admins:manage");

  if (actor.role !== "SUPER_ADMIN" && !isBootstrap) {
    throw new AuthorizationError(
      `Forbidden: Role '${actor.role}' cannot create administrator accounts. Only SUPER_ADMIN holds provisioning authority.`,
      "FORBIDDEN",
      403
    );
  }

  if (requestedRole === "SUPER_ADMIN" && !isBootstrap) {
    throw new ExactlyOneSuperAdminError();
  }
}

/**
 * Validates whether an actor can modify or delete a target administrator.
 * Invariants:
 * 1. Actor must be active SUPER_ADMIN.
 * 2. Actor cannot modify own role, deactivate self, or delete self.
 * 3. Master SUPER_ADMIN cannot be demoted, deactivated, or deleted.
 * 4. No account can be promoted to SUPER_ADMIN.
 */
export function assertCanModifyAdmin(
  actor: UserSubject,
  target: UserSubject,
  action: "CHANGE_ROLE" | "DEACTIVATE" | "DELETE" | "RESET_PASSWORD",
  nextRole?: UserRole
): void {
  if (!actor.isActive) {
    throw new AuthorizationError("Account is deactivated.", "ACCOUNT_DEACTIVATED", 403);
  }

  // 1. Only SUPER_ADMIN can manage administrator accounts
  if (actor.role !== "SUPER_ADMIN") {
    throw new AuthorizationError(
      `Forbidden: Role '${actor.role}' is not authorized to perform administrative governance. Only SUPER_ADMIN can manage accounts.`,
      "FORBIDDEN",
      403
    );
  }

  // 2. Prevent self-modifications
  if (actor.id === target.id) {
    if (action === "CHANGE_ROLE") {
      throw new SelfModificationError("Administrators cannot modify their own role.");
    }
    if (action === "DEACTIVATE") {
      throw new SelfModificationError("Administrators cannot deactivate their own account.");
    }
    if (action === "DELETE") {
      throw new SelfModificationError("Administrators cannot delete their own account.");
    }
  }

  // 3. Master SUPER_ADMIN protection invariant
  if (target.role === "SUPER_ADMIN") {
    if (action === "DELETE") {
      throw new SoleSuperAdminProtectionError("The master SUPER_ADMIN account cannot be deleted.");
    }
    if (action === "DEACTIVATE") {
      throw new SoleSuperAdminProtectionError("The master SUPER_ADMIN account cannot be deactivated.");
    }
    if (action === "CHANGE_ROLE" && nextRole !== "SUPER_ADMIN") {
      throw new SoleSuperAdminProtectionError("The master SUPER_ADMIN account cannot be demoted.");
    }
  }

  // 4. Exactly one SUPER_ADMIN: Nobody can be promoted to SUPER_ADMIN
  if (action === "CHANGE_ROLE" && nextRole === "SUPER_ADMIN" && target.role !== "SUPER_ADMIN") {
    throw new ExactlyOneSuperAdminError(
      "Promoting accounts to SUPER_ADMIN is forbidden. The system permits exactly one SUPER_ADMIN."
    );
  }
}

