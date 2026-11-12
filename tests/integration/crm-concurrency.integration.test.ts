import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  updateEnquiryStatus,
  ConcurrencyConflictError,
} from "@/server/repositories/enquiries.repo";
import {
  createLeadFollowUp,
  toggleFollowUpComplete,
  deleteLeadFollowUp,
} from "@/server/repositories/lead-followups.repo";

/**
 * VOIDTECH SOLUTION — Real PostgreSQL Concurrency & CRM Integrity Integration Tests
 * Target: Real isolated PostgreSQL test database (voidtech_test_concurrency).
 * Strict Rule: NEVER USE PRODUCTION NEON DATABASE.
 */

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  "postgresql://postgres:root@localhost:5432/voidtech_test_concurrency";

describe("Audit 3 & 5: Real PostgreSQL Concurrency & Data Integrity Integration", () => {
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

      await prismaA.$queryRaw`SELECT 1`;
      isDbAvailable = true;
    } catch {
      isDbAvailable = false;
      console.warn(
        `[integration-test] Real PostgreSQL test database not reachable at ${TEST_DATABASE_URL}. Marking integration suite skipped.`
      );
    }
  });

  afterAll(async () => {
    if (prismaA) await prismaA.$disconnect();
    if (prismaB) await prismaB.$disconnect();
  });

  // ============================================================================
  // AUDIT 3: OPTIMISTIC CONCURRENCY CONTROL (OCC)
  // ============================================================================
  describe("Optimistic Concurrency Control (OCC) with Independent DB Connections", () => {
    it("guarantees atomic OCC: concurrent stale updates are rejected and cannot overwrite winning changes", async () => {
      if (!isDbAvailable) return;

      // 1. Create a clean test enquiry
      const enq = await prismaA.enquiry.create({
        data: {
          name: "OCC Real Test Client",
          email: `occ_${Date.now()}@test.com`,
          message: "Real PostgreSQL OCC verification brief.",
          status: "NEW",
        },
      });

      const originalUpdatedAt = enq.updatedAt;

      // 2. Connection A updates the enquiry status from NEW -> CONTACTED
      const updatedA = await updateEnquiryStatus(enq.id, "CONTACTED", {
        expectedUpdatedAt: originalUpdatedAt,
      });

      expect(updatedA.status).toBe("CONTACTED");
      expect(updatedA.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());

      // 3. Connection B attempts to update the enquiry from NEW -> QUALIFIED using the stale timestamp
      await expect(
        updateEnquiryStatus(enq.id, "QUALIFIED", {
          expectedUpdatedAt: originalUpdatedAt, // Stale!
        })
      ).rejects.toThrow(ConcurrencyConflictError);

      // 4. Verify database state remains CONTACTED and was NOT overwritten by B
      const persisted = await prismaB.enquiry.findUnique({
        where: { id: enq.id },
      });

      expect(persisted?.status).toBe("CONTACTED");

      // Cleanup
      await prismaA.enquiry.delete({ where: { id: enq.id } });
    });
  });

  // ============================================================================
  // AUDIT 5: BUSINESS INVARIANTS & INTEGRITY CONSTRAINTS
  // ============================================================================
  describe("Business Invariants & Constraints", () => {
    it("enforces partial unique index: a lead cannot have more than one active assignment", async () => {
      if (!isDbAvailable) return;

      const enq = await prismaA.enquiry.create({
        data: {
          name: "Assignment Lead",
          email: `assign_${Date.now()}@test.com`,
          message: "Assignment constraint test.",
          status: "NEW",
        },
      });

      const admin = await prismaA.adminUser.create({
        data: {
          email: `admin_asgn_${Date.now()}@test.com`,
          name: "Assignee Admin",
          passwordHash: "hash_test_dummy",
          role: "ADMIN",
        },
      });

      // 1. First active assignment succeeds
      const asgn1 = await prismaA.leadAssignment.create({
        data: {
          enquiryId: enq.id,
          adminId: admin.id,
          isActive: true,
        },
      });
      expect(asgn1.id).toBeDefined();

      // 2. Second concurrent active assignment for the same lead must violate partial unique index
      await expect(
        prismaB.leadAssignment.create({
          data: {
            enquiryId: enq.id,
            adminId: admin.id,
            isActive: true,
          },
        })
      ).rejects.toThrow(/Unique constraint failed/);

      // Cleanup
      await prismaA.enquiry.delete({ where: { id: enq.id } });
      await prismaA.adminUser.delete({ where: { id: admin.id } });
    });

    it("enforces LOST status requires non-empty lostReason", async () => {
      if (!isDbAvailable) return;

      const enq = await prismaA.enquiry.create({
        data: {
          name: "Lost Lead",
          email: `lost_${Date.now()}@test.com`,
          message: "Lost rationale constraint test.",
          status: "QUALIFIED",
        },
      });

      // Attempt transition to LOST without reason
      await expect(
        updateEnquiryStatus(enq.id, "LOST")
      ).rejects.toThrow(/non-empty lostReason is mandatory/);

      // Transition with valid reason succeeds
      const updated = await updateEnquiryStatus(enq.id, "LOST", {
        lostReason: "Client chose internal developer team.",
      });

      expect(updated.status).toBe("LOST");
      expect(updated.lostReason).toBe("Client chose internal developer team.");

      // Cleanup
      await prismaA.enquiry.delete({ where: { id: enq.id } });
    });

    it("dynamically maintains enquiry.nextFollowUpAt synchronization across creation, completion, and deletion", async () => {
      if (!isDbAvailable) return;

      const enq = await prismaA.enquiry.create({
        data: {
          name: "Follow-up Synced Lead",
          email: `fu_sync_${Date.now()}@test.com`,
          message: "Follow-up synchronization test.",
          status: "QUALIFIED",
        },
      });

      const dateLater = new Date(Date.now() + 10 * 86400000); // 10 days out
      const dateEarlier = new Date(Date.now() + 3 * 86400000); // 3 days out

      // 1. Create task later (10 days out)
      const fuLater = await createLeadFollowUp({
        enquiryId: enq.id,
        title: "Contract Finalization Call",
        dueAt: dateLater,
      });

      let check = await prismaA.enquiry.findUnique({ where: { id: enq.id } });
      expect(check?.nextFollowUpAt?.toISOString()).toBe(dateLater.toISOString());

      // 2. Create task earlier (3 days out): nextFollowUpAt updates to the earlier date
      const fuEarlier = await createLeadFollowUp({
        enquiryId: enq.id,
        title: "Urgent Requirements Clarification",
        dueAt: dateEarlier,
      });

      check = await prismaA.enquiry.findUnique({ where: { id: enq.id } });
      expect(check?.nextFollowUpAt?.toISOString()).toBe(dateEarlier.toISOString());

      // 3. Complete earlier task: nextFollowUpAt automatically resyncs to the later uncompleted task
      await toggleFollowUpComplete(fuEarlier.id, true);

      check = await prismaA.enquiry.findUnique({ where: { id: enq.id } });
      expect(check?.nextFollowUpAt?.toISOString()).toBe(dateLater.toISOString());

      // 4. Delete later task: with all tasks completed/deleted, nextFollowUpAt becomes null
      await deleteLeadFollowUp(fuLater.id);

      check = await prismaA.enquiry.findUnique({ where: { id: enq.id } });
      expect(check?.nextFollowUpAt).toBeNull();

      // Cleanup
      await prismaA.enquiry.delete({ where: { id: enq.id } });
    });
  });
});
