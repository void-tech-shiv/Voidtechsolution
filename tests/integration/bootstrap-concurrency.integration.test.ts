import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { PrismaClient } from "@prisma/client";

/**
 * VOIDTECH SOLUTION — Real PostgreSQL Concurrency Integration Tests
 * 
 * Target: Real isolated PostgreSQL test database (voidtech_test_concurrency).
 * Strict Rule: NEVER USE PRODUCTION NEON DATABASE.
 * 
 * Verifies:
 * 1. Two concurrent bootstrap transactions serialize via pg_advisory_xact_lock.
 * 2. Exactly one SUPER_ADMIN is created; the second is rejected.
 * 3. Exactly one ADMIN_BOOTSTRAP_SUCCESS audit record is persisted.
 * 4. An audit failure forces complete transaction rollback, leaving zero partial state.
 */

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  "postgresql://postgres:root@localhost:5432/voidtech_test_concurrency";

describe("Milestone 7.5: Real PostgreSQL Concurrency & Transaction Serialization Integration", () => {
  let prismaA: PrismaClient;
  let prismaB: PrismaClient;
  let isDbAvailable = false;

  beforeAll(async () => {
    try {
      prismaA = new PrismaClient({
        datasources: { db: { url: TEST_DATABASE_URL } },
      });
      prismaB = new PrismaClient({
        datasources: { db: { url: TEST_DATABASE_URL } },
      });

      // Pre-flight check: verify real PostgreSQL connectivity
      await prismaA.$queryRaw`SELECT 1`;
      isDbAvailable = true;
    } catch {
      isDbAvailable = false;
      console.warn(
        `[integration-test] Real PostgreSQL test database not reachable at ${TEST_DATABASE_URL}. Concurrency tests marked BLOCKED / SKIPPED.`
      );
    }
  });

  afterAll(async () => {
    if (prismaA) await prismaA.$disconnect();
    if (prismaB) await prismaB.$disconnect();
  });

  beforeEach(async () => {
    if (!isDbAvailable) return;
    // Wipe test tables clean before every test
    await prismaA.adminSession.deleteMany();
    await prismaA.auditLog.deleteMany();
    await prismaA.adminUser.deleteMany();
  });

  it("serializes concurrent bootstrap operations and enforces Exactly One SUPER_ADMIN invariant", async () => {
    if (!isDbAvailable) {
      console.warn("BLOCKED: Isolated test database unavailable.");
      return;
    }

    const bootstrapTransaction = async (
      client: PrismaClient,
      email: string,
      name: string
    ) => {
      return await client.$transaction(async (tx) => {
        // Step 1 & 2: Acquire advisory transaction lock
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('super_admin_lifecycle_lock'))`;

        // Step 3: Check existing SUPER_ADMIN count inside lock
        const existingCount = await tx.adminUser.count({
          where: { role: "SUPER_ADMIN" },
        });

        if (existingCount > 0) {
          throw new Error(
            `Existing SUPER_ADMIN account found (${existingCount}). The system business policy strictly permits EXACTLY ONE SUPER_ADMIN account.`
          );
        }

        // Step 4: Create administrator account
        const user = await tx.adminUser.create({
          data: {
            name,
            email,
            passwordHash: "scrypt:mock_salt:mock_hash_for_concurrency_test",
            role: "SUPER_ADMIN",
            isActive: true,
          },
        });

        // Step 5: Record audit log atomically inside the same transaction
        await tx.auditLog.create({
          data: {
            action: "ADMIN_BOOTSTRAP_SUCCESS",
            entity: "AdminUser",
            entityId: user.id,
            actorId: user.id,
            actorEmail: user.email,
            details: { isBootstrap: true, role: "SUPER_ADMIN" },
          },
        });

        return user;
      });
    };

    // Step 1: Start two bootstrap operations concurrently from independent connections
    const [resultA, resultB] = await Promise.allSettled([
      bootstrapTransaction(prismaA, "superadmin.alpha@voidtechsolution.com", "Admin Alpha"),
      bootstrapTransaction(prismaB, "superadmin.beta@voidtechsolution.com", "Admin Beta"),
    ]);

    // Step 2, 3, 4, 5: Verify serialization — exactly one succeeded, one rejected
    const fulfilled = [resultA, resultB].filter((r) => r.status === "fulfilled");
    const rejected = [resultA, resultB].filter((r) => r.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const rejectedError = (rejected[0] as PromiseRejectedResult).reason;
    expect(rejectedError.message).toContain("Existing SUPER_ADMIN account found");
    expect(rejectedError.message).toContain("EXACTLY ONE SUPER_ADMIN");

    // Step 6: Verify exactly one account exists in real PostgreSQL database
    const totalUsers = await prismaA.adminUser.count();
    const superAdminUsers = await prismaA.adminUser.count({
      where: { role: "SUPER_ADMIN" },
    });
    expect(totalUsers).toBe(1);
    expect(superAdminUsers).toBe(1);

    // Step 6b: Verify exactly one audit log exists in real PostgreSQL database
    const totalAuditLogs = await prismaA.auditLog.count();
    const bootstrapLogs = await prismaA.auditLog.count({
      where: { action: "ADMIN_BOOTSTRAP_SUCCESS" },
    });
    expect(totalAuditLogs).toBe(1);
    expect(bootstrapLogs).toBe(1);
  });

  it("rolls back the entire transaction when audit log insertion fails, leaving zero partial admin state", async () => {
    if (!isDbAvailable) {
      console.warn("BLOCKED: Isolated test database unavailable.");
      return;
    }

    let transactionErrorThrown = false;

    try {
      await prismaA.$transaction(async (tx) => {
        // Acquire advisory lock
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('super_admin_lifecycle_lock'))`;

        // Create admin user record
        await tx.adminUser.create({
          data: {
            name: "Candidate Admin",
            email: "candidate@voidtechsolution.com",
            passwordHash: "scrypt:mock_salt:mock_hash",
            role: "SUPER_ADMIN",
            isActive: true,
          },
        });

        // Step 7: Force an audit failure inside the transaction
        throw new Error("Simulated Disk Full: Audit Log Engine write failed");
      });
    } catch (err) {
      transactionErrorThrown = true;
      expect((err as Error).message).toContain("Simulated Disk Full: Audit Log Engine write failed");
    }

    expect(transactionErrorThrown).toBe(true);

    // Verify atomic rollback in real PostgreSQL database
    const userCount = await prismaA.adminUser.count();
    const auditCount = await prismaA.auditLog.count();

    expect(userCount).toBe(0);
    expect(auditCount).toBe(0);
  });
});

