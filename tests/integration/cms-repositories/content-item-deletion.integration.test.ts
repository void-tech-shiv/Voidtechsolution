import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  createContentItem,
  deleteContentItem,
} from "@/server/repositories/cms/content-item.repo";
import { createWorkingRevision } from "@/server/repositories/cms/content-revision.repo";
import { ContentItemDeletionBlockedError } from "@/server/repositories/cms/cms-repository.errors";

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

describe("RI-03: Real PostgreSQL ContentItem Deletion Safety Integration", () => {
  let dbClient: PrismaClient;
  let isDbAvailable = false;
  const createdItemIds: string[] = [];

  beforeAll(async () => {
    try {
      dbClient = new PrismaClient({
        datasources: { db: { url: TEST_DATABASE_URL } },
      });
      await dbClient.$queryRaw`SELECT 1`;
      isDbAvailable = true;
    } catch {
      isDbAvailable = false;
      console.warn(
        `[integration-test] Real PostgreSQL database not reachable at ${TEST_DATABASE_URL}. Skipping integration suite.`
      );
    }
  });

  afterAll(async () => {
    if (isDbAvailable && dbClient) {
      try {
        await dbClient.contentRevision.deleteMany({
          where: { contentItemId: { in: createdItemIds } },
        });
        await dbClient.contentItem.deleteMany({
          where: { id: { in: createdItemIds } },
        });
      } catch {
        // Best effort cleanup
      }
      await dbClient.$disconnect();
    }
  });

  it("blocks deletion when ContentItem has historical revisions", async () => {
    if (!isDbAvailable) return;

    const item = await createContentItem(
      {
        slug: `del-history-test-${Date.now()}`,
        contentType: "PAGE_SECTION",
      },
      dbClient as any
    );
    createdItemIds.push(item.id);

    // Create a revision
    await createWorkingRevision(
      {
        contentItemId: item.id,
        title: "Section Draft",
        snapshotData: { body: "Content" },
        authorName: "Shivanshu",
      },
      dbClient as any
    );

    // Attempting to delete must fail with ContentItemDeletionBlockedError
    await expect(
      deleteContentItem(item.id, dbClient as any)
    ).rejects.toThrow(ContentItemDeletionBlockedError);
  });

  it("blocks deletion when ContentItem is in PUBLISHED status", async () => {
    if (!isDbAvailable) return;

    const item = await createContentItem(
      {
        slug: `del-pub-test-${Date.now()}`,
        contentType: "PAGE_SECTION",
      },
      dbClient as any
    );
    createdItemIds.push(item.id);

    // Set publicationStatus to PUBLISHED directly in DB
    await dbClient.contentItem.update({
      where: { id: item.id },
      data: { publicationStatus: "PUBLISHED" },
    });

    await expect(
      deleteContentItem(item.id, dbClient as any)
    ).rejects.toThrow(ContentItemDeletionBlockedError);
  });

  it("allows deletion of a clean draft ContentItem with zero revisions and zero domain relations", async () => {
    if (!isDbAvailable) return;

    const item = await createContentItem(
      {
        slug: `del-clean-test-${Date.now()}`,
        contentType: "FAQ",
      },
      dbClient as any
    );

    // Clean delete should succeed without throwing
    await expect(
      deleteContentItem(item.id, dbClient as any)
    ).resolves.toBeUndefined();

    // Verify it is gone from the database
    const check = await dbClient.contentItem.findUnique({
      where: { id: item.id },
    });
    expect(check).toBeNull();
  });
});
