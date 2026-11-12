import { describe, it, expect, vi, beforeEach } from "vitest";
import { createAdminUser } from "@/server/repositories/users.repo";
import { ExactlyOneSuperAdminError } from "@/server/security/rbac";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $executeRaw: vi.fn(),
    $transaction: vi.fn(),
    adminUser: {},
    auditLog: {},
  },
}));

describe("Milestone 7.5: Concurrency Safety & SUPER_ADMIN Invariant Locking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("enforces PostgreSQL advisory transaction lock on super_admin_lifecycle_lock", async () => {
    let rawLockExecuted = false;

    const mockTx = {
      $executeRaw: vi.fn().mockImplementation(async (strings: TemplateStringsArray) => {
        if (strings[0]?.includes("pg_advisory_xact_lock(hashtext('super_admin_lifecycle_lock'))")) {
          rawLockExecuted = true;
        }
        return 1;
      }),
      adminUser: {
        count: vi.fn().mockResolvedValueOnce(0),
        findFirst: vi.fn().mockResolvedValueOnce(null),
        create: vi.fn().mockResolvedValueOnce({
          id: "super_1",
          email: "master@voidtechsolution.com",
          name: "Master Admin",
          role: "SUPER_ADMIN",
          isActive: true,
        }),
      },
      auditLog: {
        create: vi.fn().mockResolvedValueOnce({ id: "audit_1" }),
      },
    };

    vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback: any) => {
      return await callback(mockTx);
    });

    const result = await createAdminUser(
      {
        email: "master@voidtechsolution.com",
        passwordHash: "salt:hash",
        name: "Master Admin",
        role: "SUPER_ADMIN",
      },
      undefined,
      { isBootstrap: true }
    );

    expect(result.role).toBe("SUPER_ADMIN");
    expect(rawLockExecuted).toBe(true);
    expect(mockTx.$executeRaw).toHaveBeenCalled();
  });

  it("handles concurrent bootstrap attempts: exactly one succeeds and the other is rejected", async () => {
    // Shared simulated database state
    let globalSuperAdminCount = 0;
    let lockQueue: Promise<void> = Promise.resolve();

    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
      // Simulate PostgreSQL transaction advisory locking serialization
      const currentLock = lockQueue;
      let releaseLock!: () => void;
      lockQueue = new Promise<void>((resolve) => {
        releaseLock = resolve;
      });

      await currentLock; // Wait for previous transaction to release lock

      try {
        const txClient = {
          $executeRaw: vi.fn().mockResolvedValue(1),
          adminUser: {
            count: vi.fn().mockImplementation(async () => globalSuperAdminCount),
            findFirst: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockImplementation(async (args: any) => {
              globalSuperAdminCount += 1;
              return {
                id: `admin_${Date.now()}_${Math.random()}`,
                ...args.data,
              };
            }),
          },
          auditLog: {
            create: vi.fn().mockResolvedValue({ id: "audit_concurrent" }),
          },
        };

        return await callback(txClient);
      } finally {
        releaseLock(); // Release lock upon transaction commit or rollback
      }
    });

    // Run two concurrent bootstrap attempts
    const attempt1 = createAdminUser(
      {
        email: "first_attempt@voidtechsolution.com",
        passwordHash: "salt:hash1",
        name: "First Super Admin",
        role: "SUPER_ADMIN",
      },
      undefined,
      { isBootstrap: true }
    );

    const attempt2 = createAdminUser(
      {
        email: "second_attempt@voidtechsolution.com",
        passwordHash: "salt:hash2",
        name: "Second Super Admin",
        role: "SUPER_ADMIN",
      },
      undefined,
      { isBootstrap: true }
    );

    const results = await Promise.allSettled([attempt1, attempt2]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    // Exactly one must succeed
    expect(fulfilled.length).toBe(1);
    // Exactly one must be rejected
    expect(rejected.length).toBe(1);

    // The rejected one must fail with ExactlyOneSuperAdminError
    const rejectionReason = (rejected[0] as PromiseRejectedResult).reason;
    expect(rejectionReason).toBeInstanceOf(ExactlyOneSuperAdminError);
    expect(rejectionReason.message).toContain("Creating additional SUPER_ADMIN accounts is strictly forbidden.");

    // Final database state must have exactly one SUPER_ADMIN
    expect(globalSuperAdminCount).toBe(1);
  });

  it("rolls back transaction when audit logging fails, leaving no partial admin state", async () => {
    let userCreatedInTx = false;

    const mockTx = {
      $executeRaw: vi.fn().mockResolvedValue(1),
      adminUser: {
        count: vi.fn().mockResolvedValue(0),
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockImplementation(async () => {
          userCreatedInTx = true;
          return {
            id: "user_orphan_candidate",
            email: "orphan@voidtechsolution.com",
            role: "SUPER_ADMIN",
          };
        }),
      },
      auditLog: {
        create: vi.fn().mockRejectedValue(new Error("Disk full: Audit log write failed")),
      },
    };

    vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback: any) => {
      try {
        return await callback(mockTx);
      } catch (err) {
        // Transaction rolls back
        userCreatedInTx = false;
        throw err;
      }
    });

    await expect(
      createAdminUser(
        {
          email: "orphan@voidtechsolution.com",
          passwordHash: "salt:hash",
          name: "Orphan Test",
          role: "SUPER_ADMIN",
        },
        undefined,
        { isBootstrap: true }
      )
    ).rejects.toThrow();

    // Verify state was rolled back
    expect(userCreatedInTx).toBe(false);
  });
});
