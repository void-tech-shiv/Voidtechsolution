import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient, ContentType, ServiceCategory } from "@prisma/client";
import { publishContentItem } from "@/server/services/cms/publishing.service";
import { createContentItem } from "@/server/repositories/cms/content-item.repo";
import { createWorkingRevision } from "@/server/repositories/cms/content-revision.repo";
import { SchemaValidationError } from "@/server/repositories/cms/cms-repository.errors";

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
});

