import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  sanitizeAuditDetails,
  recordAuditEvent,
  getAuditHistory,
  getAuditLogById,
  AUDIT_ACTIONS,
} from "@/server/security/audit";
import * as auditModule from "@/server/security/audit";
import * as auditRepoModule from "@/server/repositories/audit.repo";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe("Milestone 7.5: Centralized Audit Logging Engine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("sanitizeAuditDetails (Credential Redaction)", () => {
    it("redacts sensitive authentication keys from metadata", () => {
      const sensitiveInput = {
        name: "Admin User",
        email: "admin@voidtechsolution.com",
        password: "MySuperSecretPassword123!",
        passwordHash: "salt:hash12345",
        rawToken: "raw_token_value_abc",
        sessionToken: "session_token_hash",
        secret: "app_secret_key",
        cookie: "vts_session=abc.123",
        otp: "123456",
        databaseUrl: "postgresql://user:pass@host/db",
        role: "ADMIN",
        isActive: true,
      };

      const result = sanitizeAuditDetails(sensitiveInput) as Record<string, unknown>;

      expect(result.name).toBe("Admin User");
      expect(result.email).toBe("admin@voidtechsolution.com");
      expect(result.role).toBe("ADMIN");
      expect(result.isActive).toBe(true);

      // Sensitive fields must be redacted
      expect(result.password).toBe("[REDACTED]");
      expect(result.passwordHash).toBe("[REDACTED]");
      expect(result.rawToken).toBe("[REDACTED]");
      expect(result.sessionToken).toBe("[REDACTED]");
      expect(result.secret).toBe("[REDACTED]");
      expect(result.cookie).toBe("[REDACTED]");
      expect(result.otp).toBe("[REDACTED]");
      expect(result.databaseUrl).toBe("[REDACTED]");
    });

    it("redacts sensitive fields in nested objects and arrays", () => {
      const nestedInput = {
        metadata: {
          clientIp: "127.0.0.1",
          credentials: {
            newPassword: "secretPassword!",
            confirmPassword: "secretPassword!",
          },
        },
        tokens: [
          { token: "abc", type: "session" },
          { token: "def", type: "refresh" },
        ],
      };

      const result = sanitizeAuditDetails(nestedInput) as any;

      expect(result.metadata.clientIp).toBe("127.0.0.1");
      expect(result.metadata.credentials.newPassword).toBe("[REDACTED]");
      expect(result.metadata.credentials.confirmPassword).toBe("[REDACTED]");
      expect(result.tokens[0].token).toBe("[REDACTED]");
      expect(result.tokens[0].type).toBe("session");
      expect(result.tokens[1].token).toBe("[REDACTED]");
    });

    it("handles null and undefined gracefully", () => {
      expect(sanitizeAuditDetails(null)).toBeUndefined();
      expect(sanitizeAuditDetails(undefined)).toBeUndefined();
    });

    it("caps recursion depth against deeply nested objects", () => {
      const deep: any = { a: { b: { c: { d: { e: { f: { g: "too_deep" } } } } } } };
      const result = sanitizeAuditDetails(deep) as any;
      expect(result.a.b.c.d.e.f.g).toBe("[DEPTH_EXCEEDED]");
    });
  });

  describe("recordAuditEvent", () => {
    it("successfully creates an audit record with sanitized details", async () => {
      const mockCreated = {
        id: "audit_123",
        action: AUDIT_ACTIONS.ADMIN_BOOTSTRAP_SUCCESS,
        entity: "AdminUser",
        entityId: "user_master_1",
        actorId: "user_master_1",
        actorEmail: "superadmin@voidtechsolution.com",
        ipAddress: "127.0.0.1",
        userAgent: "CLI Bootstrap",
        details: { role: "SUPER_ADMIN", isBootstrap: true },
        createdAt: new Date(),
      };

      vi.mocked(prisma.auditLog.create).mockResolvedValueOnce(mockCreated);

      const result = await recordAuditEvent({
        action: AUDIT_ACTIONS.ADMIN_BOOTSTRAP_SUCCESS,
        entity: "AdminUser",
        entityId: "user_master_1",
        actorId: "user_master_1",
        actorEmail: "SuperAdmin@VoidTechSolution.COM ", // Should be trimmed and lowercased
        ipAddress: "127.0.0.1",
        userAgent: "CLI Bootstrap",
        details: {
          role: "SUPER_ADMIN",
          isBootstrap: true,
          password: "plain_password_must_be_stripped",
        },
      });

      expect(result).toEqual(mockCreated);
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: "ADMIN_BOOTSTRAP_SUCCESS",
          entity: "AdminUser",
          entityId: "user_master_1",
          actorId: "user_master_1",
          actorEmail: "superadmin@voidtechsolution.com",
          ipAddress: "127.0.0.1",
          userAgent: "CLI Bootstrap",
          details: {
            role: "SUPER_ADMIN",
            isBootstrap: true,
            password: "[REDACTED]",
          },
        },
      });
    });

    it("participates in an existing Prisma transaction client", async () => {
      const mockTx = {
        auditLog: {
          create: vi.fn().mockResolvedValueOnce({
            id: "audit_tx_123",
            action: AUDIT_ACTIONS.ADMIN_USER_CREATED,
            entity: "AdminUser",
            entityId: "user_456",
            createdAt: new Date(),
          }),
        },
      };

      await recordAuditEvent(
        {
          action: AUDIT_ACTIONS.ADMIN_USER_CREATED,
          entity: "AdminUser",
          entityId: "user_456",
          actorId: "super_1",
        },
        mockTx as any
      );

      expect(mockTx.auditLog.create).toHaveBeenCalled();
      expect(prisma.auditLog.create).not.toHaveBeenCalled();
    });

    it("throws a generic integrity error if database write fails", async () => {
      vi.mocked(prisma.auditLog.create).mockRejectedValueOnce(
        new Error("FATAL: connection to postgresql://user:secret@db failed")
      );

      await expect(
        recordAuditEvent({
          action: AUDIT_ACTIONS.AUTH_LOGIN_FAILED,
          entity: "AdminUser",
          actorEmail: "attacker@example.com",
        })
      ).rejects.toThrow("Audit logging failure: Operation aborted to preserve audit integrity.");
    });
  });

  describe("getAuditHistory & getAuditLogById", () => {
    it("retrieves paginated audit events with total count", async () => {
      const mockLogs = [
        {
          id: "log_1",
          action: "AUTH_LOGIN_SUCCESS",
          entity: "AdminUser",
          entityId: "user_1",
          actorId: "user_1",
          actorEmail: "admin@voidtechsolution.com",
          ipAddress: "127.0.0.1",
          userAgent: "Mozilla",
          details: null,
          createdAt: new Date(),
        },
      ];

      vi.mocked(prisma.auditLog.findMany).mockResolvedValueOnce(mockLogs);
      vi.mocked(prisma.auditLog.count).mockResolvedValueOnce(1);

      const result = await getAuditHistory({ limit: 10, offset: 0 });

      expect(result.logs).toEqual(mockLogs);
      expect(result.total).toBe(1);
      expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: "desc" },
        take: 10,
        skip: 0,
      });
    });

    it("retrieves single audit log by ID", async () => {
      const mockLog = {
        id: "log_999",
        action: "ADMIN_BOOTSTRAP_SUCCESS",
        entity: "AdminUser",
        entityId: "user_1",
        actorId: "user_1",
        actorEmail: "superadmin@voidtechsolution.com",
        ipAddress: "127.0.0.1",
        userAgent: "CLI",
        details: null,
        createdAt: new Date(),
      };

      vi.mocked(prisma.auditLog.findUnique).mockResolvedValueOnce(mockLog);

      const log = await getAuditLogById("log_999");
      expect(log).toEqual(mockLog);
      expect(prisma.auditLog.findUnique).toHaveBeenCalledWith({
        where: { id: "log_999" },
      });
    });
  });

  describe("Append-Only Invariant Enforcement", () => {
    it("ensures audit module exports zero update or delete methods", () => {
      const auditExports = Object.keys(auditModule);
      const repoExports = Object.keys(auditRepoModule);

      const forbiddenMethodPatterns = [/update/i, /delete/i, /remove/i, /truncate/i, /purge/i];

      for (const exp of [...auditExports, ...repoExports]) {
        for (const pattern of forbiddenMethodPatterns) {
          expect(exp).not.toMatch(pattern);
        }
      }
    });
  });
});
