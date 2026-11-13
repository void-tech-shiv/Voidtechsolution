import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  createContentItem,
  getContentItemById,
  getContentItemBySlug,
  getContentItemByIdWithPointers,
  getContentItemBySlugWithPointers,
  getContentItemByIdWithRevisions,
  listContentItems,
  updateContentItemMetadata,
  deleteContentItem,
} from "@/server/repositories/cms/content-item.repo";
import {
  ContentItemNotFoundError,
  SlugAlreadyExistsError,
  ConcurrencyConflictError,
  ContentItemDeletionBlockedError,
} from "@/server/repositories/cms/cms-repository.errors";
import { Prisma } from "@prisma/client";

describe("ContentItem Repository", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockDate = new Date("2026-11-13T12:00:00Z");

  const sampleContentItem = {
    id: "item-test-1",
    slug: "custom-software-development",
    contentType: "SERVICE" as const,
    version: 1,
    publicationStatus: "DRAFT" as const,
    currentPublishedRevisionId: null,
    currentWorkingRevisionId: null,
    publishedAt: null,
    publishedById: null,
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  describe("createContentItem", () => {
    it("creates a new ContentItem with initial DRAFT status and version 1", async () => {
      const spy = vi
        .spyOn(prisma.contentItem, "create")
        .mockResolvedValueOnce(sampleContentItem);

      const result = await createContentItem({
        slug: "custom-software-development",
        contentType: "SERVICE",
      });

      expect(spy).toHaveBeenCalledWith({
        data: {
          slug: "custom-software-development",
          contentType: "SERVICE",
          version: 1,
          publicationStatus: "DRAFT",
          currentPublishedRevisionId: null,
          currentWorkingRevisionId: null,
          publishedAt: null,
          publishedById: null,
        },
      });
      expect(result).toEqual(sampleContentItem);
    });

    it("maps Prisma P2002 duplicate key constraint to SlugAlreadyExistsError", async () => {
      const p2002Error = new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed on the fields: (`slug`)",
        {
          code: "P2002",
          clientVersion: "5.x",
        }
      );
      vi.spyOn(prisma.contentItem, "create").mockRejectedValueOnce(p2002Error);

      await expect(
        createContentItem({
          slug: "custom-software-development",
          contentType: "SERVICE",
        })
      ).rejects.toThrow(SlugAlreadyExistsError);
    });

    it("passes through external transaction client when provided", async () => {
      const mockTx = {
        contentItem: {
          create: vi.fn().mockResolvedValueOnce(sampleContentItem),
        },
      } as unknown as Prisma.TransactionClient;

      const result = await createContentItem(
        {
          slug: "custom-software-development",
          contentType: "SERVICE",
        },
        mockTx
      );

      expect(mockTx.contentItem.create).toHaveBeenCalled();
      expect(result).toEqual(sampleContentItem);
    });
  });

  describe("getContentItemById & BySlug", () => {
    it("finds content item by ID", async () => {
      vi.spyOn(prisma.contentItem, "findUnique").mockResolvedValueOnce(
        sampleContentItem
      );

      const result = await getContentItemById("item-test-1");
      expect(result).toEqual(sampleContentItem);
      expect(prisma.contentItem.findUnique).toHaveBeenCalledWith({
        where: { id: "item-test-1" },
      });
    });

    it("returns null when ID does not exist", async () => {
      vi.spyOn(prisma.contentItem, "findUnique").mockResolvedValueOnce(null);

      const result = await getContentItemById("non-existent");
      expect(result).toBeNull();
    });

    it("finds content item by slug", async () => {
      vi.spyOn(prisma.contentItem, "findUnique").mockResolvedValueOnce(
        sampleContentItem
      );

      const result = await getContentItemBySlug("custom-software-development");
      expect(result).toEqual(sampleContentItem);
      expect(prisma.contentItem.findUnique).toHaveBeenCalledWith({
        where: { slug: "custom-software-development" },
      });
    });
  });

  describe("getContentItemWithPointers & Revisions", () => {
    it("retrieves content item with revision pointers and publisher select", async () => {
      const itemWithPointers = {
        ...sampleContentItem,
        currentPublishedRevision: {
          id: "rev-pub-1",
          contentItemId: "item-test-1",
          versionNumber: 1,
          revisionStatus: "PUBLISHED_SNAPSHOT",
          isPublishedSnapshot: true,
          title: "Published Rev",
          authorId: "admin-1",
          authorName: "Admin",
          changeSummary: null,
          createdAt: mockDate,
        },
        currentWorkingRevision: null,
        publisher: { id: "admin-1", name: "Admin", email: "admin@example.com" },
      };

      vi.spyOn(prisma.contentItem, "findUnique").mockResolvedValueOnce(
        itemWithPointers as any
      );

      const result = await getContentItemByIdWithPointers("item-test-1");
      expect(result).toEqual(itemWithPointers);
    });

    it("retrieves content item by slug with revision pointers", async () => {
      const itemWithPointers = {
        ...sampleContentItem,
        currentPublishedRevision: null,
        currentWorkingRevision: null,
        publisher: null,
      };

      vi.spyOn(prisma.contentItem, "findUnique").mockResolvedValueOnce(
        itemWithPointers as any
      );

      const result = await getContentItemBySlugWithPointers("custom-software-development");
      expect(result).toEqual(itemWithPointers);
    });

    it("retrieves content item with revision history ordered by versionNumber desc", async () => {
      const itemWithRevisions = {
        ...sampleContentItem,
        currentPublishedRevision: null,
        currentWorkingRevision: null,
        publisher: null,
        revisions: [
          {
            id: "rev-2",
            versionNumber: 2,
            revisionStatus: "WORKING_DRAFT",
            title: "Draft 2",
            author: { id: "admin-1", name: "Admin", email: "admin@example.com" },
          },
          {
            id: "rev-1",
            versionNumber: 1,
            revisionStatus: "SUPERSEDED",
            title: "Draft 1",
            author: { id: "admin-1", name: "Admin", email: "admin@example.com" },
          },
        ],
      };

      vi.spyOn(prisma.contentItem, "findUnique").mockResolvedValueOnce(
        itemWithRevisions as any
      );

      const result = await getContentItemByIdWithRevisions("item-test-1");
      expect(result).toEqual(itemWithRevisions);
    });
  });

  describe("listContentItems", () => {
    it("returns paginated content items with default sorting and pagination", async () => {
      vi.spyOn(prisma.contentItem, "count").mockResolvedValueOnce(1);
      vi.spyOn(prisma.contentItem, "findMany").mockResolvedValueOnce([
        sampleContentItem,
      ]);

      const result = await listContentItems({});
      expect(result).toEqual({
        items: [sampleContentItem],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
      expect(prisma.contentItem.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 20,
        orderBy: { createdAt: "desc" },
        include: undefined,
      });
    });

    it("applies filtering by contentType, publicationStatus, and search term", async () => {
      vi.spyOn(prisma.contentItem, "count").mockResolvedValueOnce(0);
      vi.spyOn(prisma.contentItem, "findMany").mockResolvedValueOnce([]);

      await listContentItems({
        contentType: "PORTFOLIO_PROJECT",
        publicationStatus: "PUBLISHED",
        search: "fintech",
        page: 2,
        limit: 10,
        sortBy: "slug",
        sortOrder: "asc",
      });

      expect(prisma.contentItem.findMany).toHaveBeenCalledWith({
        where: {
          contentType: "PORTFOLIO_PROJECT",
          publicationStatus: "PUBLISHED",
          slug: { contains: "fintech", mode: "insensitive" },
        },
        skip: 10,
        take: 10,
        orderBy: { slug: "asc" },
        include: undefined,
      });
    });

    it("includes pointers when includePointers is true", async () => {
      vi.spyOn(prisma.contentItem, "count").mockResolvedValueOnce(0);
      vi.spyOn(prisma.contentItem, "findMany").mockResolvedValueOnce([]);

      await listContentItems({ includePointers: true });

      expect(prisma.contentItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            currentPublishedRevision: expect.any(Object),
            currentWorkingRevision: expect.any(Object),
            publisher: expect.any(Object),
          }),
        })
      );
    });
  });

  describe("updateContentItemMetadata", () => {
    it("updates slug and increments version when expectedVersion matches", async () => {
      vi.spyOn(prisma.contentItem, "updateMany").mockResolvedValueOnce({
        count: 1,
      });
      const updatedItem = {
        ...sampleContentItem,
        slug: "new-custom-software",
        version: 2,
      };
      vi.spyOn(prisma.contentItem, "findUnique").mockResolvedValueOnce(
        updatedItem
      );

      const result = await updateContentItemMetadata("item-test-1", {
        slug: "new-custom-software",
        expectedVersion: 1,
      });

      expect(prisma.contentItem.updateMany).toHaveBeenCalledWith({
        where: { id: "item-test-1", version: 1 },
        data: { slug: "new-custom-software", version: { increment: 1 } },
      });
      expect(result).toEqual(updatedItem);
    });

    it("throws ContentItemNotFoundError if record does not exist", async () => {
      vi.spyOn(prisma.contentItem, "updateMany").mockResolvedValueOnce({
        count: 0,
      });
      vi.spyOn(prisma.contentItem, "findUnique").mockResolvedValueOnce(null);

      await expect(
        updateContentItemMetadata("non-existent", {
          expectedVersion: 1,
        })
      ).rejects.toThrow(ContentItemNotFoundError);
    });

    it("throws ConcurrencyConflictError if record exists but version differs", async () => {
      vi.spyOn(prisma.contentItem, "updateMany").mockResolvedValueOnce({
        count: 0,
      });
      vi.spyOn(prisma.contentItem, "findUnique").mockResolvedValueOnce({
        id: "item-test-1",
        version: 3,
      } as any);

      await expect(
        updateContentItemMetadata("item-test-1", {
          expectedVersion: 1,
        })
      ).rejects.toThrow(ConcurrencyConflictError);
    });

    it("throws SlugAlreadyExistsError if new slug violates unique constraint", async () => {
      const p2002Error = new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed on the fields: (`slug`)",
        {
          code: "P2002",
          clientVersion: "5.x",
        }
      );
      vi.spyOn(prisma.contentItem, "updateMany").mockRejectedValueOnce(
        p2002Error
      );

      await expect(
        updateContentItemMetadata("item-test-1", {
          slug: "already-taken-slug",
          expectedVersion: 1,
        })
      ).rejects.toThrow(SlugAlreadyExistsError);
    });
  });

  describe("deleteContentItem (RI-03 Integrity Safeguards)", () => {
    it("deletes a clean draft content item with no revisions or domain links", async () => {
      vi.spyOn(prisma.contentItem, "findUnique").mockResolvedValueOnce({
        id: "item-clean",
        publicationStatus: "DRAFT",
        currentPublishedRevisionId: null,
        _count: { revisions: 0 },
        service: null,
        pricingPackage: null,
        portfolioProject: null,
        faq: null,
        pageSection: null,
        testimonial: null,
      } as any);
      const deleteSpy = vi
        .spyOn(prisma.contentItem, "delete")
        .mockResolvedValueOnce(sampleContentItem);

      await deleteContentItem("item-clean");
      expect(deleteSpy).toHaveBeenCalledWith({ where: { id: "item-clean" } });
    });

    it("throws ContentItemNotFoundError if item does not exist", async () => {
      vi.spyOn(prisma.contentItem, "findUnique").mockResolvedValueOnce(null);

      await expect(deleteContentItem("non-existent")).rejects.toThrow(
        ContentItemNotFoundError
      );
    });

    it("blocks deletion if content item is currently in PUBLISHED status", async () => {
      vi.spyOn(prisma.contentItem, "findUnique").mockResolvedValueOnce({
        id: "item-pub",
        publicationStatus: "PUBLISHED",
        currentPublishedRevisionId: "rev-pub",
        _count: { revisions: 0 },
        service: null,
        pricingPackage: null,
        portfolioProject: null,
        faq: null,
        pageSection: null,
        testimonial: null,
      } as any);

      await expect(deleteContentItem("item-pub")).rejects.toThrow(
        ContentItemDeletionBlockedError
      );
    });

    it("blocks deletion if content item has currentPublishedRevisionId pointer set", async () => {
      vi.spyOn(prisma.contentItem, "findUnique").mockResolvedValueOnce({
        id: "item-pointer",
        publicationStatus: "DRAFT",
        currentPublishedRevisionId: "rev-pub-123",
        _count: { revisions: 0 },
        service: null,
        pricingPackage: null,
        portfolioProject: null,
        faq: null,
        pageSection: null,
        testimonial: null,
      } as any);

      await expect(deleteContentItem("item-pointer")).rejects.toThrow(
        ContentItemDeletionBlockedError
      );
    });

    it("blocks deletion if content item has historical revisions (immutable revision history)", async () => {
      vi.spyOn(prisma.contentItem, "findUnique").mockResolvedValueOnce({
        id: "item-history",
        publicationStatus: "DRAFT",
        currentPublishedRevisionId: null,
        _count: { revisions: 3 },
        service: null,
        pricingPackage: null,
        portfolioProject: null,
        faq: null,
        pageSection: null,
        testimonial: null,
      } as any);

      await expect(deleteContentItem("item-history")).rejects.toThrow(
        ContentItemDeletionBlockedError
      );
    });

    it("blocks deletion if content item is linked to active domain entities (e.g. Service)", async () => {
      vi.spyOn(prisma.contentItem, "findUnique").mockResolvedValueOnce({
        id: "item-service",
        publicationStatus: "DRAFT",
        currentPublishedRevisionId: null,
        _count: { revisions: 0 },
        service: { id: "srv-1" },
        pricingPackage: null,
        portfolioProject: null,
        faq: null,
        pageSection: null,
        testimonial: null,
      } as any);

      await expect(deleteContentItem("item-service")).rejects.toThrow(
        ContentItemDeletionBlockedError
      );
    });

    it("maps unexpected database foreign key violation (P2003) to ContentItemDeletionBlockedError", async () => {
      vi.spyOn(prisma.contentItem, "findUnique").mockResolvedValueOnce({
        id: "item-fk",
        publicationStatus: "DRAFT",
        currentPublishedRevisionId: null,
        _count: { revisions: 0 },
        service: null,
        pricingPackage: null,
        portfolioProject: null,
        faq: null,
        pageSection: null,
        testimonial: null,
      } as any);

      const p2003Error = new Prisma.PrismaClientKnownRequestError(
        "Foreign key constraint failed on the field: `contentItemId`",
        { code: "P2003", clientVersion: "5.x" }
      );
      vi.spyOn(prisma.contentItem, "delete").mockRejectedValueOnce(p2003Error);

      await expect(deleteContentItem("item-fk")).rejects.toThrow(
        ContentItemDeletionBlockedError
      );
    });
  });
});
