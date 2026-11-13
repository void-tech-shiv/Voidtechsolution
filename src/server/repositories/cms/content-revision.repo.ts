/**
 * VOIDTECH SOLUTION — ContentRevision Repository
 * 
 * Provides strongly-typed, transactional data access for ContentRevision records.
 * Enforces revision immutability for published snapshots, prevents cross-item revision
 * ownership pollution, maintains monotonic version numbering, and safely prunes excess working drafts.
 */

import { prisma } from "@/lib/prisma";
import type {
  ContentRevision,
  RevisionLifecycleStatus,
  Prisma,
} from "@prisma/client";
import {
  ContentItemNotFoundError,
  ContentRevisionNotFoundError,
  RevisionOwnershipMismatchError,
  ImmutableRevisionError,
  InvalidRevisionStateError,
  ConcurrencyConflictError,
} from "./cms-repository.errors";
import { PUBLISHER_SELECT } from "./content-item.repo";

export interface CreateWorkingRevisionInput {
  contentItemId: string;
  title: string;
  snapshotData: Prisma.InputJsonValue;
  authorId?: string | null;
  authorName: string;
  changeSummary?: string | null;
}

export interface UpdateWorkingRevisionInput {
  title?: string;
  snapshotData?: Prisma.InputJsonValue;
  changeSummary?: string | null;
  revisionStatus?: RevisionLifecycleStatus;
}

export interface ListRevisionsParams {
  revisionStatus?: RevisionLifecycleStatus;
  isPublishedSnapshot?: boolean;
  authorId?: string;
  page?: number;
  limit?: number;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedRevisions<T = ContentRevision> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Lifecycle statuses permitted to receive edits or text updates.
 * Published snapshots, approved revisions, and superseded revisions are strictly immutable.
 */
const EDITABLE_LIFECYCLE_STATUSES: ReadonlySet<RevisionLifecycleStatus> = new Set([
  "WORKING_DRAFT",
  "PENDING_REVIEW",
  "REJECTED",
]);

/**
 * Creates a new WORKING_DRAFT revision for a ContentItem.
 * Executes atomically within a transaction:
 * 1. Confirms the parent ContentItem exists.
 * 2. Monotonically assigns versionNumber = max(existing) + 1.
 * 3. Persists the revision with isPublishedSnapshot = false.
 * 4. Updates ContentItem.currentWorkingRevisionId pointer.
 * 5. Safely prunes older unreferenced working drafts (retaining up to 20).
 * 
 * @throws {ContentItemNotFoundError} if parent ContentItem does not exist
 * @throws {ConcurrencyConflictError} if a versionNumber collision occurs during concurrent creation
 */
export async function createWorkingRevision(
  input: CreateWorkingRevisionInput,
  tx?: Prisma.TransactionClient
): Promise<ContentRevision> {
  const executeOperation = async (client: Prisma.TransactionClient) => {
    // 1. Verify parent ContentItem exists
    const contentItem = await client.contentItem.findUnique({
      where: { id: input.contentItemId },
      select: { id: true },
    });

    if (!contentItem) {
      throw new ContentItemNotFoundError(input.contentItemId);
    }

    // 2. Compute next monotonic version number
    const latestRevision = await client.contentRevision.findFirst({
      where: { contentItemId: input.contentItemId },
      orderBy: { versionNumber: "desc" },
      select: { versionNumber: true },
    });

    const nextVersionNumber = (latestRevision?.versionNumber ?? 0) + 1;

    // 3. Insert new working draft revision
    let createdRevision: ContentRevision;
    try {
      createdRevision = await client.contentRevision.create({
        data: {
          contentItemId: input.contentItemId,
          versionNumber: nextVersionNumber,
          revisionStatus: "WORKING_DRAFT",
          isPublishedSnapshot: false,
          title: input.title,
          snapshotData: input.snapshotData,
          authorId: input.authorId ?? null,
          authorName: input.authorName,
          changeSummary: input.changeSummary ?? null,
          rejectionNote: null,
        },
      });
    } catch (error) {
      if (
        error instanceof Object &&
        "code" in error &&
        error.code === "P2002"
      ) {
        throw new ConcurrencyConflictError(
          `Concurrent revision creation collision on content item "${input.contentItemId}" at version ${nextVersionNumber}`
        );
      }
      throw error;
    }

    // 4. Update working pointer on parent ContentItem
    await client.contentItem.update({
      where: { id: input.contentItemId },
      data: {
        currentWorkingRevisionId: createdRevision.id,
      },
    });

    // 5. Safely prune old excess working drafts (retains 20)
    await pruneWorkingDraftRevisions(input.contentItemId, 20, client);

    return createdRevision;
  };

  if (tx) {
    return executeOperation(tx);
  }

  return prisma.$transaction(async (client) => {
    return executeOperation(client);
  });
}

/**
 * Retrieves a ContentRevision by primary key ID.
 * If expectedContentItemId is provided, enforces that the revision belongs to that parent item.
 * 
 * @throws {RevisionOwnershipMismatchError} if the revision belongs to a different ContentItem
 */
export async function getRevisionById(
  id: string,
  expectedContentItemId?: string,
  tx?: Prisma.TransactionClient
): Promise<ContentRevision | null> {
  const db = tx ?? prisma;

  const revision = await db.contentRevision.findUnique({
    where: { id },
    include: {
      author: { select: PUBLISHER_SELECT },
    },
  });

  if (!revision) {
    return null;
  }

  if (
    expectedContentItemId &&
    revision.contentItemId !== expectedContentItemId
  ) {
    throw new RevisionOwnershipMismatchError(
      id,
      expectedContentItemId,
      revision.contentItemId
    );
  }

  return revision;
}

/**
 * Retrieves a deterministic paginated list of revisions for a given ContentItem.
 */
export async function listRevisionsByContentItem(
  contentItemId: string,
  params: ListRevisionsParams = {},
  tx?: Prisma.TransactionClient
): Promise<PaginatedRevisions<ContentRevision>> {
  const db = tx ?? prisma;
  const {
    revisionStatus,
    isPublishedSnapshot,
    authorId,
    page = 1,
    limit = 20,
    sortOrder = "desc",
  } = params;

  const safePage = Math.max(1, page);
  const safeLimit = Math.min(100, Math.max(1, limit));
  const skip = (safePage - 1) * safeLimit;

  const where: Prisma.ContentRevisionWhereInput = {
    contentItemId,
  };

  if (revisionStatus) {
    where.revisionStatus = revisionStatus;
  }

  if (typeof isPublishedSnapshot === "boolean") {
    where.isPublishedSnapshot = isPublishedSnapshot;
  }

  if (authorId) {
    where.authorId = authorId;
  }

  const [total, items] = await Promise.all([
    db.contentRevision.count({ where }),
    db.contentRevision.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy: { versionNumber: sortOrder },
      include: {
        author: { select: PUBLISHER_SELECT },
      },
    }),
  ]);

  return {
    items,
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(total / safeLimit) || 1,
  };
}

/**
 * Updates a working revision.
 * Strictly enforces immutability:
 * - Rejects any modification if isPublishedSnapshot is true.
 * - Rejects any modification if referenced by currentPublishedRevisionId.
 * - Rejects any modification if status is APPROVED, PUBLISHED_SNAPSHOT, or SUPERSEDED.
 * - Resets status from REJECTED back to WORKING_DRAFT upon editing if no explicit status is given.
 * 
 * @throws {ContentRevisionNotFoundError} if revision does not exist
 * @throws {RevisionOwnershipMismatchError} if revision does not belong to expected contentItemId
 * @throws {ImmutableRevisionError} if revision is a published snapshot or currently active published revision
 * @throws {InvalidRevisionStateError} if revision lifecycle status does not permit updates
 */
export async function updateWorkingRevision(
  id: string,
  input: UpdateWorkingRevisionInput,
  expectedContentItemId?: string,
  tx?: Prisma.TransactionClient
): Promise<ContentRevision> {
  const db = tx ?? prisma;

  // 1. Fetch revision with parent pointers to evaluate immutability
  const revision = await db.contentRevision.findUnique({
    where: { id },
    include: {
      contentItem: {
        select: {
          id: true,
          currentPublishedRevisionId: true,
        },
      },
    },
  });

  if (!revision) {
    throw new ContentRevisionNotFoundError(id);
  }

  // 2. Validate cross-item ownership if requested
  if (
    expectedContentItemId &&
    revision.contentItemId !== expectedContentItemId
  ) {
    throw new RevisionOwnershipMismatchError(
      id,
      expectedContentItemId,
      revision.contentItemId
    );
  }

  // 3. Enforce immutability of published snapshots
  if (revision.isPublishedSnapshot) {
    throw new ImmutableRevisionError(
      id,
      `Revision "${id}" is a published snapshot and cannot be modified.`
    );
  }

  // 4. Enforce immutability if pointed to by currentPublishedRevisionId
  if (revision.contentItem?.currentPublishedRevisionId === id) {
    throw new ImmutableRevisionError(
      id,
      `Revision "${id}" is currently the active published revision and cannot be modified.`
    );
  }

  // 5. Enforce allowed editable lifecycle statuses
  if (!EDITABLE_LIFECYCLE_STATUSES.has(revision.revisionStatus)) {
    throw new InvalidRevisionStateError(
      id,
      revision.revisionStatus,
      `Revision "${id}" cannot be edited in status "${revision.revisionStatus}".`
    );
  }

  // 6. Build safe update payload
  const updateData: Prisma.ContentRevisionUpdateInput = {};

  if (input.title !== undefined) {
    updateData.title = input.title;
  }

  if (input.snapshotData !== undefined) {
    updateData.snapshotData = input.snapshotData;
  }

  if (input.changeSummary !== undefined) {
    updateData.changeSummary = input.changeSummary;
  }

  // Handle status transitions
  if (input.revisionStatus !== undefined) {
    if (!EDITABLE_LIFECYCLE_STATUSES.has(input.revisionStatus)) {
      throw new InvalidRevisionStateError(
        id,
        input.revisionStatus,
        `Cannot transition working revision directly to status "${input.revisionStatus}" via update.`
      );
    }
    updateData.revisionStatus = input.revisionStatus;
  } else if (revision.revisionStatus === "REJECTED") {
    // Editing a rejected draft returns it to WORKING_DRAFT
    updateData.revisionStatus = "WORKING_DRAFT";
    updateData.rejectionNote = null;
  }

  return db.contentRevision.update({
    where: { id },
    data: updateData,
    include: {
      author: { select: PUBLISHER_SELECT },
    },
  });
}

/**
 * Safely prunes older excess working draft revisions for a ContentItem.
 * Retention rules:
 * - Retains the most recent `maxDraftsToRetain` (default 20) working drafts.
 * - NEVER deletes any published snapshot (isPublishedSnapshot: true).
 * - NEVER deletes the currentPublishedRevisionId.
 * - NEVER deletes the currentWorkingRevisionId.
 * - NEVER deletes revisions with revisionStatus: "PUBLISHED_SNAPSHOT".
 * 
 * Returns the count of deleted revisions.
 */
export async function pruneWorkingDraftRevisions(
  contentItemId: string,
  maxDraftsToRetain = 20,
  tx?: Prisma.TransactionClient
): Promise<number> {
  const db = tx ?? prisma;

  // 1. Fetch parent ContentItem pointers to ensure they are protected
  const parentItem = await db.contentItem.findUnique({
    where: { id: contentItemId },
    select: {
      id: true,
      currentPublishedRevisionId: true,
      currentWorkingRevisionId: true,
    },
  });

  if (!parentItem) {
    return 0;
  }

  const protectedIds = new Set<string>();
  if (parentItem.currentPublishedRevisionId) {
    protectedIds.add(parentItem.currentPublishedRevisionId);
  }
  if (parentItem.currentWorkingRevisionId) {
    protectedIds.add(parentItem.currentWorkingRevisionId);
  }

  // 2. Query candidates for pruning: only non-published revisions
  const candidateRevisions = await db.contentRevision.findMany({
    where: {
      contentItemId,
      isPublishedSnapshot: false,
      revisionStatus: { not: "PUBLISHED_SNAPSHOT" },
    },
    orderBy: { versionNumber: "desc" },
    select: { id: true },
  });

  // Filter out any protected pointer targets
  const eligibleDrafts = candidateRevisions.filter(
    (rev) => !protectedIds.has(rev.id)
  );

  if (eligibleDrafts.length <= maxDraftsToRetain) {
    return 0;
  }

  const idsToPrune = eligibleDrafts
    .slice(maxDraftsToRetain)
    .map((rev) => rev.id)
    .filter((id) => !protectedIds.has(id));

  if (idsToPrune.length === 0) {
    return 0;
  }

  const deleteResult = await db.contentRevision.deleteMany({
    where: {
      id: { in: idsToPrune },
      isPublishedSnapshot: false,
      revisionStatus: { not: "PUBLISHED_SNAPSHOT" },
    },
  });

  return deleteResult.count;
}
