import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  bootstrapInputSchema,
  checkDatabaseAndInvariant,
  executeBootstrap,
  runBootstrapCli,
} from "@/../scripts/create-admin";
import { prisma } from "@/lib/prisma";
import * as usersRepo from "@/server/repositories/users.repo";
import * as auditService from "@/server/security/audit";
import { ExactlyOneSuperAdminError } from "@/server/security/rbac";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: vi.fn(),
    $disconnect: vi.fn(),
    adminUser: {
      count: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/server/repositories/users.repo", () => ({
  createAdminUser: vi.fn(),
  getAdminByEmail: vi.fn(),
}));

vi.mock("@/server/security/audit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/server/security/audit")>();
  return {
    ...actual,
    recordAuditEvent: vi.fn(),
  };
});

describe("Milestone 7.5: SUPER_ADMIN Bootstrap CLI & Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("bootstrapInputSchema (Input Validation)", () => {
    const validPayload = {
      name: "Shivanshu Satyajeet",
      email: "master@voidtechsolution.com",
      password: "MasterSecurePassword2026!",
      confirmPassword: "MasterSecurePassword2026!",
    };

    it("accepts valid, compliant bootstrap inputs", () => {
      const parsed = bootstrapInputSchema.safeParse(validPayload);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.name).toBe("Shivanshu Satyajeet");
        expect(parsed.data.email).toBe("master@voidtechsolution.com");
      }
    });

    it("rejects missing or too short full name (< 2 characters)", () => {
      const parsed = bootstrapInputSchema.safeParse({
        ...validPayload,
        name: "A",
      });
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues[0]?.message).toContain("Full name must be at least 2 characters long");
      }
    });

    it("rejects invalid email formats", () => {
      const parsed = bootstrapInputSchema.safeParse({
        ...validPayload,
        email: "not-an-email",
      });
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues[0]?.message).toContain("Please provide a valid, fully-formed email address");
      }
    });

    it("rejects passwords shorter than 12 characters", () => {
      const parsed = bootstrapInputSchema.safeParse({
        ...validPayload,
        password: "Short1!",
        confirmPassword: "Short1!",
      });
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues[0]?.message).toContain("Master password must be at least 12 characters long");
      }
    });

    it("rejects passwords missing required character classes", () => {
      // Missing uppercase
      expect(
        bootstrapInputSchema.safeParse({
          ...validPayload,
          password: "password12345!",
          confirmPassword: "password12345!",
        }).success
      ).toBe(false);

      // Missing lowercase
      expect(
        bootstrapInputSchema.safeParse({
          ...validPayload,
          password: "PASSWORD12345!",
          confirmPassword: "PASSWORD12345!",
        }).success
      ).toBe(false);

      // Missing digit
      expect(
        bootstrapInputSchema.safeParse({
          ...validPayload,
          password: "PasswordSpecial!",
          confirmPassword: "PasswordSpecial!",
        }).success
      ).toBe(false);

      // Missing symbol
      expect(
        bootstrapInputSchema.safeParse({
          ...validPayload,
          password: "PasswordNoSymbol123",
          confirmPassword: "PasswordNoSymbol123",
        }).success
      ).toBe(false);
    });

    it("rejects mismatched password confirmations", () => {
      const parsed = bootstrapInputSchema.safeParse({
        ...validPayload,
        confirmPassword: "DifferentPassword2026!",
      });
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues[0]?.message).toContain("Password confirmation does not match the entered password.");
      }
    });
  });

  describe("checkDatabaseAndInvariant", () => {
    it("reports ready when connection succeeds and zero SUPER_ADMIN accounts exist", async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([1]);
      vi.mocked(prisma.adminUser.count).mockResolvedValueOnce(0);

      const result = await checkDatabaseAndInvariant();
      expect(result.ready).toBe(true);
      expect(result.superAdminCount).toBe(0);
    });

    it("reports existing count when a SUPER_ADMIN already exists", async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([1]);
      vi.mocked(prisma.adminUser.count).mockResolvedValueOnce(1);

      const result = await checkDatabaseAndInvariant();
      expect(result.ready).toBe(true);
      expect(result.superAdminCount).toBe(1);
    });

    it("handles connection failure safely without exposing credentials", async () => {
      vi.mocked(prisma.$queryRaw).mockRejectedValueOnce(
        new Error("Connection failed to postgresql://postgres:supersecretpassword@neon.tech/main")
      );

      const result = await checkDatabaseAndInvariant();
      expect(result.ready).toBe(false);
      expect(result.superAdminCount).toBe(0);
      expect(result.error).not.toContain("supersecretpassword");
      expect(result.error).toContain("[REDACTED_CREDENTIALS]");
    });
  });

  describe("executeBootstrap", () => {
    const validInputs = {
      name: "Shivanshu Satyajeet",
      email: "master@voidtechsolution.com",
      password: "MasterSecurePassword2026!",
      confirmPassword: "MasterSecurePassword2026!",
    };

    it("rejects if email already exists in database", async () => {
      vi.mocked(usersRepo.getAdminByEmail).mockResolvedValueOnce({
        id: "existing_1",
        email: "master@voidtechsolution.com",
        name: "Existing Admin",
        passwordHash: "salt:hash",
        role: "ADMIN",
        isActive: true,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await executeBootstrap(validInputs);
      expect(result.success).toBe(false);
      expect(result.error).toContain("already exists");
    });

    it("successfully creates initial SUPER_ADMIN with scrypt hash and audit logging", async () => {
      vi.mocked(usersRepo.getAdminByEmail).mockResolvedValueOnce(null);
      vi.mocked(usersRepo.createAdminUser).mockResolvedValueOnce({
        id: "super_admin_id_1",
        email: "master@voidtechsolution.com",
        name: "Shivanshu Satyajeet",
        passwordHash: "scrypt_salt:hash",
        role: "SUPER_ADMIN",
        isActive: true,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await executeBootstrap(validInputs);

      expect(result.success).toBe(true);
      expect(result.user?.id).toBe("super_admin_id_1");
      expect(result.user?.role).toBe("SUPER_ADMIN");

      // Verify createAdminUser was invoked with isBootstrap: true
      expect(usersRepo.createAdminUser).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Shivanshu Satyajeet",
          email: "master@voidtechsolution.com",
          role: "SUPER_ADMIN",
          passwordHash: expect.stringMatching(/^[a-f0-9]{32}:[a-f0-9]{128}$/), // 16-byte salt (32 hex) : 64-byte key (128 hex)
        }),
        undefined,
        { isBootstrap: true }
      );

      // Verify audit event recording was triggered
      expect(auditService.recordAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "ADMIN_BOOTSTRAP_SUCCESS",
          entity: "AdminUser",
          entityId: "super_admin_id_1",
          actorEmail: "master@voidtechsolution.com",
        })
      );
    });

    it("rejects if ExactlyOneSuperAdminError is thrown (super admin invariant violation)", async () => {
      vi.mocked(usersRepo.getAdminByEmail).mockResolvedValueOnce(null);
      vi.mocked(usersRepo.createAdminUser).mockRejectedValueOnce(
        new ExactlyOneSuperAdminError("Initial SUPER_ADMIN already provisioned.")
      );

      const result = await executeBootstrap(validInputs);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Initial SUPER_ADMIN already provisioned");
    });
  });

  describe("runBootstrapCli", () => {
    it("aborts with code 1 when database is unreachable", async () => {
      vi.mocked(prisma.$queryRaw).mockRejectedValueOnce(new Error("Connection refused"));

      const code = await runBootstrapCli();
      expect(code).toBe(1);
    });

    it("aborts with code 1 when a SUPER_ADMIN already exists", async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([1]);
      vi.mocked(prisma.adminUser.count).mockResolvedValueOnce(1); // 1 existing SUPER_ADMIN

      const code = await runBootstrapCli();
      expect(code).toBe(1);
    });
  });
});

