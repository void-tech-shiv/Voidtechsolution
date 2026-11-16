import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  hasPermission,
  requirePermission,
  requireRole,
  assertCanCreateAdmin,
  assertCanModifyAdmin,
  ROLE_PERMISSIONS,
  AuthorizationError,
  SoleSuperAdminProtectionError,
  ExactlyOneSuperAdminError,
  SelfModificationError,
  type PermissionKey,
} from "@/server/security/rbac";
import {
  createAdminUser,
  updateAdminRole,
  setAdminActiveStatus,
  deleteAdminUser,
} from "@/server/repositories/users.repo";
import {
  createAdminUserAction,
  updateAdminRoleAction,
  setAdminStatusAction,
  deleteAdminUserAction,
} from "@/server/actions/admin-management.actions";
import { GET as adminUsersGetHandler, POST as adminUsersPostHandler } from "@/app/api/admin/users/route";
import { SESSION_COOKIE_NAME } from "@/server/security/session";
import { prisma } from "@/lib/prisma";
import type { AdminUser, UserRole } from "@prisma/client";
import { NextRequest } from "next/server";

// Mock headers and cookies for Next.js App Router environment
let mockHeaders = new Headers({
  host: "localhost:3000",
  origin: "http://localhost:3000",
});
let mockCookieStore: Record<string, string> = {};

vi.mock("next/headers", () => ({
  headers: () => Promise.resolve(mockHeaders),
  cookies: () =>
    Promise.resolve({
      get: (name: string) =>
        mockCookieStore[name] ? { name, value: mockCookieStore[name] } : undefined,
      set: (name: string, value: string) => {
        mockCookieStore[name] = value;
      },
      delete: (name: string) => {
        delete mockCookieStore[name];
      },
    }),
}));

// Mock subjects for testing
const mockSuperAdmin: AdminUser = {
  id: "usr_super_admin",
  email: "superadmin@example.com",
  passwordHash: "hash_super",
  name: "Master Super Admin",
  role: "SUPER_ADMIN" as UserRole,
  isActive: true,
  lastLoginAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockAdmin: AdminUser = {
  id: "usr_admin_ops",
  email: "admin@example.com",
  passwordHash: "hash_admin",
  name: "Ops Admin",
  role: "ADMIN" as UserRole,
  isActive: true,
  lastLoginAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockEditor: AdminUser = {
  id: "usr_editor_content",
  email: "editor@example.com",
  passwordHash: "hash_editor",
  name: "Content Editor",
  role: "EDITOR" as UserRole,
  isActive: true,
  lastLoginAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockDeactivatedAdmin: AdminUser = {
  id: "usr_deactivated",
  email: "deactivated@example.com",
  passwordHash: "hash_deactivated",
  name: "Deactivated Admin",
  role: "ADMIN" as UserRole,
  isActive: false,
  lastLoginAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("Milestone 7.3: Centralized RBAC Permission Matrix & Guards", () => {
  const allPermissions: PermissionKey[] = [
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
  ];

  it("ROLE_PERMISSIONS defines approved permissions for exactly three roles", () => {
    expect(Object.keys(ROLE_PERMISSIONS)).toEqual(["SUPER_ADMIN", "ADMIN", "EDITOR"]);
    expect(ROLE_PERMISSIONS.SUPER_ADMIN).toHaveLength(14);
    expect(ROLE_PERMISSIONS.ADMIN).toHaveLength(7);
    expect(ROLE_PERMISSIONS.EDITOR).toHaveLength(5);
  });

  it("SUPER_ADMIN holds all 14 administrative permissions", () => {
    for (const perm of allPermissions) {
      expect(hasPermission("SUPER_ADMIN", perm)).toBe(true);
      expect(() => requirePermission(mockSuperAdmin, perm)).not.toThrow();
    }
  });

  it("ADMIN holds operational permissions and lacks governance/destructive permissions", () => {
    const adminAllowed: PermissionKey[] = [
      "dashboard:view",
      "enquiries:view",
      "enquiries:update_status",
      "services:manage",
      "pricing:manage",
      "portfolio:manage",
      "faqs:manage",
    ];

    const adminForbidden: PermissionKey[] = [
      "enquiries:delete",
      "settings:manage",
      "audit_logs:view",
      "admins:manage",
      "admins:change_role",
      "sessions:revoke_all",
      "password:reset_admin",
    ];

    for (const perm of adminAllowed) {
      expect(hasPermission("ADMIN", perm)).toBe(true);
      expect(() => requirePermission(mockAdmin, perm)).not.toThrow();
    }

    for (const perm of adminForbidden) {
      expect(hasPermission("ADMIN", perm)).toBe(false);
      expect(() => requirePermission(mockAdmin, perm)).toThrowError(AuthorizationError);
    }
  });

  it("EDITOR holds content permissions only and lacks pricing, lead status, and admin controls", () => {
    const editorAllowed: PermissionKey[] = [
      "dashboard:view",
      "enquiries:view",
      "services:manage",
      "portfolio:manage",
      "faqs:manage",
    ];

    const editorForbidden: PermissionKey[] = [
      "enquiries:update_status",
      "enquiries:delete",
      "pricing:manage",
      "settings:manage",
      "audit_logs:view",
      "admins:manage",
      "admins:change_role",
      "sessions:revoke_all",
      "password:reset_admin",
    ];

    for (const perm of editorAllowed) {
      expect(hasPermission("EDITOR", perm)).toBe(true);
      expect(() => requirePermission(mockEditor, perm)).not.toThrow();
    }

    for (const perm of editorForbidden) {
      expect(hasPermission("EDITOR", perm)).toBe(false);
      expect(() => requirePermission(mockEditor, perm)).toThrowError(AuthorizationError);
    }
  });

  it("rejects unauthenticated user with 401 code", () => {
    expect(() => requirePermission(null, "dashboard:view")).toThrowError(AuthorizationError);
    try {
      requirePermission(null, "dashboard:view");
    } catch (err) {
      expect((err as AuthorizationError).code).toBe("UNAUTHENTICATED");
      expect((err as AuthorizationError).statusCode).toBe(401);
    }
  });

  it("rejects deactivated administrator across all operations", () => {
    expect(() => requirePermission(mockDeactivatedAdmin, "dashboard:view")).toThrowError(
      "Administrator account is currently deactivated"
    );
    try {
      requirePermission(mockDeactivatedAdmin, "dashboard:view");
    } catch (err) {
      expect((err as AuthorizationError).code).toBe("ACCOUNT_DEACTIVATED");
    }
  });

  it("requireRole enforces exact role match and rejects mismatches", () => {
    expect(() => requireRole(mockSuperAdmin, "SUPER_ADMIN")).not.toThrow();
    expect(() => requireRole(mockAdmin, ["SUPER_ADMIN", "ADMIN"])).not.toThrow();
    expect(() => requireRole(mockEditor, "ADMIN")).toThrowError(AuthorizationError);
  });
});

describe("Milestone 7.3: Exactly One SUPER_ADMIN Invariants & Non-Escalation", () => {
  it("SUPER_ADMIN cannot create another SUPER_ADMIN via standard creation", () => {
    expect(() => assertCanCreateAdmin(mockSuperAdmin, "SUPER_ADMIN", false)).toThrowError(
      ExactlyOneSuperAdminError
    );
  });

  it("SUPER_ADMIN can create ADMIN and EDITOR accounts", () => {
    expect(() => assertCanCreateAdmin(mockSuperAdmin, "ADMIN", false)).not.toThrow();
    expect(() => assertCanCreateAdmin(mockSuperAdmin, "EDITOR", false)).not.toThrow();
  });

  it("ADMIN cannot create administrator accounts", () => {
    expect(() => assertCanCreateAdmin(mockAdmin, "ADMIN", false)).toThrowError(AuthorizationError);
    expect(() => assertCanCreateAdmin(mockAdmin, "EDITOR", false)).toThrowError(AuthorizationError);
    expect(() => assertCanCreateAdmin(mockAdmin, "SUPER_ADMIN", false)).toThrowError(AuthorizationError);
  });

  it("EDITOR cannot create administrator accounts", () => {
    expect(() => assertCanCreateAdmin(mockEditor, "ADMIN", false)).toThrowError(AuthorizationError);
    expect(() => assertCanCreateAdmin(mockEditor, "EDITOR", false)).toThrowError(AuthorizationError);
  });

  it("ADMIN cannot modify roles", () => {
    expect(() => assertCanModifyAdmin(mockAdmin, mockEditor, "CHANGE_ROLE", "ADMIN")).toThrowError(
      AuthorizationError
    );
  });

  it("EDITOR cannot modify roles", () => {
    expect(() => assertCanModifyAdmin(mockEditor, mockAdmin, "CHANGE_ROLE", "EDITOR")).toThrowError(
      AuthorizationError
    );
  });

  it("SUPER_ADMIN cannot modify their own role (self-role modification block)", () => {
    expect(() =>
      assertCanModifyAdmin(mockSuperAdmin, mockSuperAdmin, "CHANGE_ROLE", "ADMIN")
    ).toThrowError(SelfModificationError);
  });

  it("SUPER_ADMIN cannot deactivate their own master account (self-deactivation block)", () => {
    expect(() =>
      assertCanModifyAdmin(mockSuperAdmin, mockSuperAdmin, "DEACTIVATE")
    ).toThrowError(SelfModificationError);
  });

  it("SUPER_ADMIN cannot delete their own master account (self-deletion block)", () => {
    expect(() =>
      assertCanModifyAdmin(mockSuperAdmin, mockSuperAdmin, "DELETE")
    ).toThrowError(SelfModificationError);
  });

  it("Master SUPER_ADMIN account cannot be demoted, deactivated, or deleted by any code path", () => {
    const anotherActor = { id: "usr_external", role: "SUPER_ADMIN" as UserRole, isActive: true };
    expect(() =>
      assertCanModifyAdmin(anotherActor, mockSuperAdmin, "CHANGE_ROLE", "ADMIN")
    ).toThrowError(SoleSuperAdminProtectionError);

    expect(() =>
      assertCanModifyAdmin(anotherActor, mockSuperAdmin, "DEACTIVATE")
    ).toThrowError(SoleSuperAdminProtectionError);

    expect(() =>
      assertCanModifyAdmin(anotherActor, mockSuperAdmin, "DELETE")
    ).toThrowError(SoleSuperAdminProtectionError);
  });

  it("No account can be promoted to SUPER_ADMIN", () => {
    expect(() =>
      assertCanModifyAdmin(mockSuperAdmin, mockAdmin, "CHANGE_ROLE", "SUPER_ADMIN")
    ).toThrowError(ExactlyOneSuperAdminError);
  });
});

describe("Milestone 7.3: Concurrency-Safe Repository Invariants & Rollback Protection", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockCookieStore = {};
    mockHeaders = new Headers({
      host: "localhost:3000",
      origin: "http://localhost:3000",
    });

    // Delegate transaction to prisma so top-level spies intercept calls
    vi.spyOn(prisma, "$transaction").mockImplementation(async (callback: any) => {
      if (typeof callback === "function") {
        return callback(prisma);
      }
      return callback;
    });
    vi.spyOn(prisma, "$executeRaw").mockResolvedValue(1 as any);
    vi.spyOn(prisma.adminUser, "count").mockResolvedValue(1);
  });

  it("createAdminUser rejects creating a second SUPER_ADMIN when one already exists (Bootstrap)", async () => {
    vi.spyOn(prisma.adminUser, "count").mockResolvedValue(1);

    await expect(
      createAdminUser(
        {
          email: "secondsuper@example.com",
          passwordHash: "hash123",
          name: "Second Super Admin",
          role: "SUPER_ADMIN",
        },
        undefined,
        { isBootstrap: true }
      )
    ).rejects.toThrowError(ExactlyOneSuperAdminError);
  });

  it("createAdminUser succeeds during initial bootstrap when count is 0", async () => {
    vi.spyOn(prisma.adminUser, "count").mockResolvedValue(0);
    vi.spyOn(prisma.adminUser, "findFirst").mockResolvedValue(null);
    const createSpy = vi.spyOn(prisma.adminUser, "create").mockResolvedValue({
      id: "usr_initial_super",
      email: "master@example.com",
      name: "Initial Super",
      role: "SUPER_ADMIN",
      isActive: true,
      passwordHash: "hash",
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await createAdminUser(
      {
        email: "master@example.com",
        passwordHash: "hash",
        name: "Initial Super",
        role: "SUPER_ADMIN",
      },
      undefined,
      { isBootstrap: true }
    );

    expect(result.role).toBe("SUPER_ADMIN");
    expect(createSpy).toHaveBeenCalled();
  });

  it("updateAdminRole rejects demoting the master SUPER_ADMIN account", async () => {
    vi.spyOn(prisma.adminUser, "findUnique").mockResolvedValue(mockSuperAdmin);

    await expect(
      updateAdminRole("usr_super_admin", "ADMIN", mockSuperAdmin)
    ).rejects.toThrowError(SelfModificationError);

    const anotherActor = { id: "usr_actor2", role: "SUPER_ADMIN" as UserRole, isActive: true };
    await expect(
      updateAdminRole("usr_super_admin", "ADMIN", anotherActor)
    ).rejects.toThrowError(SoleSuperAdminProtectionError);
  });

  it("setAdminActiveStatus rejects deactivating the master SUPER_ADMIN account", async () => {
    vi.spyOn(prisma.adminUser, "findUnique").mockResolvedValue(mockSuperAdmin);

    const anotherActor = { id: "usr_actor2", role: "SUPER_ADMIN" as UserRole, isActive: true };
    await expect(
      setAdminActiveStatus("usr_super_admin", false, anotherActor)
    ).rejects.toThrowError(SoleSuperAdminProtectionError);
  });

  it("deleteAdminUser rejects deleting the master SUPER_ADMIN account", async () => {
    vi.spyOn(prisma.adminUser, "findUnique").mockResolvedValue(mockSuperAdmin);

    const anotherActor = { id: "usr_actor2", role: "SUPER_ADMIN" as UserRole, isActive: true };
    await expect(
      deleteAdminUser("usr_super_admin", anotherActor)
    ).rejects.toThrowError(SoleSuperAdminProtectionError);
  });

  it("simultaneous concurrent role changes / deactivations execute transactionally without violating invariant", async () => {
    vi.spyOn(prisma.adminUser, "findUnique").mockResolvedValue(mockSuperAdmin);

    const actor = { id: "usr_concurrent_actor", role: "SUPER_ADMIN" as UserRole, isActive: true };

    const results = await Promise.allSettled([
      updateAdminRole("usr_super_admin", "EDITOR", actor),
      setAdminActiveStatus("usr_super_admin", false, actor),
      deleteAdminUser("usr_super_admin", actor),
    ]);

    expect(results[0].status).toBe("rejected");
    expect(results[1].status).toBe("rejected");
    expect(results[2].status).toBe("rejected");

    if (results[0].status === "rejected") {
      expect(results[0].reason).toBeInstanceOf(SoleSuperAdminProtectionError);
    }
    if (results[1].status === "rejected") {
      expect(results[1].reason).toBeInstanceOf(SoleSuperAdminProtectionError);
    }
    if (results[2].status === "rejected") {
      expect(results[2].reason).toBeInstanceOf(SoleSuperAdminProtectionError);
    }
  });
});

describe("Milestone 7.3: Server Action Authorization Guards & Audit Logging", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockCookieStore = {};
    mockHeaders = new Headers({
      host: "localhost:3000",
      origin: "http://localhost:3000",
    });

    vi.spyOn(prisma, "$transaction").mockImplementation(async (callback: any) => {
      if (typeof callback === "function") {
        return callback(prisma);
      }
      return callback;
    });
    vi.spyOn(prisma, "$executeRaw").mockResolvedValue(1 as any);
    vi.spyOn(prisma.adminUser, "count").mockResolvedValue(1);
  });

  it("rejects unauthorized Server Actions when called by unauthenticated user", async () => {
    const authActions = await import("@/server/actions/auth.actions");
    vi.spyOn(authActions, "getCurrentAdmin").mockResolvedValue(null);

    const result = await createAdminUserAction({
      name: "New Admin",
      email: "new@example.com",
      password: "Password123!",
      role: "ADMIN",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Authentication required");
  });

  it("rejects createAdminUserAction when user is an ADMIN (non-super-admin)", async () => {
    const authActions = await import("@/server/actions/auth.actions");
    vi.spyOn(authActions, "getCurrentAdmin").mockResolvedValue({
      user: mockAdmin,
      session: {} as any,
    });

    const result = await createAdminUserAction({
      name: "New Admin",
      email: "new@example.com",
      password: "Password123!",
      role: "ADMIN",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Forbidden");
  });

  it("rejects updateAdminRoleAction when user is an EDITOR", async () => {
    const authActions = await import("@/server/actions/auth.actions");
    vi.spyOn(authActions, "getCurrentAdmin").mockResolvedValue({
      user: mockEditor,
      session: {} as any,
    });

    const result = await updateAdminRoleAction({
      targetUserId: "usr_some_user",
      role: "ADMIN",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Forbidden");
  });

  it("rejects setAdminStatusAction when user is an EDITOR", async () => {
    const authActions = await import("@/server/actions/auth.actions");
    vi.spyOn(authActions, "getCurrentAdmin").mockResolvedValue({
      user: mockEditor,
      session: {} as any,
    });

    const result = await setAdminStatusAction({
      targetUserId: "usr_some_user",
      isActive: false,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Forbidden");
  });

  it("rejects deleteAdminUserAction when user is an ADMIN (non-super-admin)", async () => {
    const authActions = await import("@/server/actions/auth.actions");
    vi.spyOn(authActions, "getCurrentAdmin").mockResolvedValue({
      user: mockAdmin,
      session: {} as any,
    });

    const result = await deleteAdminUserAction("usr_target");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Forbidden");
  });

  it("creates immutable audit log records for successful administrative operations", async () => {
    const authActions = await import("@/server/actions/auth.actions");
    vi.spyOn(authActions, "getCurrentAdmin").mockResolvedValue({
      user: mockSuperAdmin,
      session: {} as any,
    });

    vi.spyOn(prisma.adminUser, "findFirst").mockResolvedValue(null);
    vi.spyOn(prisma.adminUser, "create").mockResolvedValue({
      id: "usr_newly_created",
      email: "subadmin@example.com",
      name: "Sub Admin",
      role: "ADMIN",
      isActive: true,
      passwordHash: "hash",
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const auditSpy = vi.spyOn(prisma.auditLog, "create").mockResolvedValue({} as any);

    const result = await createAdminUserAction({
      name: "Sub Admin",
      email: "subadmin@example.com",
      password: "Password123!",
      role: "ADMIN",
    });

    expect(result.success).toBe(true);
    expect(auditSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "ADMIN_USER_CREATED",
          entity: "AdminUser",
          entityId: "usr_newly_created",
          actorId: "usr_super_admin",
        }),
      })
    );
  });
});

describe("Milestone 7.3: Administrative Route Handler Authorization", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockCookieStore = {};
    mockHeaders = new Headers({
      host: "localhost:3000",
      origin: "http://localhost:3000",
    });
  });

  it("GET /api/admin/users rejects unauthenticated requests with 401", async () => {
    mockCookieStore = {};
    const req = new NextRequest("http://localhost:3000/api/admin/users", {
      method: "GET",
    });

    const res = await adminUsersGetHandler(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it("GET /api/admin/users rejects requests from ADMIN or EDITOR with 403", async () => {
    mockCookieStore[SESSION_COOKIE_NAME] = "valid_token";
    const sessionModule = await import("@/server/security/session");
    vi.spyOn(sessionModule, "validateAdminSession").mockResolvedValue({
      isValid: true,
      user: mockEditor,
      session: {} as any,
    });

    const req = new NextRequest("http://localhost:3000/api/admin/users", {
      method: "GET",
    });

    const res = await adminUsersGetHandler(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("POST /api/admin/users rejects requests from ADMIN or EDITOR with 403", async () => {
    mockCookieStore[SESSION_COOKIE_NAME] = "valid_token";
    const sessionModule = await import("@/server/security/session");
    vi.spyOn(sessionModule, "validateAdminSession").mockResolvedValue({
      isValid: true,
      user: mockAdmin,
      session: {} as any,
    });

    const req = new NextRequest("http://localhost:3000/api/admin/users", {
      method: "POST",
      headers: {
        host: "localhost:3000",
        origin: "http://localhost:3000",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        name: "Unauthorized Creator",
        email: "unauth@example.com",
        password: "Password123!",
        role: "ADMIN",
      }),
    });

    const res = await adminUsersPostHandler(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe("FORBIDDEN");
  });
});
