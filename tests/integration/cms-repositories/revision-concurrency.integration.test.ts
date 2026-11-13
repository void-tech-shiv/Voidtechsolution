import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  createContentItem,
} from "@/server/repositories/cms/content-item.repo";
import {
  createWorkingRevision,
  listRevisionsByContentItem,
} from "@/server/repositories/cms/content-revision.repo";

/**
 * VOIDTECH SOLUTION — Real PostgreSQL CMS Concurrency Integration Tests
 * Target: Dedicated isolated test database (voidtech_test_concurrency on localhost:5432).
 * STRICT SAFETY RULE: NEVER RUN AGAINST PRODUCTION NEON.
 */

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  "postgresql://postgres:root@localhost:5432/voidtech_test_concurrency";

// Strict Safety Guard: Block any connection containing neon.tech or non-localhost
if (
  TEST_DATABASE_URL.includes("neon.tech") ||
  !TEST_DATABASE_URL.includes("localhost")
) {
  throw new Error(
    `[INTEGRITY ERROR] Attempted to run integration tests against non-local database: ${TEST_DATABASE_URL}`
  );
}

describe("RI-01: Real PostgreSQL Revision Concurrency & Monotonic Version Allocation", () => {
  let dbClient: PrismaClient;
  let isDbAvailable = false;
  let testContentItemId: string;
  const testSlug = `concurrency-test-${Date.now()}`;

  beforeAll(async () => {
    try {
      dbClient = new PrismaClient({
        datasources: { db: { url: TEST_DATABASE_URL } },
      });
      await dbClient.$queryRaw`SELECT 1`;
      isDbAvailable = true;

      // Create a dedicated test ContentItem in the real PostgreSQL database
      const item = await createContentItem(
        {
          slug: testSlug,
          contentType: "SERVICE",
        },
        dbClient as any
      );
      testContentItemId = item.id;
    } catch {
      isDbAvailable = false;
      console.warn(
        `[integration-test] Real PostgreSQL database not reachable at ${TEST_DATABASE_URL}. Skipping integration suite.`
      );
    }
  });

  afterAll(async () => {
    if (isDbAvailable && dbClient && testContentItemId) {
      try {
        // Clean up test revisions and item
        await dbClient.contentRevision.deleteMany({
          where: { contentItemId: testContentItemId },
        });
        await dbClient.contentItem.deleteMany({
          where: { id: testContentItemId },
        });
      } catch {
        // Best effort cleanup
      }
    }
    if (dbClient) {
      await dbClient.$disconnect();
    }
  });

  it("safely serializes concurrent revision creation without duplicate version numbers", async () => {
    if (!isDbAvailable) return;

    // Concurrently invoke createWorkingRevision 5 times using Promise.all
    const workerPromises = Array.from({ length: 5 }, (_, i) =>
      createWorkingRevision(
        {
          contentItemId: testContentItemId,
          title: `Concurrent Revision Worker ${i + 1}`,
          snapshotData: { workerId: i + 1, timestamp: Date.now() },
          authorName: `Worker ${i + 1}`,
          changeSummary: `Concurrent worker test ${i + 1}`,
        },
        dbClient as any
      )
    );

    const results = await Promise.all(workerPromises);

    // 1. Every concurrent worker must have succeeded
    expect(results).toHaveLength(5);

    // 2. All 5 revisions must have unique versionNumbers
    const versionNumbers = results.map((r) => r.versionNumber).sort((a, b) => a - b);
    const uniqueVersions = new Set(versionNumbers);
    expect(uniqueVersions.size).toBe(5);

    // 3. Version numbers must be monotonically increasing from 1 to 5
    expect(versionNumbers).toEqual([1, 2, 3, 4, 5]);

    // 4. Verify parent ContentItem.currentWorkingRevisionId points to the highest version (version 5)
    const parentItem = await dbClient.contentItem.findUnique({
      where: { id: testContentItemId },
      select: { currentWorkingRevisionId: true },
    });
    const latestRevision = results.find((r) => r.versionNumber === 5);
    expect(parentItem?.currentWorkingRevisionId).toBe(latestRevision?.id);

    // 5. Query via listRevisionsByContentItem and confirm ordering
    const listResult = await listRevisionsByContentItem(
      testContentItemId,
      { sortOrder: "desc" },
      dbClient as any
    );
    expect(listResult.total).toBe(5);
    expect(listResult.items.map((r) => r.versionNumber)).toEqual([5, 4, 3, 2, 1]);
  });
});
