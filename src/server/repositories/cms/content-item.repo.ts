/**
 * VOIDTECH SOLUTION — ContentItem Repository
 * 
 * Provides strongly-typed, transactional data access for ContentItem records.
 * Enforces optimistic concurrency control (OCC), prevents lifecycle status bypassing,
 * and maintains pointer and audit integrity.
 */

import { prisma } from "@/lib/prisma";
import type {
  ContentItem,
  ContentType,
  ContentPublicationStatus,
  Prisma,
} from "@prisma/client";
import {
  ContentItemNotFoundError,
  SlugAlreadyExistsError,
  ConcurrencyConflictError,
} from "./cms-repository.errors";

export interface CreateContentItemInput {
  slug: string;
  contentType: ContentType;
}

export interface UpdateContentItemMetadataInput {
  slug?: string;
  expectedVersion: number;
}

export type ContentItemSortField =
  | "createdAt"
  | "updatedAt"
  | "slug"
  | "publicationStatus"
  | "version";

export interface ListContentItemsParams {
  contentType?: ContentType;
  publicationStatus?: ContentPublicationStatus;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: ContentItemSortField;
  sortOrder?: "asc" | "desc";
  includePointers?: boolean;
}

export interface PaginatedContentItems<T = ContentItem> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const ALLOWED_SORT_FIELDS: ReadonlySet<ContentItemSortField> = new Set([
  "createdAt",
  "updatedAt",
  "slug",
  "publicationStatus",
  "version",
]);

/**
 * Standard revision pointer selector for safe repository responses.
 */
export const REVISION_POINTER_SELECT = {
  id: true,
  contentItemId: true,
  versionNumber: true,
  revisionStatus: true,
  isPublishedSnapshot: true,
  title: true,
  authorId: true,
  authorName: true,
  changeSummary: true,
  createdAt: true,
} as const;

export const PUBLISHER_SELECT = {
  id: true,
  name: true,
  email: true,
} as const;

/**
 * Creates a new ContentItem in the initial DRAFT status.
 * Explicitly guards against client injection of lifecycle pointers, publication timestamps,
 * or non-default initial versions.
 */
export async function createContentItem(
  input: CreateContentItemInput,
  tx?: Prisma.TransactionClient
): Promise<ContentItem> {
  const db = tx ?? prisma;

  try {
    return await db.contentItem.create({
      data: {
        slug: input.slug,
        contentType: input.contentType,
        version: 1,
        publicationStatus: "DRAFT",
        currentPublishedRevisionId: null,
        currentWorkingRevisionId: null,
        publishedAt: null,
        publishedById: null,
      },
    });
  } catch (error) {
    if (
      error instanceof Object &&
      "code" in error &&
      error.code === "P2002"
    ) {
      throw new SlugAlreadyExistsError(input.slug);
    }
    throw error;
  }
}

/**
 * Finds a ContentItem by primary key ID.
 */
export async function getContentItemById(
  id: string,
  tx?: Prisma.TransactionClient
): Promise<ContentItem | null> {
  const db = tx ?? prisma;
  return db.contentItem.findUnique({
    where: { id },
  });
}

/**
 * Finds a ContentItem by unique slug.
 */
export async function getContentItemBySlug(
  slug: string,
  tx?: Prisma.TransactionClient
): Promise<ContentItem | null> {
  const db = tx ?? prisma;
  return db.contentItem.findUnique({
    where: { slug },
  });
}

/**
 * Finds a ContentItem by ID including its current working and published revision pointers.
 */
export async function getContentItemByIdWithPointers(
  id: string,
  tx?: Prisma.TransactionClient
) {
  const db = tx ?? prisma;
  return db.contentItem.findUnique({
    where: { id },
    include: {
      currentPublishedRevision: { select: REVISION_POINTER_SELECT },
      currentWorkingRevision: { select: REVISION_POINTER_SELECT },
      publisher: { select: PUBLISHER_SELECT },
    },
  });
}

/**
 * Finds a ContentItem by slug including its current working and published revision pointers.
 */
export async function getContentItemBySlugWithPointers(
  slug: string,
  tx?: Prisma.TransactionClient
) {
  const db = tx ?? prisma;
  return db.contentItem.findUnique({
    where: { slug },
    include: {
      currentPublishedRevision: { select: REVISION_POINTER_SELECT },
      currentWorkingRevision: { select: REVISION_POINTER_SELECT },
      publisher: { select: PUBLISHER_SELECT },
    },
  });
}

/**
 * Finds a ContentItem by ID including its complete revision history sorted newest first.
 */
export async function getContentItemByIdWithRevisions(
  id: string,
  tx?: Prisma.TransactionClient
) {
  const db = tx ?? prisma;
  return db.contentItem.findUnique({
    where: { id },
    include: {
      currentPublishedRevision: { select: REVISION_POINTER_SELECT },
      currentWorkingRevision: { select: REVISION_POINTER_SELECT },
      publisher: { select: PUBLISHER_SELECT },
      revisions: {
        orderBy: { versionNumber: "desc" },
        include: {
          author: { select: PUBLISHER_SELECT },
        },
      },
    },
  });
}

/**
 * Retrieves a deterministic paginated list of ContentItems with filtering and search.
 */
export async function listContentItems(
  params: ListContentItemsParams = {},
  tx?: Prisma.TransactionClient
): Promise<PaginatedContentItems<ContentItem>> {
  const db = tx ?? prisma;
  const {
    contentType,
    publicationStatus,
    search,
    page = 1,
    limit = 20,
    sortBy = "createdAt",
    sortOrder = "desc",
    includePointers = false,
  } = params;

  const safePage = Math.max(1, page);
  const safeLimit = Math.min(100, Math.max(1, limit));
  const skip = (safePage - 1) * safeLimit;
  const safeSortBy = ALLOWED_SORT_FIELDS.has(sortBy) ? sortBy : "createdAt";

  const where: Prisma.ContentItemWhereInput = {};

  if (contentType) {
    where.contentType = contentType;
  }

  if (publicationStatus) {
    where.publicationStatus = publicationStatus;
  }

  if (search && search.trim().length > 0) {
    where.slug = {
      contains: search.trim(),
      mode: "insensitive",
    };
  }

  const [total, items] = await Promise.all([
    db.contentItem.count({ where }),
    db.contentItem.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy: { [safeSortBy]: sortOrder },
      include: includePointers
        ? {
            currentPublishedRevision: { select: REVISION_POINTER_SELECT },
            currentWorkingRevision: { select: REVISION_POINTER_SELECT },
            publisher: { select: PUBLISHER_SELECT },
          }
        : undefined,
    }),
  ]);

  return {
    items: items as ContentItem[],
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(total / safeLimit) || 1,
  };
}

/**
 * Updates non-lifecycle ContentItem metadata (e.g. slug) using atomic Optimistic Concurrency Control (OCC).
 * Strictly rejects modifications to publicationStatus, revision pointers, or published timestamps.
 * 
 * @throws {ContentItemNotFoundError} if the ContentItem does not exist
 * @throws {ConcurrencyConflictError} if the expectedVersion does not match the database version
 * @throws {SlugAlreadyExistsError} if updating the slug collides with an existing slug
 */
export async function updateContentItemMetadata(
  id: string,
  input: UpdateContentItemMetadataInput,
  tx?: Prisma.TransactionClient
): Promise<ContentItem> {
  const db = tx ?? prisma;

  const updateData: Prisma.ContentItemUpdateInput = {
    version: { increment: 1 },
  };

  if (input.slug !== undefined) {
    updateData.slug = input.slug;
  }

  try {
    const result = await db.contentItem.updateMany({
      where: {
        id,
        version: input.expectedVersion,
      },
      data: updateData,
    });

    if (result.count === 0) {
      const existing = await db.contentItem.findUnique({
        where: { id },
        select: { id: true, version: true },
      });

      if (!existing) {
        throw new ContentItemNotFoundError(id);
      }

      throw new ConcurrencyConflictError(
        `Concurrency conflict: ContentItem "${id}" was modified concurrently (expected version ${input.expectedVersion}, actual version ${existing.version})`,
        input.expectedVersion,
        existing.version
      );
    }

    const updated = await db.contentItem.findUnique({
      where: { id },
    });

    if (!updated) {
      throw new ContentItemNotFoundError(id);
    }

    return updated;
  } catch (error) {
    if (
      error instanceof Object &&
      "code" in error &&
      error.code === "P2002"
    ) {
      throw new SlugAlreadyExistsError(input.slug ?? "");
    }
    throw error;
  }
}

/**
 * Deletes a ContentItem by ID.
 * Throws ContentItemNotFoundError if the item does not exist.
 */
export async function deleteContentItem(
  id: string,
  tx?: Prisma.TransactionClient
): Promise<void> {
  const db = tx ?? prisma;

  const existing = await db.contentItem.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    throw new ContentItemNotFoundError(id);
  }

  await db.contentItem.delete({
    where: { id },
  });
}
