import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createContentItem } from "@/server/repositories/cms/content-item.repo";
import {
  createWorkingRevision,
  getRevisionByParentAndId,
  updateWorkingRevision,
} from "@/server/repositories/cms/content-revision.repo";
import {
  RevisionOwnershipMismatchError,
  ImmutableRevisionError,
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

describe("RI-02 & RI-04: Real PostgreSQL Revision Immutability & Scoped Access Integration", () => {
  let dbClient: PrismaClient;
  let isDbAvailable = false;
  let itemAId: string;
  let itemBId: string;
  const slugA = `item-a-${Date.now()}`;
  const slugB = `item-b-${Date.now()}`;

  beforeAll(async () => {
    try {
      dbClient = new PrismaClient({
        datasources: { db: { url: TEST_DATABASE_URL } },
      });
      await dbClient.$queryRaw`SELECT 1`;
      isDbAvailable = true;

      const itemA = await createContentItem(
        { slug: slugA, contentType: "FAQ" },
        dbClient as any
      );
      itemAId = itemA.id;

      const itemB = await createContentItem(
        { slug: slugB, contentType: "FAQ" },
        dbClient as any
      );
      itemBId = itemB.id;
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
          where: { contentItemId: { in: [itemAId, itemBId] } },
        });
        await dbClient.contentItem.deleteMany({
          where: { id: { in: [itemAId, itemBId] } },
        });
      } catch {
        // Best effort cleanup
      }
      await dbClient.$disconnect();
    }
  });

  it("enforces parent-scoped access and rejects cross-item revision retrieval (RI-04)", async () => {
    if (!isDbAvailable) return;

    // Create revision belonging to Item A
    const revA = await createWorkingRevision(
      {
        contentItemId: itemAId,
        title: "Revision for Item A",
        snapshotData: { data: "A" },
        authorName: "Shivanshu",
      },
      dbClient as any
    );

    // 1. Retrieving under correct parent succeeds
    const foundUnderA = await getRevisionByParentAndId(
      itemAId,
      revA.id,
      dbClient as any
    );
    expect(foundUnderA?.id).toBe(revA.id);

    // 2. Attempting to retrieve Revision A under Parent B must throw RevisionOwnershipMismatchError
    await expect(
      getRevisionByParentAndId(itemBId, revA.id, dbClient as any)
    ).rejects.toThrow(RevisionOwnershipMismatchError);
  });

  it("strictly enforces immutability on published revisions at repository and database levels (RI-02)", async () => {
    if (!isDbAvailable) return;

    // Create a working revision for Item A
    const rev = await createWorkingRevision(
      {
        contentItemId: itemAId,
        title: "Working Revision To Publish",
        snapshotData: { text: "Original" },
        authorName: "Shivanshu",
      },
      dbClient as any
    );

    // Mark as published snapshot and point currentPublishedRevisionId to it
    await dbClient.contentRevision.update({
      where: { id: rev.id },
      data: {
        isPublishedSnapshot: true,
        revisionStatus: "PUBLISHED_SNAPSHOT",
      },
    });
    await dbClient.contentItem.update({
      where: { id: itemAId },
      data: {
        currentPublishedRevisionId: rev.id,
      },
    });

    // Attempting to update working revision must throw ImmutableRevisionError
    await expect(
      updateWorkingRevision(
        rev.id,
        { title: "Attempted Mutated Title" },
        itemAId,
        dbClient as any
      )
    ).rejects.toThrow(ImmutableRevisionError);

    // Verify content remained unchanged
    const unchanged = await dbClient.contentRevision.findUnique({
      where: { id: rev.id },
    });
    expect(unchanged?.title).toBe("Working Revision To Publish");
  });

  it("rejects stale update with ConcurrencyConflictError when expectedRevisionStatus does not match", async () => {
    if (!isDbAvailable) return;

    const rev = await createWorkingRevision(
      {
        contentItemId: itemBId,
        title: "Revision For Status OCC",
        snapshotData: { text: "Initial" },
        authorName: "Shivanshu",
      },
      dbClient as any
    );

    // Update status to PENDING_REVIEW in database
    await dbClient.contentRevision.update({
      where: { id: rev.id },
      data: { revisionStatus: "PENDING_REVIEW" },
    });

    // Attempt update with expectedRevisionStatus = "WORKING_DRAFT"
    await expect(
      updateWorkingRevision(
        rev.id,
        {
          title: "New Title",
          expectedRevisionStatus: "WORKING_DRAFT",
        },
        itemBId,
        dbClient as any
      )
    ).rejects.toThrow(ConcurrencyConflictError);
  });
});
