import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  createWorkingRevision,
  getRevisionById,
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

  describe("createWorkingRevision", () => {
    it("creates first working draft with versionNumber = 1 and updates working pointer", async () => {
      // Mock transaction helper to execute callback with mock client
      const mockClient = {
        contentItem: {
          findUnique: vi.fn().mockResolvedValueOnce({ id: "item-1" }),
          update: vi.fn().mockResolvedValueOnce({ id: "item-1" }),
        },
        contentRevision: {
          findFirst: vi.fn().mockResolvedValueOnce(null), // no prior revisions
          create: vi.fn().mockResolvedValueOnce(sampleRevision),
          findMany: vi.fn().mockResolvedValueOnce([]), // for prune check
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

    it("increments versionNumber monotonically from latest revision", async () => {
      const mockClient = {
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

    it("throws ContentItemNotFoundError if parent item does not exist", async () => {
      const mockClient = {
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

    it("maps Prisma P2002 versionNumber collision to ConcurrencyConflictError", async () => {
      const p2002Error = new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed on the fields: (`contentItemId`,`versionNumber`)",
        { code: "P2002", clientVersion: "5.x" }
      );

      const mockClient = {
        contentItem: {
          findUnique: vi.fn().mockResolvedValueOnce({ id: "item-1" }),
        },
        contentRevision: {
          findFirst: vi.fn().mockResolvedValueOnce({ versionNumber: 2 }),
          create: vi.fn().mockRejectedValueOnce(p2002Error),
        },
      } as unknown as Prisma.TransactionClient;

      vi.spyOn(prisma, "$transaction").mockImplementationOnce(
        async (cb: any) => cb(mockClient)
      );

      await expect(
        createWorkingRevision({
          contentItemId: "item-1",
          title: "Race Condition Draft",
          snapshotData: {},
          authorName: "Shivanshu",
        })
      ).rejects.toThrow(ConcurrencyConflictError);
    });
  });

  describe("getRevisionById", () => {
    it("returns revision with author projection", async () => {
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

    it("returns null when revision does not exist", async () => {
      vi.spyOn(prisma.contentRevision, "findUnique").mockResolvedValueOnce(null);

      const result = await getRevisionById("rev-none");
      expect(result).toBeNull();
    });

    it("succeeds when expectedContentItemId matches revision parent", async () => {
      vi.spyOn(prisma.contentRevision, "findUnique").mockResolvedValueOnce(
        sampleRevision as any
      );

      const result = await getRevisionById("rev-1", "item-1");
      expect(result).toEqual(sampleRevision);
    });

    it("throws RevisionOwnershipMismatchError when revision belongs to different item", async () => {
      vi.spyOn(prisma.contentRevision, "findUnique").mockResolvedValueOnce(
        sampleRevision as any
      );

      await expect(getRevisionById("rev-1", "other-item")).rejects.toThrow(
        RevisionOwnershipMismatchError
      );
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

  describe("updateWorkingRevision", () => {
    it("updates title, snapshotData, and changeSummary of an eligible working draft", async () => {
      vi.spyOn(prisma.contentRevision, "findUnique").mockResolvedValueOnce({
        ...sampleRevision,
        contentItem: { id: "item-1", currentPublishedRevisionId: "rev-pub" },
      } as any);

      const updatedRev = {
        ...sampleRevision,
        title: "Updated Title",
        changeSummary: "Refined copy",
      };
      vi.spyOn(prisma.contentRevision, "update").mockResolvedValueOnce(
        updatedRev as any
      );

      const result = await updateWorkingRevision("rev-1", {
        title: "Updated Title",
        changeSummary: "Refined copy",
      });

      expect(prisma.contentRevision.update).toHaveBeenCalledWith({
        where: { id: "rev-1" },
        data: {
          title: "Updated Title",
          changeSummary: "Refined copy",
        },
        include: {
          author: { select: { id: true, name: true, email: true } },
        },
      });
      expect(result).toEqual(updatedRev);
    });

    it("throws ContentRevisionNotFoundError if revision does not exist", async () => {
      vi.spyOn(prisma.contentRevision, "findUnique").mockResolvedValueOnce(null);

      await expect(
        updateWorkingRevision("non-existent-rev", { title: "Test" })
      ).rejects.toThrow(ContentRevisionNotFoundError);
    });

    it("throws RevisionOwnershipMismatchError if contentItemId does not match", async () => {
      vi.spyOn(prisma.contentRevision, "findUnique").mockResolvedValueOnce({
        ...sampleRevision,
        contentItem: { id: "item-1", currentPublishedRevisionId: null },
      } as any);

      await expect(
        updateWorkingRevision("rev-1", { title: "Test" }, "wrong-item")
      ).rejects.toThrow(RevisionOwnershipMismatchError);
    });

    it("throws ImmutableRevisionError if isPublishedSnapshot is true", async () => {
      vi.spyOn(prisma.contentRevision, "findUnique").mockResolvedValueOnce({
        ...sampleRevision,
        isPublishedSnapshot: true,
        contentItem: { id: "item-1", currentPublishedRevisionId: null },
      } as any);

      await expect(
        updateWorkingRevision("rev-1", { title: "Attempted edit" })
      ).rejects.toThrow(ImmutableRevisionError);
    });

    it("throws ImmutableRevisionError if revision is pointed to by currentPublishedRevisionId", async () => {
      vi.spyOn(prisma.contentRevision, "findUnique").mockResolvedValueOnce({
        ...sampleRevision,
        isPublishedSnapshot: false,
        contentItem: { id: "item-1", currentPublishedRevisionId: "rev-1" },
      } as any);

      await expect(
        updateWorkingRevision("rev-1", { title: "Attempted edit" })
      ).rejects.toThrow(ImmutableRevisionError);
    });

    it("throws InvalidRevisionStateError if status is APPROVED or SUPERSEDED", async () => {
      vi.spyOn(prisma.contentRevision, "findUnique").mockResolvedValueOnce({
        ...sampleRevision,
        revisionStatus: "APPROVED",
        contentItem: { id: "item-1", currentPublishedRevisionId: null },
      } as any);

      await expect(
        updateWorkingRevision("rev-1", { title: "Attempted edit" })
      ).rejects.toThrow(InvalidRevisionStateError);
    });

    it("resets REJECTED revision back to WORKING_DRAFT upon editing", async () => {
      vi.spyOn(prisma.contentRevision, "findUnique").mockResolvedValueOnce({
        ...sampleRevision,
        revisionStatus: "REJECTED",
        rejectionNote: "Needs better headline",
        contentItem: { id: "item-1", currentPublishedRevisionId: null },
      } as any);

      const resetRev = {
        ...sampleRevision,
        revisionStatus: "WORKING_DRAFT",
        rejectionNote: null,
      };
      vi.spyOn(prisma.contentRevision, "update").mockResolvedValueOnce(
        resetRev as any
      );

      await updateWorkingRevision("rev-1", {
        title: "Better Headline Here",
      });

      expect(prisma.contentRevision.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: "Better Headline Here",
            revisionStatus: "WORKING_DRAFT",
            rejectionNote: null,
          }),
        })
      );
    });

    it("throws InvalidRevisionStateError if caller attempts to set PUBLISHED_SNAPSHOT directly", async () => {
      vi.spyOn(prisma.contentRevision, "findUnique").mockResolvedValueOnce({
        ...sampleRevision,
        contentItem: { id: "item-1", currentPublishedRevisionId: null },
      } as any);

      await expect(
        updateWorkingRevision("rev-1", {
          revisionStatus: "PUBLISHED_SNAPSHOT" as any,
        })
      ).rejects.toThrow(InvalidRevisionStateError);
    });
  });

  describe("pruneWorkingDraftRevisions", () => {
    it("returns 0 if parent ContentItem is not found", async () => {
      vi.spyOn(prisma.contentItem, "findUnique").mockResolvedValueOnce(null);

      const result = await pruneWorkingDraftRevisions("item-none");
      expect(result).toBe(0);
    });

    it("returns 0 if eligible drafts do not exceed retention limit", async () => {
      vi.spyOn(prisma.contentItem, "findUnique").mockResolvedValueOnce({
        id: "item-1",
        currentPublishedRevisionId: "rev-pub",
        currentWorkingRevisionId: "rev-work",
      } as any);

      // Only 3 candidates exist
      vi.spyOn(prisma.contentRevision, "findMany").mockResolvedValueOnce([
        { id: "rev-3" },
        { id: "rev-2" },
        { id: "rev-1" },
      ] as any);

      const result = await pruneWorkingDraftRevisions("item-1", 20);
      expect(result).toBe(0);
    });

    it("prunes only excess drafts beyond retention limit and strictly protects pointers", async () => {
      vi.spyOn(prisma.contentItem, "findUnique").mockResolvedValueOnce({
        id: "item-1",
        currentPublishedRevisionId: "rev-pub-active",
        currentWorkingRevisionId: "rev-work-active",
      } as any);

      // 6 candidates, but one of them is the active working pointer
      const candidateList = [
        { id: "rev-work-active" },
        { id: "rev-5" },
        { id: "rev-4" },
        { id: "rev-3" },
        { id: "rev-2" },
        { id: "rev-1" },
      ];

      vi.spyOn(prisma.contentRevision, "findMany").mockResolvedValueOnce(
        candidateList as any
      );

      const deleteSpy = vi
        .spyOn(prisma.contentRevision, "deleteMany")
        .mockResolvedValueOnce({ count: 2 });

      // Retain max 3 eligible drafts
      // Eligible drafts (excluding rev-work-active): [rev-5, rev-4, rev-3, rev-2, rev-1] (5 total)
      // Top 3 retained: rev-5, rev-4, rev-3
      // Excess to prune: rev-2, rev-1
      const result = await pruneWorkingDraftRevisions("item-1", 3);

      expect(deleteSpy).toHaveBeenCalledWith({
        where: {
          id: { in: ["rev-2", "rev-1"] },
          isPublishedSnapshot: false,
          revisionStatus: { not: "PUBLISHED_SNAPSHOT" },
        },
      });
      expect(result).toBe(2);
    });
  });
});
