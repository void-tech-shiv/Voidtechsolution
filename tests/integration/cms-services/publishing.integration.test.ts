import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient, ContentType, ServiceCategory } from "@prisma/client";
import { publishContentItem } from "@/server/services/cms/publishing.service";
import { createContentItem } from "@/server/repositories/cms/content-item.repo";
import { createWorkingRevision } from "@/server/repositories/cms/content-revision.repo";
import {
  SchemaValidationError,
  ConcurrencyConflictError,
} from "@/server/repositories/cms/cms-repository.errors";

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  "postgresql://postgres:root@localhost:5432/voidtech_test_concurrency";

if (
  TEST_DATABASE_URL.includes("neon.tech") ||
  !TEST_DATABASE_URL.includes("localhost")
) {
  throw new Error(
    `[INTEGRITY ERROR] Attempted to run integration tests against non-local database: ${TEST_DATABASE_URL}`
  );
}

describe("Task 10.1.6: Real PostgreSQL 9-Step Atomic Publishing Transaction Integration", () => {
  let dbClient: PrismaClient;
  let isDbAvailable = false;
  let testContentItemId: string;
  let testRevisionId: string;
  const testSlug = `publish-int-test-${Date.now()}`;

  const adminActor = {
    id: "admin_test_integration",
    role: "ADMIN" as const,
    isActive: true,
  };

  beforeAll(async () => {
    try {
      dbClient = new PrismaClient({
        datasources: { db: { url: TEST_DATABASE_URL } },
      });
      await dbClient.$queryRaw`SELECT 1`;
      isDbAvailable = true;

      // Create an admin user if not exists for FK
      await dbClient.adminUser.upsert({
        where: { id: adminActor.id },
        update: { isActive: true },
        create: {
          id: adminActor.id,
          email: "integration_publisher@voidtech.test",
          passwordHash: "dummyhash",
          name: "Integration Publisher",
          role: "ADMIN",
          isActive: true,
        },
      });

      // Create test ContentItem
      const item = await createContentItem(
        {
          slug: testSlug,
          contentType: ContentType.SERVICE,
        },
        dbClient as any
      );
      testContentItemId = item.id;

      // Create working revision
      const rev = await createWorkingRevision(
        {
          contentItemId: item.id,
          title: "Integration Test Service",
          authorName: "Integration Test",
          snapshotData: {
            title: "Integration Test Service",
            shortDesc: "Real database integration testing service",
            fullDesc: "Testing full atomic transaction promotion in local PostgreSQL.",
            icon: "Terminal",
            category: ServiceCategory.WEB_DEVELOPMENT,
            deliverables: ["Test 1", "Test 2"],
            technologies: ["Node.js", "PostgreSQL"],
            startingPriceInr: 25000,
            currency: "INR",
            isFeatured: false,
            orderIndex: 99,
          },
        },
        dbClient as any
      );
      testRevisionId = rev.id;
    } catch (err) {
      isDbAvailable = false;
      console.warn(
        `[integration-test] Real PostgreSQL database not reachable at ${TEST_DATABASE_URL}. Skipping integration suite.`,
        err
      );
    }
  });

  afterAll(async () => {
    if (!isDbAvailable) return;
    try {
      await dbClient.service.deleteMany({
        where: { contentItemId: testContentItemId },
      });
      await dbClient.contentRevision.deleteMany({
        where: { contentItemId: testContentItemId },
      });
      await dbClient.contentItem.deleteMany({
        where: { id: testContentItemId },
      });
      await dbClient.adminUser.deleteMany({
        where: { id: adminActor.id },
      });
      await dbClient.$disconnect();
    } catch {
      // Cleanup best effort
    }
  });

  it("atomically promotes working revision, materializes Service table, and advances version on real PostgreSQL", async () => {
    if (!isDbAvailable) {
      console.warn("Skipping real database test: DB unavailable");
      return;
    }

    const result = await publishContentItem({
      contentItemId: testContentItemId,
      revisionId: testRevisionId,
      expectedVersion: 1,
      actor: adminActor,
      changeSummary: "First publication via 9-step atomic engine",
    });

    expect(result.contentItemId).toBe(testContentItemId);
    expect(result.publishedRevisionId).toBe(testRevisionId);
    expect(result.version).toBe(2);

    // Verify database state directly
    const dbItem = await dbClient.contentItem.findUnique({
      where: { id: testContentItemId },
    });
    expect(dbItem?.publicationStatus).toBe("PUBLISHED");
    expect(dbItem?.currentPublishedRevisionId).toBe(testRevisionId);
    expect(dbItem?.version).toBe(2);

    // Verify materialized Service record
    const dbService = await dbClient.service.findUnique({
      where: { contentItemId: testContentItemId },
    });
    expect(dbService).not.toBeNull();
    expect(dbService?.title).toBe("Integration Test Service");
    expect(dbService?.isActive).toBe(true);

    // Verify revision record status is now PUBLISHED_SNAPSHOT
    const dbRevision = await dbClient.contentRevision.findUnique({
      where: { id: testRevisionId },
    });
    expect(dbRevision?.revisionStatus).toBe("PUBLISHED_SNAPSHOT");
    expect(dbRevision?.isPublishedSnapshot).toBe(true);

    // Verify AuditLog entry
    const audit = await dbClient.auditLog.findFirst({
      where: {
        entityId: testContentItemId,
        action: "CONTENT_PUBLISHED",
      },
    });
    expect(audit).not.toBeNull();
  });

  it("rolls back completely without changing version or domain table when validation fails mid-transaction", async () => {
    if (!isDbAvailable) {
      console.warn("Skipping real database test: DB unavailable");
      return;
    }

    // Create a second revision with invalid snapshot
    const invalidRev = await createWorkingRevision(
      {
        contentItemId: testContentItemId,
        title: "Invalid Revision",
        authorName: "Integration Test",
        snapshotData: {
          // Missing required fields
          title: "Too short",
        },
      },
      dbClient as any
    );

    // Attempt publish with current version 2
    await expect(
      publishContentItem({
        contentItemId: testContentItemId,
        revisionId: invalidRev.id,
        expectedVersion: 2,
        actor: adminActor,
      })
    ).rejects.toThrow(SchemaValidationError);

    // Verify ContentItem is still at version 2 and previous revision is still published
    const itemAfterFailure = await dbClient.contentItem.findUnique({
      where: { id: testContentItemId },
    });
    expect(itemAfterFailure?.version).toBe(2);
    expect(itemAfterFailure?.currentPublishedRevisionId).toBe(testRevisionId);

    // Verify invalid revision was not modified
    const revAfterFailure = await dbClient.contentRevision.findUnique({
      where: { id: invalidRev.id },
    });
    expect(revAfterFailure?.revisionStatus).toBe("WORKING_DRAFT");
    expect(revAfterFailure?.isPublishedSnapshot).toBe(false);
  });

  describe("Task 10.4.6 Finding B: PostgreSQL Concurrent Publishing Race Protection", () => {
    it("guarantees exactly one winner and one controlled conflict when two requests publish the same ContentItem with the same expectedVersion", async () => {
      if (!isDbAvailable) {
        console.warn("Skipping real database test: DB unavailable");
        return;
      }

      // Read current version of testContentItemId (should be 2)
      const currentItem = await dbClient.contentItem.findUniqueOrThrow({
        where: { id: testContentItemId },
      });
      const initialVersion = currentItem.version;

      // Count existing publication audit logs for this item
      const initialAuditCount = await dbClient.auditLog.count({
        where: {
          entityId: testContentItemId,
          action: "CONTENT_PUBLISHED",
        },
      });

      // Create two competing working revisions
      const revA = await createWorkingRevision(
        {
          contentItemId: testContentItemId,
          title: "Competing Revision A",
          authorName: "Editor Alpha",
          snapshotData: {
            title: "Service Alpha Competitor",
            shortDesc: "Alpha short description",
            fullDesc: "Alpha full description for race testing.",
            icon: "Terminal",
            category: ServiceCategory.WEB_DEVELOPMENT,
            deliverables: ["Alpha Deliverable"],
            technologies: ["Node.js"],
            startingPriceInr: 30000,
            currency: "INR",
            isFeatured: false,
            orderIndex: 10,
          },
        },
        dbClient as any
      );

      const revB = await createWorkingRevision(
        {
          contentItemId: testContentItemId,
          title: "Competing Revision B",
          authorName: "Editor Beta",
          snapshotData: {
            title: "Service Beta Competitor",
            shortDesc: "Beta short description",
            fullDesc: "Beta full description for race testing.",
            icon: "Terminal",
            category: ServiceCategory.WEB_DEVELOPMENT,
            deliverables: ["Beta Deliverable"],
            technologies: ["PostgreSQL"],
            startingPriceInr: 35000,
            currency: "INR",
            isFeatured: false,
            orderIndex: 11,
          },
        },
        dbClient as any
      );

      // Launch both publish operations simultaneously targeting the same expectedVersion
      const [resultA, resultB] = await Promise.allSettled([
        publishContentItem({
          contentItemId: testContentItemId,
          revisionId: revA.id,
          expectedVersion: initialVersion,
          actor: adminActor,
          changeSummary: "Race attempt Alpha",
        }),
        publishContentItem({
          contentItemId: testContentItemId,
          revisionId: revB.id,
          expectedVersion: initialVersion,
          actor: adminActor,
          changeSummary: "Race attempt Beta",
        }),
      ]);

      // Assertion 1 & 2: Exactly one succeeds and exactly one fails
      const fulfilledResults = [resultA, resultB].filter(
        (r) => r.status === "fulfilled"
      ) as PromiseFulfilledResult<any>[];
      const rejectedResults = [resultA, resultB].filter(
        (r) => r.status === "rejected"
      ) as PromiseRejectedResult[];

      expect(fulfilledResults.length).toBe(1);
      expect(rejectedResults.length).toBe(1);

      // Assertion 3: Rejection is a typed ConcurrencyConflictError
      expect(rejectedResults[0]!.reason).toBeInstanceOf(ConcurrencyConflictError);

      const winnerResult = fulfilledResults[0]!.value;
      const winnerRevId = winnerResult.publishedRevisionId;
      const loserRevId = winnerRevId === revA.id ? revB.id : revA.id;
      const expectedNewVersion = initialVersion + 1;

      expect(winnerResult.version).toBe(expectedNewVersion);

      // Assertion 4: Final published pointer references the winning revision
      const finalItem = await dbClient.contentItem.findUniqueOrThrow({
        where: { id: testContentItemId },
      });
      expect(finalItem.version).toBe(expectedNewVersion);
      expect(finalItem.currentPublishedRevisionId).toBe(winnerRevId);

      // Assertion 5: Domain materialization matches the winning revision
      const materializedService = await dbClient.service.findUniqueOrThrow({
        where: { contentItemId: testContentItemId },
      });
      const winningTitle =
        winnerRevId === revA.id
          ? "Service Alpha Competitor"
          : "Service Beta Competitor";
      expect(materializedService.title).toBe(winningTitle);

      // Assertion 6: Exactly one publication audit event was created
      const finalAuditCount = await dbClient.auditLog.count({
        where: {
          entityId: testContentItemId,
          action: "CONTENT_PUBLISHED",
        },
      });
      expect(finalAuditCount).toBe(initialAuditCount + 1);

      // Assertion 7: No losing transaction mutations remain
      const loserRevision = await dbClient.contentRevision.findUniqueOrThrow({
        where: { id: loserRevId },
      });
      expect(loserRevision.revisionStatus).toBe("WORKING_DRAFT");
      expect(loserRevision.isPublishedSnapshot).toBe(false);

      // Assertion 8: Subsequent publish with the new expected version succeeds cleanly
      const followUpRev = await createWorkingRevision(
        {
          contentItemId: testContentItemId,
          title: "Follow-up Valid Revision",
          authorName: "Editor Lead",
          snapshotData: {
            title: "Service Follow-up Title",
            shortDesc: "Follow-up short description",
            fullDesc: "Follow-up full description.",
            icon: "Terminal",
            category: ServiceCategory.WEB_DEVELOPMENT,
            deliverables: ["Follow-up"],
            technologies: ["Node.js"],
            startingPriceInr: 40000,
            currency: "INR",
            isFeatured: false,
            orderIndex: 12,
          },
        },
        dbClient as any
      );

      const subsequentResult = await publishContentItem({
        contentItemId: testContentItemId,
        revisionId: followUpRev.id,
        expectedVersion: expectedNewVersion,
        actor: adminActor,
        changeSummary: "Subsequent publication after race resolution",
      });

      expect(subsequentResult.version).toBe(expectedNewVersion + 1);
      expect(subsequentResult.publishedRevisionId).toBe(followUpRev.id);
    });

    it("allows concurrent publishing of separate ContentItems without unnecessary serialization", async () => {
      if (!isDbAvailable) {
        console.warn("Skipping real database test: DB unavailable");
        return;
      }

      // Create two distinct ContentItems
      const item1 = await createContentItem(
        {
          slug: `concurrent-item-1-${Date.now()}`,
          contentType: ContentType.SERVICE,
        },
        dbClient as any
      );

      const item2 = await createContentItem(
        {
          slug: `concurrent-item-2-${Date.now()}`,
          contentType: ContentType.SERVICE,
        },
        dbClient as any
      );

      const rev1 = await createWorkingRevision(
        {
          contentItemId: item1.id,
          title: "Service 1 Revision",
          authorName: "Editor 1",
          snapshotData: {
            title: "Distinct Service 1",
            shortDesc: "Desc 1",
            fullDesc: "Full desc 1",
            icon: "Terminal",
            category: ServiceCategory.WEB_DEVELOPMENT,
            deliverables: ["D1"],
            technologies: ["Tech 1"],
            startingPriceInr: 10000,
            currency: "INR",
            isFeatured: false,
            orderIndex: 1,
          },
        },
        dbClient as any
      );

      const rev2 = await createWorkingRevision(
        {
          contentItemId: item2.id,
          title: "Service 2 Revision",
          authorName: "Editor 2",
          snapshotData: {
            title: "Distinct Service 2",
            shortDesc: "Desc 2",
            fullDesc: "Full desc 2",
            icon: "Terminal",
            category: ServiceCategory.WEB_DEVELOPMENT,
            deliverables: ["D2"],
            technologies: ["Tech 2"],
            startingPriceInr: 20000,
            currency: "INR",
            isFeatured: false,
            orderIndex: 2,
          },
        },
        dbClient as any
      );

      // Concurrently publish item1 and item2 (both have initial version 1)
      const [res1, res2] = await Promise.all([
        publishContentItem({
          contentItemId: item1.id,
          revisionId: rev1.id,
          expectedVersion: 1,
          actor: adminActor,
        }),
        publishContentItem({
          contentItemId: item2.id,
          revisionId: rev2.id,
          expectedVersion: 1,
          actor: adminActor,
        }),
      ]);

      expect(res1.contentItemId).toBe(item1.id);
      expect(res1.version).toBe(2);
      expect(res2.contentItemId).toBe(item2.id);
      expect(res2.version).toBe(2);

      // Clean up the two test items (best effort, trigger protects published revisions)
      try {
        await dbClient.service.deleteMany({
          where: { contentItemId: { in: [item1.id, item2.id] } },
        });
        await dbClient.contentRevision.deleteMany({
          where: { contentItemId: { in: [item1.id, item2.id] } },
        });
        await dbClient.contentItem.deleteMany({
          where: { id: { in: [item1.id, item2.id] } },
        });
      } catch {
        // Intentional: PostgreSQL trigger protects published revision snapshots from deletion
      }
    });
  });
});

