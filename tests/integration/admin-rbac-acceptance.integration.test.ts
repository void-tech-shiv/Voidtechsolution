import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import type { AdminUser } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/server/security/password";
import {
  createAdminSession,
  validateAdminSession,
  revokeAdminSession,
  SESSION_COOKIE_NAME,
} from "@/server/security/session";
import {
  hasPermission,
  requirePermission,
  AuthorizationError,
  SoleSuperAdminProtectionError,
  ExactlyOneSuperAdminError,
  type PermissionKey,
} from "@/server/security/rbac";
import {
  createAdminUser,
  updateAdminRole,
  setAdminActiveStatus,
  deleteAdminUser,
  getAllAdmins,
} from "@/server/repositories/users.repo";
import {
  updateEnquiryStatusAction,
  deleteEnquiryAction,
  updateSiteSettingAction,
  toggleServiceActiveAction,
  createFaqAction,
  togglePricingPackageActiveAction,
} from "@/server/actions/admin-content.actions";
import {
  createAdminUserAction,
} from "@/server/actions/admin-management.actions";
import { getRecentAuditLogs } from "@/server/repositories/audit.repo";
import { AUDIT_ACTIONS } from "@/server/security/audit";
import { SelfModificationError } from "@/server/security/rbac";

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  "postgresql://postgres:root@localhost:5432/voidtech_test_concurrency";

// Mock next/headers for Server Action execution
let currentSessionCookie: string | null = null;
const mockHeadersMap = new Map<string, string>([
  ["host", "localhost:3000"],
  ["origin", "http://localhost:3000"],
  ["user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) TestBrowser/1.0"],
  ["x-forwarded-for", "127.0.0.1"],
]);

vi.mock("next/headers", () => ({
  headers: () => Promise.resolve(mockHeadersMap),
  cookies: () =>
    Promise.resolve({
      get: (name: string) =>
        name === SESSION_COOKIE_NAME && currentSessionCookie
          ? { name, value: currentSessionCookie }
          : undefined,
      set: vi.fn(),
      delete: vi.fn(),
    }),
}));

describe("Authenticated Admin Route & RBAC Acceptance Test Suite (Isolated PostgreSQL)", () => {
  let isDbAvailable = false;

  let superAdminUser: AdminUser;
  let adminUser: AdminUser;
  let editorUser: AdminUser;

  let superAdminCookie: string;
  let adminCookie: string;
  let editorCookie: string;

  let testEnquiryId: string;
  let testServiceId: string;
  let testPricingPackageId: string;

  let superPasswordHash: string;
  let adminPasswordHash: string;
  let editorPasswordHash: string;

  beforeAll(async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      isDbAvailable = true;

      // Pre-compute password hashes once for high performance
      superPasswordHash = await hashPassword("TestSuperSecretPass!2026#");
      adminPasswordHash = await hashPassword("TestAdminSecretPass!2026#");
      editorPasswordHash = await hashPassword("TestEditorSecretPass!2026#");
    } catch {
      isDbAvailable = false;
      console.warn(
        `[acceptance-test] Test database not reachable at ${TEST_DATABASE_URL}. Skipping live DB tests.`
      );
    }
  });

  afterAll(async () => {
    if (prisma) {
      if (isDbAvailable) {
        await prisma.pricingPackage.deleteMany({ where: { slug: "test-temp-package" } });
        await prisma.service.deleteMany({ where: { slug: "test-temp-service" } });
        await prisma.pricingPackage.updateMany({ data: { isActive: true } });
        await prisma.service.updateMany({ data: { isActive: true } });
        await prisma.siteSetting.updateMany({
          where: { key: "site_name" },
          data: { value: "VOIDTECH SOLUTION" },
        });
      }
      await prisma.$disconnect();
    }
  });

  beforeEach(async () => {
    if (!isDbAvailable) return;

    // Clean session, audit, enquiry, and admin user tables
    await prisma.adminSession.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.enquiry.deleteMany();
    await prisma.adminUser.deleteMany();

    // Reset default mock headers
    mockHeadersMap.set("host", "localhost:3000");
    mockHeadersMap.set("origin", "http://localhost:3000");

    // 1. Provision initial SUPER_ADMIN via bootstrap protocol
    superAdminUser = await createAdminUser(
      {
        email: "master.super@voidtech.test",
        passwordHash: superPasswordHash,
        name: "Test Master SuperAdmin",
        role: "SUPER_ADMIN",
      },
      undefined,
      { isBootstrap: true }
    );

    // 2. Provision ADMIN via SUPER_ADMIN actor
    adminUser = await createAdminUser(
      {
        email: "ops.admin@voidtech.test",
        passwordHash: adminPasswordHash,
        name: "Test Ops Admin",
        role: "ADMIN",
      },
      superAdminUser
    );

    // 3. Provision EDITOR via SUPER_ADMIN actor
    editorUser = await createAdminUser(
      {
        email: "content.editor@voidtech.test",
        passwordHash: editorPasswordHash,
        name: "Test Content Editor",
        role: "EDITOR",
      },
      superAdminUser
    );

    // 4. Create active sessions for each role
    const superSessionRes = await createAdminSession(superAdminUser.id, {
      ipAddress: "127.0.0.1",
      userAgent: "Vitest-SuperAdmin/1.0",
    });
    superAdminCookie = superSessionRes.cookieValue;

    const adminSessionRes = await createAdminSession(adminUser.id, {
      ipAddress: "127.0.0.1",
      userAgent: "Vitest-Admin/1.0",
    });
    adminCookie = adminSessionRes.cookieValue;

    const editorSessionRes = await createAdminSession(editorUser.id, {
      ipAddress: "127.0.0.1",
      userAgent: "Vitest-Editor/1.0",
    });
    editorCookie = editorSessionRes.cookieValue;

    // 5. Seed an isolated enquiry for enquiry actions
    const enquiry = await prisma.enquiry.create({
      data: {
        name: "Acme Corp Lead",
        email: "lead@acme.test",
        phone: "+91 9876543210",
        companyName: "Acme Industries",
        serviceCategory: "WEB_DEVELOPMENT",
        budgetRange: "₹25,000 - ₹50,000",
        timeline: "1 Month",
        message: "Need a full-stack Next.js web application.",
        status: "NEW",
      },
    });
    testEnquiryId = enquiry.id;

    // Clean previous temporary test packages and services
    await prisma.pricingPackage.deleteMany({ where: { slug: "test-temp-package" } });
    await prisma.service.deleteMany({ where: { slug: "test-temp-service" } });

    // Create dedicated test package and service for mutation tests (preserves seeded catalog)
    const testPkg = await prisma.pricingPackage.create({
      data: {
        slug: "test-temp-package",
        name: "Temporary Test Tier",
        category: "WEB_DEVELOPMENT",
        priceInr: 99999,
        isStartingPrice: false,
        features: ["Test feature"],
        orderIndex: 999,
        isActive: true,
      },
    });
    testPricingPackageId = testPkg.id;

    const testSrv = await prisma.service.create({
      data: {
        slug: "test-temp-service",
        title: "Temporary Test Service",
        shortDesc: "Testing toggle action",
        fullDesc: "Testing toggle action full description",
        category: "WEB_DEVELOPMENT",
        startingPriceInr: 10000,
        deliverables: ["Test deliverable"],
        technologies: ["Node"],
        orderIndex: 999,
        isActive: true,
      },
    });
    testServiceId = testSrv.id;
  });

  describe("1. Isolated Test Account Provisioning & Password Security", () => {
    it("creates isolated SUPER_ADMIN, ADMIN, and EDITOR accounts with Scrypt hashes", async () => {
      if (!isDbAvailable) return;

      expect(superAdminUser.role).toBe("SUPER_ADMIN");
      expect(adminUser.role).toBe("ADMIN");
      expect(editorUser.role).toBe("EDITOR");

      // Verify passwords are NOT stored in plain text and match Scrypt hash format (salt:derivedKey)
      expect(superAdminUser.passwordHash).toMatch(/^[a-f0-9]{32}:[a-f0-9]{128}$/);
      expect(adminUser.passwordHash).toMatch(/^[a-f0-9]{32}:[a-f0-9]{128}$/);
      expect(editorUser.passwordHash).toMatch(/^[a-f0-9]{32}:[a-f0-9]{128}$/);

      // Verify all accounts are active by default
      expect(superAdminUser.isActive).toBe(true);
      expect(adminUser.isActive).toBe(true);
      expect(editorUser.isActive).toBe(true);
    });

    it("verifies dual-layer session creation: SHA-256 hash in DB and HMAC signed cookie", async () => {
      if (!isDbAvailable) return;

      const sessions = await prisma.adminSession.findMany();
      expect(sessions).toHaveLength(3);

      for (const s of sessions) {
        // DB holds 64-character SHA-256 hex string (never raw token)
        expect(s.sessionToken).toMatch(/^[a-f0-9]{64}$/);
        expect(s.expiresAt.getTime()).toBeGreaterThan(Date.now());
      }

      // Authoritative validation of cookies
      const superValidation = await validateAdminSession(superAdminCookie);
      expect(superValidation.isValid).toBe(true);
      if (superValidation.isValid) {
        expect(superValidation.user.role).toBe("SUPER_ADMIN");
      }

      const adminValidation = await validateAdminSession(adminCookie);
      expect(adminValidation.isValid).toBe(true);
      if (adminValidation.isValid) {
        expect(adminValidation.user.role).toBe("ADMIN");
      }

      const editorValidation = await validateAdminSession(editorCookie);
      expect(editorValidation.isValid).toBe(true);
      if (editorValidation.isValid) {
        expect(editorValidation.user.role).toBe("EDITOR");
      }
    });
  });

  describe("2. Role-Based Access Control Matrix Verification", () => {
    const MATRIX: Array<{
      operation: string;
      permission: PermissionKey;
      superAdmin: boolean;
      admin: boolean;
      editor: boolean;
    }> = [
      { operation: "View dashboard", permission: "dashboard:view", superAdmin: true, admin: true, editor: true },
      { operation: "Manage users", permission: "admins:manage", superAdmin: true, admin: false, editor: false },
      { operation: "View audit logs", permission: "audit_logs:view", superAdmin: true, admin: false, editor: false },
      { operation: "Manage settings", permission: "settings:manage", superAdmin: true, admin: false, editor: false },
      { operation: "View enquiries", permission: "enquiries:view", superAdmin: true, admin: true, editor: true },
      { operation: "Update enquiries", permission: "enquiries:update_status", superAdmin: true, admin: true, editor: false },
      { operation: "Delete enquiries", permission: "enquiries:delete", superAdmin: true, admin: false, editor: false },
      { operation: "Manage services", permission: "services:manage", superAdmin: true, admin: true, editor: true },
      { operation: "Manage pricing", permission: "pricing:manage", superAdmin: true, admin: true, editor: false },
      { operation: "Manage portfolio", permission: "portfolio:manage", superAdmin: true, admin: true, editor: true },
      { operation: "Manage FAQs", permission: "faqs:manage", superAdmin: true, admin: true, editor: true },
    ];

    for (const entry of MATRIX) {
      it(`enforces RBAC for '${entry.operation}' (${entry.permission}) across all roles`, () => {
        expect(hasPermission("SUPER_ADMIN", entry.permission)).toBe(entry.superAdmin);
        expect(hasPermission("ADMIN", entry.permission)).toBe(entry.admin);
        expect(hasPermission("EDITOR", entry.permission)).toBe(entry.editor);

        // Test requirePermission throws AuthorizationError when false
        if (entry.superAdmin) {
          expect(() => requirePermission(superAdminUser, entry.permission)).not.toThrow();
        } else {
          expect(() => requirePermission(superAdminUser, entry.permission)).toThrow(AuthorizationError);
        }

        if (entry.admin) {
          expect(() => requirePermission(adminUser, entry.permission)).not.toThrow();
        } else {
          expect(() => requirePermission(adminUser, entry.permission)).toThrow(AuthorizationError);
        }

        if (entry.editor) {
          expect(() => requirePermission(editorUser, entry.permission)).not.toThrow();
        } else {
          expect(() => requirePermission(editorUser, entry.permission)).toThrow(AuthorizationError);
        }
      });
    }
  });

  describe("3. Direct Server Action Invocations & Unauthorized Rejections", () => {
    describe("User Management Actions (admins:manage)", () => {
      it("allows SUPER_ADMIN to create an admin account and logs audit event", async () => {
        if (!isDbAvailable) return;
        currentSessionCookie = superAdminCookie;

        const res = await createAdminUserAction({
          email: "new.admin@voidtech.test",
          password: "StrongPass!New123#",
          name: "New Admin",
          role: "ADMIN",
        });

        expect(res.success).toBe(true);
        expect(res.data?.user.email).toBe("new.admin@voidtech.test");

        // Verify audit log
        const auditLogs = await getRecentAuditLogs(10);
        const createdLog = auditLogs.find(
          (l) => l.action === AUDIT_ACTIONS.ADMIN_USER_CREATED
        );
        expect(createdLog).toBeDefined();
        expect(createdLog?.actorId).toBe(superAdminUser.id);
      });

      it("rejects ADMIN from creating an account without modifying database", async () => {
        if (!isDbAvailable) return;
        currentSessionCookie = adminCookie;

        const countBefore = await prisma.adminUser.count();
        const res = await createAdminUserAction({
          email: "unauthorized.admin@voidtech.test",
          password: "StrongPass!New123#",
          name: "Unauthorized",
          role: "ADMIN",
        });

        expect(res.success).toBe(false);
        expect(res.error).toContain("Forbidden");

        const countAfter = await prisma.adminUser.count();
        expect(countAfter).toBe(countBefore);
      });

      it("rejects EDITOR from creating an account without modifying database", async () => {
        if (!isDbAvailable) return;
        currentSessionCookie = editorCookie;

        const res = await createAdminUserAction({
          email: "unauthorized.editor@voidtech.test",
          password: "StrongPass!New123#",
          name: "Unauthorized",
          role: "EDITOR",
        });

        expect(res.success).toBe(false);
        expect(res.error).toContain("Forbidden");
      });
    });

    describe("Enquiry Management Actions (enquiries:update_status & enquiries:delete)", () => {
      it("allows ADMIN to update enquiry status and logs audit event", async () => {
        if (!isDbAvailable) return;
        currentSessionCookie = adminCookie;

        const res = await updateEnquiryStatusAction(testEnquiryId, "IN_REVIEW", "Reviewing proposal");
        expect(res.success).toBe(true);

        const updatedEnquiry = await prisma.enquiry.findUnique({
          where: { id: testEnquiryId },
        });
        expect(updatedEnquiry?.status).toBe("IN_REVIEW");

        // Verify audit log
        const auditLogs = await getRecentAuditLogs(5);
        const updateLog = auditLogs.find(
          (l) => l.action === AUDIT_ACTIONS.ENQUIRY_STATUS_UPDATED
        );
        expect(updateLog).toBeDefined();
        expect(updateLog?.actorId).toBe(adminUser.id);
      });

      it("rejects EDITOR from updating enquiry status and leaves database unchanged", async () => {
        if (!isDbAvailable) return;
        currentSessionCookie = editorCookie;

        const res = await updateEnquiryStatusAction(testEnquiryId, "CONVERTED");
        expect(res.success).toBe(false);
        expect(res.error).toContain("Forbidden");

        const unchangedEnquiry = await prisma.enquiry.findUnique({
          where: { id: testEnquiryId },
        });
        expect(unchangedEnquiry?.status).not.toBe("CONVERTED");
      });

      it("rejects ADMIN from deleting enquiry (enquiries:delete is SUPER_ADMIN only)", async () => {
        if (!isDbAvailable) return;
        currentSessionCookie = adminCookie;

        const res = await deleteEnquiryAction(testEnquiryId);
        expect(res.success).toBe(false);
        expect(res.error).toContain("Forbidden");

        const stillExists = await prisma.enquiry.findUnique({
          where: { id: testEnquiryId },
        });
        expect(stillExists).toBeDefined();
      });

      it("allows SUPER_ADMIN to delete enquiry and logs audit event", async () => {
        if (!isDbAvailable) return;
        currentSessionCookie = superAdminCookie;

        const res = await deleteEnquiryAction(testEnquiryId);
        expect(res.success).toBe(true);

        const deleted = await prisma.enquiry.findUnique({
          where: { id: testEnquiryId },
        });
        expect(deleted).toBeNull();

        const auditLogs = await getRecentAuditLogs(5);
        const deleteLog = auditLogs.find(
          (l) => l.action === AUDIT_ACTIONS.ENQUIRY_DELETED
        );
        expect(deleteLog).toBeDefined();
        expect(deleteLog?.actorId).toBe(superAdminUser.id);
      });
    });

    describe("Platform Settings Actions (settings:manage)", () => {
      it("rejects ADMIN from modifying platform settings and leaves DB unchanged", async () => {
        if (!isDbAvailable) return;
        currentSessionCookie = adminCookie;

        const res = await updateSiteSettingAction("site_name", "MALICIOUS OVERWRITE");
        expect(res.success).toBe(false);
        expect(res.error).toContain("Forbidden");

        const setting = await prisma.siteSetting.findUnique({
          where: { key: "site_name" },
        });
        expect(setting?.value).not.toBe("MALICIOUS OVERWRITE");
      });

      it("allows SUPER_ADMIN to modify settings and logs audit event", async () => {
        if (!isDbAvailable) return;
        currentSessionCookie = superAdminCookie;

        try {
          const res = await updateSiteSettingAction("site_name", "VOIDTECH ENTERPRISE");
          expect(res.success).toBe(true);

          const setting = await prisma.siteSetting.findUnique({
            where: { key: "site_name" },
          });
          expect(setting?.value).toBe("VOIDTECH ENTERPRISE");

          const auditLogs = await getRecentAuditLogs(5);
          const settingLog = auditLogs.find(
            (l) => l.action === AUDIT_ACTIONS.SETTINGS_UPDATED
          );
          expect(settingLog).toBeDefined();
          expect(settingLog?.actorId).toBe(superAdminUser.id);
        } finally {
          await updateSiteSettingAction("site_name", "VOIDTECH SOLUTION");
        }
      });
    });

    describe("Pricing Package Actions (pricing:manage)", () => {
      it("rejects EDITOR from toggling pricing packages", async () => {
        if (!isDbAvailable || !testPricingPackageId) return;
        currentSessionCookie = editorCookie;

        const res = await togglePricingPackageActiveAction(testPricingPackageId, false);
        expect(res.success).toBe(false);
        expect(res.error).toContain("Forbidden");
      });

      it("allows ADMIN to toggle pricing package availability", async () => {
        if (!isDbAvailable || !testPricingPackageId) return;
        currentSessionCookie = adminCookie;

        const res = await togglePricingPackageActiveAction(testPricingPackageId, false);
        expect(res.success).toBe(true);

        const pkg = await prisma.pricingPackage.findUnique({
          where: { id: testPricingPackageId },
        });
        expect(pkg?.isActive).toBe(false);
      });
    });

    describe("Services & FAQs Actions (services:manage & faqs:manage)", () => {
      it("allows EDITOR to toggle service visibility", async () => {
        if (!isDbAvailable || !testServiceId) return;
        currentSessionCookie = editorCookie;

        const res = await toggleServiceActiveAction(testServiceId, false);
        expect(res.success).toBe(true);

        const srv = await prisma.service.findUnique({
          where: { id: testServiceId },
        });
        expect(srv?.isActive).toBe(false);
      });

      it("allows EDITOR to create an FAQ entry", async () => {
        if (!isDbAvailable) return;
        currentSessionCookie = editorCookie;

        const res = await createFaqAction(
          "How do you handle scope changes?",
          "We use transparent change orders with two included revision cycles.",
          "GENERAL"
        );
        expect(res.success).toBe(true);
        expect((res.data as { question?: string })?.question).toBe("How do you handle scope changes?");
      });
    });
  });

  describe("4. Security Regressions & Boundary Defenses", () => {
    it("session revocation: revoking session immediately invalidates authentication", async () => {
      if (!isDbAvailable) return;

      const revoked = await revokeAdminSession(adminCookie);
      expect(revoked).toBe(true);

      const check = await validateAdminSession(adminCookie);
      expect(check.isValid).toBe(false);
      if (!check.isValid) {
        expect(check.reason).toBe("SESSION_NOT_FOUND");
      }
    });

    it("idle timeout: rejects session when lastActiveAt exceeds 30 minutes", async () => {
      if (!isDbAvailable) return;

      const sessionRow = await prisma.adminSession.findFirst({
        where: { userId: superAdminUser.id },
      });
      expect(sessionRow).toBeDefined();

      // Set lastActiveAt to 35 minutes in the past
      await prisma.adminSession.update({
        where: { id: sessionRow!.id },
        data: { lastActiveAt: new Date(Date.now() - 35 * 60 * 1000) },
      });

      const check = await validateAdminSession(superAdminCookie);
      expect(check.isValid).toBe(false);
      if (!check.isValid) {
        expect(check.reason).toBe("IDLE_TIMEOUT");
      }
    });

    it("expired session: rejects session when expiresAt exceeds 8 hours absolute lifetime", async () => {
      if (!isDbAvailable) return;

      const sessionRow = await prisma.adminSession.findFirst({
        where: { userId: editorUser.id },
      });
      expect(sessionRow).toBeDefined();

      // Set expiresAt to 5 minutes in the past
      await prisma.adminSession.update({
        where: { id: sessionRow!.id },
        data: { expiresAt: new Date(Date.now() - 5 * 60 * 1000) },
      });

      const check = await validateAdminSession(editorCookie);
      expect(check.isValid).toBe(false);
      if (!check.isValid) {
        expect(check.reason).toBe("ABSOLUTE_TIMEOUT");
      }
    });

    it("inactive administrator: rejects session when admin isActive flag is false", async () => {
      if (!isDbAvailable) return;

      // Deactivate admin account
      await prisma.adminUser.update({
        where: { id: adminUser.id },
        data: { isActive: false },
      });

      const check = await validateAdminSession(adminCookie);
      expect(check.isValid).toBe(false);
      if (!check.isValid) {
        expect(check.reason).toBe("USER_INACTIVE");
      }
    });

    it("CSRF & Origin protection: rejects request when origin is untrusted", async () => {
      if (!isDbAvailable) return;
      currentSessionCookie = superAdminCookie;

      // Set untrusted origin
      mockHeadersMap.set("origin", "https://unauthorized-attacker.com");

      const res = await updateSiteSettingAction("site_name", "ATTACK_VALUE");
      expect(res.success).toBe(false);
      expect(res.error).toContain("Cross-origin request rejected");
    });

    it("sole SUPER_ADMIN protection: prohibits deleting, demoting, or deactivating the master account", async () => {
      if (!isDbAvailable) return;
      currentSessionCookie = superAdminCookie;

      // 1. Self-modification by SUPER_ADMIN throws SelfModificationError
      await expect(
        deleteAdminUser(superAdminUser.id, superAdminUser)
      ).rejects.toThrow(SelfModificationError);

      await expect(
        updateAdminRole(superAdminUser.id, "ADMIN", superAdminUser)
      ).rejects.toThrow(SelfModificationError);

      await expect(
        setAdminActiveStatus(superAdminUser.id, false, superAdminUser)
      ).rejects.toThrow(SelfModificationError);

      // 2. Unauthorized attempt by another admin (ADMIN) throws AuthorizationError
      await expect(
        deleteAdminUser(superAdminUser.id, adminUser)
      ).rejects.toThrow(AuthorizationError);

      await expect(
        updateAdminRole(superAdminUser.id, "ADMIN", adminUser)
      ).rejects.toThrow(AuthorizationError);

      await expect(
        setAdminActiveStatus(superAdminUser.id, false, adminUser)
      ).rejects.toThrow(AuthorizationError);

      // 3. Direct repository invariant (no actor passed) throws SoleSuperAdminProtectionError
      await expect(
        deleteAdminUser(superAdminUser.id)
      ).rejects.toThrow(SoleSuperAdminProtectionError);

      await expect(
        updateAdminRole(superAdminUser.id, "ADMIN")
      ).rejects.toThrow(SoleSuperAdminProtectionError);

      await expect(
        setAdminActiveStatus(superAdminUser.id, false)
      ).rejects.toThrow(SoleSuperAdminProtectionError);
    });

    it("exactly-one-SUPER_ADMIN invariant: prohibits creating a second SUPER_ADMIN", async () => {
      if (!isDbAvailable) return;

      // Bootstrap attempt when a SUPER_ADMIN already exists
      await expect(
        createAdminUser(
          {
            email: "second.super@voidtech.test",
            passwordHash: "$scrypt$dummy",
            name: "Second SuperAdmin",
            role: "SUPER_ADMIN",
          },
          undefined,
          { isBootstrap: true }
        )
      ).rejects.toThrow(ExactlyOneSuperAdminError);

      // Standard creation attempt of SUPER_ADMIN by existing SUPER_ADMIN
      await expect(
        createAdminUser(
          {
            email: "second.super@voidtech.test",
            passwordHash: "$scrypt$dummy",
            name: "Second SuperAdmin",
            role: "SUPER_ADMIN",
          },
          superAdminUser
        )
      ).rejects.toThrow(AuthorizationError);
    });

    it("credential scrubbing: getAllAdmins does not expose passwordHash or session tokens", async () => {
      if (!isDbAvailable) return;

      const users = await getAllAdmins();
      expect(users.length).toBeGreaterThanOrEqual(3);

      for (const u of users) {
        expect((u as any).passwordHash).toBeUndefined();
        expect((u as any).sessionToken).toBeUndefined();
      }
    });

    it("audit trail is read-only: audit module does not export update or delete functions", async () => {
      const auditRepo = await import("@/server/repositories/audit.repo");
      expect((auditRepo as any).updateAuditLog).toBeUndefined();
      expect((auditRepo as any).deleteAuditLog).toBeUndefined();
      expect((auditRepo as any).clearAuditLogs).toBeUndefined();
    });
  });
});

