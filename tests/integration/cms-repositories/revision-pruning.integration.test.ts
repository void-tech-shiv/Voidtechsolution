import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createContentItem } from "@/server/repositories/cms/content-item.repo";
import {
  createWorkingRevision,
  pruneWorkingDraftRevisions,
  listRevisionsByContentItem,
} from "@/server/repositories/cms/content-revision.repo";

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

describe("RI-05: Real PostgreSQL Draft Pruning & Protected Pointers Integration", () => {
  let dbClient: PrismaClient;
  let isDbAvailable = false;
  let testContentItemId: string;
  const testSlug = `pruning-test-${Date.now()}`;

  beforeAll(async () => {
    try {
      dbClient = new PrismaClient({
        datasources: { db: { url: TEST_DATABASE_URL } },
      });
      await dbClient.$queryRaw`SELECT 1`;
      isDbAvailable = true;

      const item = await createContentItem(
        {
          slug: testSlug,
          contentType: "PORTFOLIO_PROJECT",
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
        await dbClient.contentItem.update({
          where: { id: testContentItemId },
          data: {
            currentPublishedRevisionId: null,
            currentWorkingRevisionId: null,
          },
        });
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

  it("prunes excess working drafts beyond retention threshold while permanently protecting published and active pointers", async () => {
    if (!isDbAvailable) return;

    // 1. Sequentially create 6 revisions (versions 1 through 6)
    const createdRevisions = [];
    for (let i = 1; i <= 6; i++) {
      const rev = await createWorkingRevision(
        {
          contentItemId: testContentItemId,
          title: `Revision ${i}`,
          snapshotData: { step: i },
          authorName: "Shivanshu",
        },
        dbClient as any
      );
      createdRevisions.push(rev);
    }

    expect(createdRevisions).toHaveLength(6);

    // 2. Mark Revision 2 as a published snapshot milestone and set it as currentPublishedRevisionId
    const publishedRev = createdRevisions[1]!; // version 2
    await dbClient.contentRevision.update({
      where: { id: publishedRev.id },
      data: {
        isPublishedSnapshot: true,
        revisionStatus: "PUBLISHED_SNAPSHOT",
      },
    });
    await dbClient.contentItem.update({
      where: { id: testContentItemId },
      data: {
        currentPublishedRevisionId: publishedRev.id,
      },
    });

    // Currently:
    // Rev 6: active working pointer (currentWorkingRevisionId)
    // Rev 2: active published pointer (currentPublishedRevisionId) + isPublishedSnapshot = true
    // Rev 1, 3, 4, 5: plain working drafts

    // 3. Request pruning with retention limit = 2
    // Eligible working drafts (excluding Rev 6 [working pointer] and Rev 2 [published pointer/snapshot]):
    // Candidates sorted newest first: [Rev 5, Rev 4, Rev 3, Rev 1] (4 drafts)
    // Keep 2: Rev 5, Rev 4
    // Prune: Rev 3, Rev 1 (2 drafts pruned)
    const deletedCount = await pruneWorkingDraftRevisions(
      testContentItemId,
      2,
      dbClient as any
    );

    expect(deletedCount).toBe(2);

    // 4. Verify remaining revisions in database
    const remaining = await listRevisionsByContentItem(
      testContentItemId,
      { sortOrder: "asc" },
      dbClient as any
    );

    const remainingVersions = remaining.items.map((r) => r.versionNumber);

    // Rev 1 and Rev 3 should be pruned
    // Rev 2 (published), Rev 4, Rev 5, Rev 6 (active working) must remain!
    expect(remainingVersions).toEqual([2, 4, 5, 6]);

    // 5. Verify published revision 2 is intact
    const verifyPub = await dbClient.contentRevision.findUnique({
      where: { id: publishedRev.id },
    });
    expect(verifyPub?.isPublishedSnapshot).toBe(true);

    // 6. Verify working pointer revision 6 is intact
    const verifyWork = await dbClient.contentRevision.findUnique({
      where: { id: createdRevisions[5]!.id },
    });
    expect(verifyWork).not.toBeNull();
  });
});
