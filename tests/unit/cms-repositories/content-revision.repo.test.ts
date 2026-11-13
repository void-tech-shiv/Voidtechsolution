import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  createWorkingRevision,
  getRevisionById,
  getRevisionByParentAndId,
  listRevisionsByContentItem,
  updateWorkingRevision,
  pruneWorkingDraftRevisions,
} from "@/server/repositories/cms/content-revision.repo";
import {
  ContentItemNotFoundError,
  ContentRevisionNotFoundError,
  RevisionOwnershipMismatchError,
  ImmutableRevisionError,
  InvalidRevisionStateError,
  ConcurrencyConflictError,
} from "@/server/repositories/cms/cms-repository.errors";
import { Prisma } from "@prisma/client";

describe("ContentRevision Repository", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockDate = new Date("2026-11-13T12:00:00Z");

  const sampleRevision = {
    id: "rev-1",
    contentItemId: "item-1",
    versionNumber: 1,
    revisionStatus: "WORKING_DRAFT" as const,
    isPublishedSnapshot: false,
    title: "Initial Web Dev Draft",
    snapshotData: { summary: "High quality web apps" },
    authorId: "admin-1",
    authorName: "Shivanshu",
    changeSummary: "First initial draft",
    rejectionNote: null,
    createdAt: mockDate,
  };

  describe("createWorkingRevision (RI-01 Concurrency & Bounded Retry)", () => {
    it("creates first working draft with versionNumber = 1 and updates working pointer", async () => {
      const mockClient = {
        $queryRawUnsafe: vi.fn().mockResolvedValueOnce([{ id: "item-1" }]),
        contentItem: {
          findUnique: vi.fn().mockResolvedValueOnce({ id: "item-1" }),
          update: vi.fn().mockResolvedValueOnce({ id: "item-1" }),
        },
        contentRevision: {
          findFirst: vi.fn().mockResolvedValueOnce(null),
          create: vi.fn().mockResolvedValueOnce(sampleRevision),
          findMany: vi.fn().mockResolvedValueOnce([]),
          deleteMany: vi.fn().mockResolvedValueOnce({ count: 0 }),
        },
      } as unknown as Prisma.TransactionClient;

      vi.spyOn(prisma, "$transaction").mockImplementationOnce(
        async (cb: any) => cb(mockClient)
      );

      const result = await createWorkingRevision({
        contentItemId: "item-1",
        title: "Initial Web Dev Draft",
        snapshotData: { summary: "High quality web apps" },
        authorId: "admin-1",
        authorName: "Shivanshu",
        changeSummary: "First initial draft",
      });

      expect(mockClient.contentItem.findUnique).toHaveBeenCalledWith({
        where: { id: "item-1" },
        select: { id: true },
      });
      expect(mockClient.contentRevision.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          contentItemId: "item-1",
          versionNumber: 1,
          revisionStatus: "WORKING_DRAFT",
          isPublishedSnapshot: false,
        }),
      });
      expect(mockClient.contentItem.update).toHaveBeenCalledWith({
        where: { id: "item-1" },
        data: { currentWorkingRevisionId: sampleRevision.id },
      });
      expect(result).toEqual(sampleRevision);
    });

    it("increments versionNumber monotonically from latest revision under row lock", async () => {
      const mockClient = {
        $queryRawUnsafe: vi.fn().mockResolvedValueOnce([{ id: "item-1" }]),
        contentItem: {
          findUnique: vi.fn().mockResolvedValueOnce({ id: "item-1" }),
          update: vi.fn().mockResolvedValueOnce({ id: "item-1" }),
        },
        contentRevision: {
          findFirst: vi.fn().mockResolvedValueOnce({ versionNumber: 5 }),
          create: vi.fn().mockResolvedValueOnce({
            ...sampleRevision,
            versionNumber: 6,
          }),
          findMany: vi.fn().mockResolvedValueOnce([]),
          deleteMany: vi.fn().mockResolvedValueOnce({ count: 0 }),
        },
      } as unknown as Prisma.TransactionClient;

      vi.spyOn(prisma, "$transaction").mockImplementationOnce(
        async (cb: any) => cb(mockClient)
      );

      const result = await createWorkingRevision({
        contentItemId: "item-1",
        title: "Version 6 Draft",
        snapshotData: {},
        authorName: "Shivanshu",
      });

      expect(mockClient.contentRevision.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            versionNumber: 6,
          }),
        })
      );
      expect(result.versionNumber).toBe(6);
    });

    it("throws ContentItemNotFoundError if parent item does not exist (never retries)", async () => {
      const mockClient = {
        $queryRawUnsafe: vi.fn().mockResolvedValueOnce([]),
        contentItem: {
          findUnique: vi.fn().mockResolvedValueOnce(null),
        },
      } as unknown as Prisma.TransactionClient;

      vi.spyOn(prisma, "$transaction").mockImplementationOnce(
        async (cb: any) => cb(mockClient)
      );

      await expect(
        createWorkingRevision({
          contentItemId: "non-existent-item",
          title: "Draft",
          snapshotData: {},
          authorName: "Shivanshu",
        })
      ).rejects.toThrow(ContentItemNotFoundError);
    });

    it("retries bounded up to 3 times on P2002 collision and succeeds on subsequent attempt", async () => {
      const p2002Error = new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed on the fields: (`contentItemId`,`versionNumber`)",
        { code: "P2002", clientVersion: "5.x" }
      );

      const mockClientFail = {
        $queryRawUnsafe: vi.fn().mockResolvedValue([]),
        contentItem: {
          findUnique: vi.fn().mockResolvedValue({ id: "item-1" }),
        },
        contentRevision: {
          findFirst: vi.fn().mockResolvedValue({ versionNumber: 2 }),
          create: vi.fn().mockRejectedValueOnce(p2002Error),
        },
      } as unknown as Prisma.TransactionClient;

      const mockClientSuccess = {
        $queryRawUnsafe: vi.fn().mockResolvedValue([]),
        contentItem: {
          findUnique: vi.fn().mockResolvedValue({ id: "item-1" }),
          update: vi.fn().mockResolvedValue({ id: "item-1" }),
        },
        contentRevision: {
          findFirst: vi.fn().mockResolvedValue({ versionNumber: 3 }),
          create: vi.fn().mockResolvedValueOnce({
            ...sampleRevision,
            versionNumber: 4,
          }),
          findMany: vi.fn().mockResolvedValue([]),
          deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        },
      } as unknown as Prisma.TransactionClient;

      vi.spyOn(prisma, "$transaction")
        .mockImplementationOnce(async (cb: any) => cb(mockClientFail))
        .mockImplementationOnce(async (cb: any) => cb(mockClientSuccess));

      const result = await createWorkingRevision({
        contentItemId: "item-1",
        title: "Retry Succeeded Draft",
        snapshotData: {},
        authorName: "Shivanshu",
      });

      expect(prisma.$transaction).toHaveBeenCalledTimes(2);
      expect(result.versionNumber).toBe(4);
    });

    it("throws ConcurrencyConflictError after exhausting 3 bounded retries", async () => {
      const p2002Error = new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed on the fields: (`contentItemId`,`versionNumber`)",
        { code: "P2002", clientVersion: "5.x" }
      );

      const mockClientFail = {
        $queryRawUnsafe: vi.fn().mockResolvedValue([]),
        contentItem: {
          findUnique: vi.fn().mockResolvedValue({ id: "item-1" }),
        },
        contentRevision: {
          findFirst: vi.fn().mockResolvedValue({ versionNumber: 2 }),
          create: vi.fn().mockRejectedValue(p2002Error),
        },
      } as unknown as Prisma.TransactionClient;

      vi.spyOn(prisma, "$transaction").mockImplementation(
        async (cb: any) => cb(mockClientFail)
      );

      await expect(
        createWorkingRevision({
          contentItemId: "item-1",
          title: "Exhausted Retries Draft",
          snapshotData: {},
          authorName: "Shivanshu",
        })
      ).rejects.toThrow(ConcurrencyConflictError);

      expect(prisma.$transaction).toHaveBeenCalledTimes(3);
    });
  });

  describe("getRevisionByParentAndId & getRevisionById (RI-04 Scoped Access)", () => {
    it("returns revision for valid parent contentItemId using compound query", async () => {
      vi.spyOn(prisma.contentRevision, "findFirst").mockResolvedValueOnce(
        sampleRevision as any
      );

      const result = await getRevisionByParentAndId("item-1", "rev-1");
      expect(result).toEqual(sampleRevision);
      expect(prisma.contentRevision.findFirst).toHaveBeenCalledWith({
        where: { id: "rev-1", contentItemId: "item-1" },
        include: {
          author: { select: { id: true, name: true, email: true } },
        },
      });
    });

    it("returns null when revision does not exist anywhere", async () => {
      vi.spyOn(prisma.contentRevision, "findFirst").mockResolvedValueOnce(null);
      vi.spyOn(prisma.contentRevision, "findUnique").mockResolvedValueOnce(null);

      const result = await getRevisionByParentAndId("item-1", "rev-none");
      expect(result).toBeNull();
    });

    it("throws RevisionOwnershipMismatchError when revision belongs to different ContentItem", async () => {
      vi.spyOn(prisma.contentRevision, "findFirst").mockResolvedValueOnce(null);
      vi.spyOn(prisma.contentRevision, "findUnique").mockResolvedValueOnce({
        id: "rev-1",
        contentItemId: "other-item",
      } as any);

      await expect(
        getRevisionByParentAndId("item-1", "rev-1")
      ).rejects.toThrow(RevisionOwnershipMismatchError);
    });

    it("getRevisionById delegates to getRevisionByParentAndId when expectedContentItemId is provided", async () => {
      vi.spyOn(prisma.contentRevision, "findFirst").mockResolvedValueOnce(
        sampleRevision as any
      );

      const result = await getRevisionById("rev-1", "item-1");
      expect(result).toEqual(sampleRevision);
      expect(prisma.contentRevision.findFirst).toHaveBeenCalledWith({
        where: { id: "rev-1", contentItemId: "item-1" },
        include: {
          author: { select: { id: true, name: true, email: true } },
        },
      });
    });

    it("getRevisionById performs global trusted lookup when expectedContentItemId is omitted", async () => {
      vi.spyOn(prisma.contentRevision, "findUnique").mockResolvedValueOnce(
        sampleRevision as any
      );

      const result = await getRevisionById("rev-1");
      expect(result).toEqual(sampleRevision);
      expect(prisma.contentRevision.findUnique).toHaveBeenCalledWith({
        where: { id: "rev-1" },
        include: {
          author: { select: { id: true, name: true, email: true } },
        },
      });
    });
  });

  describe("listRevisionsByContentItem", () => {
    it("returns paginated revisions with default descending sort", async () => {
      vi.spyOn(prisma.contentRevision, "count").mockResolvedValueOnce(1);
      vi.spyOn(prisma.contentRevision, "findMany").mockResolvedValueOnce([
        sampleRevision as any,
      ]);

      const result = await listRevisionsByContentItem("item-1");
      expect(result).toEqual({
        items: [sampleRevision],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
      expect(prisma.contentRevision.findMany).toHaveBeenCalledWith({
        where: { contentItemId: "item-1" },
        skip: 0,
        take: 20,
        orderBy: { versionNumber: "desc" },
        include: {
          author: { select: { id: true, name: true, email: true } },
        },
      });
    });

    it("applies filters for revisionStatus, isPublishedSnapshot, and authorId", async () => {
      vi.spyOn(prisma.contentRevision, "count").mockResolvedValueOnce(0);
      vi.spyOn(prisma.contentRevision, "findMany").mockResolvedValueOnce([]);

      await listRevisionsByContentItem("item-1", {
        revisionStatus: "APPROVED",
        isPublishedSnapshot: true,
        authorId: "admin-1",
        page: 2,
        limit: 5,
        sortOrder: "asc",
      });

      expect(prisma.contentRevision.findMany).toHaveBeenCalledWith({
        where: {
          contentItemId: "item-1",
          revisionStatus: "APPROVED",
          isPublishedSnapshot: true,
          authorId: "admin-1",
        },
        skip: 5,
        take: 5,
        orderBy: { versionNumber: "asc" },
        include: {
          author: { select: { id: true, name: true, email: true } },
        },
      });
    });
  });

  describe("updateWorkingRevision (RI-02 Atomic State Protection & RI-06 OCC)", () => {
    it("updates title, snapshotData, and changeSummary inside a transaction", async () => {
      const mockTx = {
        $queryRawUnsafe: vi.fn().mockResolvedValue([]),
        contentRevision: {
          findUnique: vi.fn().mockResolvedValueOnce({
            ...sampleRevision,
            contentItem: { id: "item-1", currentPublishedRevisionId: "rev-pub" },
          }),
          updateMany: vi.fn().mockResolvedValueOnce({ count: 1 }),
          findUniqueOrThrow: vi.fn().mockResolvedValueOnce({
            ...sampleRevision,
            title: "Updated Title",
            changeSummary: "Refined copy",
          }),
        },
      } as unknown as Prisma.TransactionClient;

      vi.spyOn(prisma, "$transaction").mockImplementationOnce(
        async (cb: any) => cb(mockTx)
      );

      const result = await updateWorkingRevision("rev-1", {
        title: "Updated Title",
        changeSummary: "Refined copy",
      });

      expect(mockTx.contentRevision.updateMany).toHaveBeenCalledWith({
        where: {
          id: "rev-1",
          isPublishedSnapshot: false,
          revisionStatus: {
            in: ["WORKING_DRAFT", "PENDING_REVIEW", "REJECTED"],
          },
          publishedInContentItem: null,
        },
        data: {
          title: "Updated Title",
          changeSummary: "Refined copy",
        },
      });
      expect(result.title).toBe("Updated Title");
    });

    it("throws ConcurrencyConflictError if updateMany count is 0 (concurrent publication race)", async () => {
      const mockTx = {
        $queryRawUnsafe: vi.fn().mockResolvedValue([]),
        contentRevision: {
          findUnique: vi.fn().mockResolvedValueOnce({
            ...sampleRevision,
            contentItem: { id: "item-1", currentPublishedRevisionId: null },
          }),
          updateMany: vi.fn().mockResolvedValueOnce({ count: 0 }),
        },
      } as unknown as Prisma.TransactionClient;

      vi.spyOn(prisma, "$transaction").mockImplementationOnce(
        async (cb: any) => cb(mockTx)
      );

      await expect(
        updateWorkingRevision("rev-1", { title: "Racy Update" })
      ).rejects.toThrow(ConcurrencyConflictError);
    });

    it("throws ConcurrencyConflictError if expectedRevisionStatus does not match current status", async () => {
      const mockTx = {
        $queryRawUnsafe: vi.fn().mockResolvedValue([]),
        contentRevision: {
          findUnique: vi.fn().mockResolvedValueOnce({
            ...sampleRevision,
            revisionStatus: "PENDING_REVIEW",
            contentItem: { id: "item-1", currentPublishedRevisionId: null },
          }),
        },
      } as unknown as Prisma.TransactionClient;

      vi.spyOn(prisma, "$transaction").mockImplementationOnce(
        async (cb: any) => cb(mockTx)
      );

      await expect(
        updateWorkingRevision("rev-1", {
          title: "Stale Edit",
          expectedRevisionStatus: "WORKING_DRAFT",
        })
      ).rejects.toThrow(ConcurrencyConflictError);
    });

    it("throws ContentRevisionNotFoundError if revision does not exist", async () => {
      const mockTx = {
        $queryRawUnsafe: vi.fn().mockResolvedValue([]),
        contentRevision: {
          findUnique: vi.fn().mockResolvedValueOnce(null),
        },
      } as unknown as Prisma.TransactionClient;

      vi.spyOn(prisma, "$transaction").mockImplementationOnce(
        async (cb: any) => cb(mockTx)
      );

      await expect(
        updateWorkingRevision("non-existent-rev", { title: "Test" })
      ).rejects.toThrow(ContentRevisionNotFoundError);
    });

    it("throws RevisionOwnershipMismatchError if contentItemId does not match", async () => {
      const mockTx = {
        $queryRawUnsafe: vi.fn().mockResolvedValue([]),
        contentRevision: {
          findUnique: vi.fn().mockResolvedValueOnce({
            ...sampleRevision,
            contentItem: { id: "item-1", currentPublishedRevisionId: null },
          }),
        },
      } as unknown as Prisma.TransactionClient;

      vi.spyOn(prisma, "$transaction").mockImplementationOnce(
        async (cb: any) => cb(mockTx)
      );

      await expect(
        updateWorkingRevision("rev-1", { title: "Test" }, "wrong-item")
      ).rejects.toThrow(RevisionOwnershipMismatchError);
    });

    it("throws ImmutableRevisionError if isPublishedSnapshot is true", async () => {
      const mockTx = {
        $queryRawUnsafe: vi.fn().mockResolvedValue([]),
        contentRevision: {
          findUnique: vi.fn().mockResolvedValueOnce({
            ...sampleRevision,
            isPublishedSnapshot: true,
            contentItem: { id: "item-1", currentPublishedRevisionId: null },
          }),
        },
      } as unknown as Prisma.TransactionClient;

      vi.spyOn(prisma, "$transaction").mockImplementationOnce(
        async (cb: any) => cb(mockTx)
      );

      await expect(
        updateWorkingRevision("rev-1", { title: "Attempted edit" })
      ).rejects.toThrow(ImmutableRevisionError);
    });

    it("throws ImmutableRevisionError if revision is pointed to by currentPublishedRevisionId", async () => {
      const mockTx = {
        $queryRawUnsafe: vi.fn().mockResolvedValue([]),
        contentRevision: {
          findUnique: vi.fn().mockResolvedValueOnce({
            ...sampleRevision,
            isPublishedSnapshot: false,
            contentItem: { id: "item-1", currentPublishedRevisionId: "rev-1" },
          }),
        },
      } as unknown as Prisma.TransactionClient;

      vi.spyOn(prisma, "$transaction").mockImplementationOnce(
        async (cb: any) => cb(mockTx)
      );

      await expect(
        updateWorkingRevision("rev-1", { title: "Attempted edit" })
      ).rejects.toThrow(ImmutableRevisionError);
    });

    it("throws InvalidRevisionStateError if status is APPROVED or SUPERSEDED", async () => {
      const mockTx = {
        $queryRawUnsafe: vi.fn().mockResolvedValue([]),
        contentRevision: {
          findUnique: vi.fn().mockResolvedValueOnce({
            ...sampleRevision,
            revisionStatus: "APPROVED",
            contentItem: { id: "item-1", currentPublishedRevisionId: null },
          }),
        },
      } as unknown as Prisma.TransactionClient;

      vi.spyOn(prisma, "$transaction").mockImplementationOnce(
        async (cb: any) => cb(mockTx)
      );

      await expect(
        updateWorkingRevision("rev-1", { title: "Attempted edit" })
      ).rejects.toThrow(InvalidRevisionStateError);
    });

    it("resets REJECTED revision back to WORKING_DRAFT upon editing", async () => {
      const mockTx = {
        $queryRawUnsafe: vi.fn().mockResolvedValue([]),
        contentRevision: {
          findUnique: vi.fn().mockResolvedValueOnce({
            ...sampleRevision,
            revisionStatus: "REJECTED",
            rejectionNote: "Needs improvement",
            contentItem: { id: "item-1", currentPublishedRevisionId: null },
          }),
          updateMany: vi.fn().mockResolvedValueOnce({ count: 1 }),
          findUniqueOrThrow: vi.fn().mockResolvedValueOnce({
            ...sampleRevision,
            revisionStatus: "WORKING_DRAFT",
            rejectionNote: null,
          }),
        },
      } as unknown as Prisma.TransactionClient;

      vi.spyOn(prisma, "$transaction").mockImplementationOnce(
        async (cb: any) => cb(mockTx)
      );

      const result = await updateWorkingRevision("rev-1", {
        title: "Better Headline Here",
      });

      expect(mockTx.contentRevision.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: "Better Headline Here",
            revisionStatus: "WORKING_DRAFT",
            rejectionNote: null,
          }),
        })
      );
      expect(result.revisionStatus).toBe("WORKING_DRAFT");
    });
  });

  describe("pruneWorkingDraftRevisions (RI-05 Transactional Pruning)", () => {
    it("returns 0 if parent ContentItem is not found", async () => {
      const mockTx = {
        $queryRawUnsafe: vi.fn().mockResolvedValue([]),
        contentItem: {
          findUnique: vi.fn().mockResolvedValueOnce(null),
        },
      } as unknown as Prisma.TransactionClient;

      vi.spyOn(prisma, "$transaction").mockImplementationOnce(
        async (cb: any) => cb(mockTx)
      );

      const result = await pruneWorkingDraftRevisions("item-none");
      expect(result).toBe(0);
    });

    it("returns 0 if eligible drafts do not exceed retention limit", async () => {
      const mockTx = {
        $queryRawUnsafe: vi.fn().mockResolvedValue([]),
        contentItem: {
          findUnique: vi.fn().mockResolvedValueOnce({
            id: "item-1",
            currentPublishedRevisionId: "rev-pub",
            currentWorkingRevisionId: "rev-work",
          }),
        },
        contentRevision: {
          findMany: vi.fn().mockResolvedValueOnce([
            { id: "rev-3" },
            { id: "rev-2" },
            { id: "rev-1" },
          ]),
        },
      } as unknown as Prisma.TransactionClient;

      vi.spyOn(prisma, "$transaction").mockImplementationOnce(
        async (cb: any) => cb(mockTx)
      );

      const result = await pruneWorkingDraftRevisions("item-1", 20);
      expect(result).toBe(0);
    });

    it("prunes only excess drafts beyond retention limit and strictly protects pointers at DB level", async () => {
      const mockTx = {
        $queryRawUnsafe: vi.fn().mockResolvedValue([]),
        contentItem: {
          findUnique: vi.fn().mockResolvedValueOnce({
            id: "item-1",
            currentPublishedRevisionId: "rev-pub-active",
            currentWorkingRevisionId: "rev-work-active",
          }),
        },
        contentRevision: {
          findMany: vi.fn().mockResolvedValueOnce([
            { id: "rev-work-active" },
            { id: "rev-5" },
            { id: "rev-4" },
            { id: "rev-3" },
            { id: "rev-2" },
            { id: "rev-1" },
          ]),
          deleteMany: vi.fn().mockResolvedValueOnce({ count: 2 }),
        },
      } as unknown as Prisma.TransactionClient;

      vi.spyOn(prisma, "$transaction").mockImplementationOnce(
        async (cb: any) => cb(mockTx)
      );

      const result = await pruneWorkingDraftRevisions("item-1", 3);

      expect(mockTx.contentRevision.deleteMany).toHaveBeenCalledWith({
        where: {
          id: { in: ["rev-2", "rev-1"] },
          isPublishedSnapshot: false,
          revisionStatus: { notIn: ["PUBLISHED_SNAPSHOT", "APPROVED"] },
          publishedInContentItem: null,
          workingInContentItem: null,
        },
      });
      expect(result).toBe(2);
    });
  });
});
