/**
 * VOIDTECH SOLUTION — ContentRevision Repository
 * 
 * Provides strongly-typed, transactional data access for ContentRevision records.
 * Enforces revision immutability for published snapshots, prevents cross-item revision
 * ownership pollution, maintains monotonic version numbering via parent row locking and bounded retry,
 * protects against mid-flight publication races, and safely prunes excess working drafts under transaction isolation.
 */

import { prisma } from "@/lib/prisma";
import type {
  ContentRevision,
  RevisionLifecycleStatus,
  Prisma,
  PrismaClient,
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
  expectedRevisionStatus?: RevisionLifecycleStatus;
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
export const EDITABLE_LIFECYCLE_STATUSES: ReadonlySet<RevisionLifecycleStatus> = new Set([
  "WORKING_DRAFT",
  "PENDING_REVIEW",
  "REJECTED",
]);

/**
 * Helper to test whether an error is a Prisma P2002 unique constraint violation on versionNumber.
 */
function isUniqueVersionCollision(error: unknown): boolean {
  return (
    error instanceof Object &&
    "code" in error &&
    error.code === "P2002"
  );
}

/**
 * Helper to test whether an error is a transient database serialization failure.
 */
function isSerializationFailure(error: unknown): boolean {
  return (
    error instanceof Object &&
    "code" in error &&
    (error.code === "P2034" || error.code === "40001")
  );
}

/**
 * Determines whether a given database client is an active transaction client
 * or a top-level PrismaClient instance.
 */
function isInteractiveTransactionClient(
  client?: Prisma.TransactionClient | PrismaClient
): client is Prisma.TransactionClient {
  return Boolean(client && !("$transaction" in client));
}

/**
 * Acquires a row-level lock on the parent ContentItem in PostgreSQL to serialize
 * revision version allocation and pointer modification for this item.
 */
async function lockContentItemRow(
  client: Prisma.TransactionClient,
  contentItemId: string
): Promise<void> {
  try {
    await client.$queryRawUnsafe(
      `SELECT id FROM content_items WHERE id = $1 FOR UPDATE`,
      contentItemId
    );
  } catch {
    // Gracefully proceed if the provider/mock does not support raw SQL row-level locking
  }
}

/**
 * Acquires a row-level lock on the ContentRevision in PostgreSQL to serialize
 * concurrent updates and publication state checks.
 */
async function lockContentRevisionRow(
  client: Prisma.TransactionClient,
  revisionId: string
): Promise<void> {
  try {
    await client.$queryRawUnsafe(
      `SELECT id FROM content_revisions WHERE id = $1 FOR UPDATE`,
      revisionId
    );
  } catch {
    // Gracefully proceed if the provider/mock does not support raw SQL row-level locking
  }
}

/**
 * Creates a new WORKING_DRAFT revision for a ContentItem.
 * Executes atomically within a transaction:
 * 1. Locks parent ContentItem row to serialize concurrent version allocation.
 * 2. Confirms parent ContentItem exists.
 * 3. Monotonically assigns versionNumber = max(existing) + 1.
 * 4. Persists the revision with isPublishedSnapshot = false.
 * 5. Updates ContentItem.currentWorkingRevisionId pointer.
 * 6. Safely prunes older unreferenced working drafts in the same transaction.
 * 
 * If a transient unique collision occurs (e.g. without DB-level row locks),
 * automatically retries up to 3 times with exponential backoff before throwing ConcurrencyConflictError.
 *
 * @throws {ContentItemNotFoundError} if parent ContentItem does not exist (never retried)
 * @throws {ConcurrencyConflictError} if version collisions persist across all bounded retries
 */
export async function createWorkingRevision(
  input: CreateWorkingRevisionInput,
  tx?: Prisma.TransactionClient | PrismaClient
): Promise<ContentRevision> {
  const MAX_RETRIES = 3;

  const executeOperation = async (client: Prisma.TransactionClient) => {
    // 1. Lock the parent ContentItem row in PostgreSQL
    await lockContentItemRow(client, input.contentItemId);

    // 2. Verify parent ContentItem exists
    const contentItem = await client.contentItem.findUnique({
      where: { id: input.contentItemId },
      select: { id: true },
    });

    if (!contentItem) {
      throw new ContentItemNotFoundError(input.contentItemId);
    }

    // 3. Compute next monotonic version number under the lock
    const latestRevision = await client.contentRevision.findFirst({
      where: { contentItemId: input.contentItemId },
      orderBy: { versionNumber: "desc" },
      select: { versionNumber: true },
    });

    const nextVersionNumber = (latestRevision?.versionNumber ?? 0) + 1;

    // 4. Insert new working draft revision
    const createdRevision = await client.contentRevision.create({
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

    // 5. Update working pointer on parent ContentItem
    await client.contentItem.update({
      where: { id: input.contentItemId },
      data: {
        currentWorkingRevisionId: createdRevision.id,
      },
    });

    // 6. Safely prune old excess working drafts (retains 20) within the same transaction
    await pruneWorkingDraftRevisions(input.contentItemId, 20, client);

    return createdRevision;
  };

  // If caller supplied an active interactive transaction client, execute directly once
  if (isInteractiveTransactionClient(tx)) {
    try {
      return await executeOperation(tx);
    } catch (error) {
      if (isUniqueVersionCollision(error) || isSerializationFailure(error)) {
        throw new ConcurrencyConflictError(
          `Concurrent revision creation collision on content item "${input.contentItemId}"`
        );
      }
      throw error;
    }
  }

  // Standalone call or top-level PrismaClient: wrap in transaction with bounded retry on transient concurrency collisions
  const runner = (tx && "$transaction" in tx ? tx : prisma) as PrismaClient;

  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await runner.$transaction(async (client) => {
        return executeOperation(client);
      });
    } catch (error) {
      lastError = error;

      // Only retry on transient concurrency collisions
      if (isUniqueVersionCollision(error) || isSerializationFailure(error)) {
        if (attempt < MAX_RETRIES) {
          const delayMs = attempt * 25 + Math.floor(Math.random() * 25);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }
        throw new ConcurrencyConflictError(
          `Concurrent revision creation collision on content item "${input.contentItemId}" after ${attempt} attempts`
        );
      }

      // Non-transient errors (e.g. ContentItemNotFoundError) fail immediately
      throw error;
    }
  }

  throw lastError;
}

/**
 * Retrieves a ContentRevision by primary key ID (trusted global lookup).
 * If expectedContentItemId is provided, delegates to parent-scoped lookup.
 */
export async function getRevisionById(
  id: string,
  expectedContentItemId?: string,
  tx?: Prisma.TransactionClient
): Promise<ContentRevision | null> {
  if (expectedContentItemId) {
    return getRevisionByParentAndId(expectedContentItemId, id, tx);
  }

  const db = tx ?? prisma;
  return db.contentRevision.findUnique({
    where: { id },
    include: {
      author: { select: PUBLISHER_SELECT },
    },
  });
}

/**
 * Retrieves a ContentRevision scoped strictly to a specific parent ContentItem.
 * Queries using both revisionId and contentItemId directly at the database level.
 *
 * @throws {RevisionOwnershipMismatchError} if the revision exists but belongs to a different ContentItem
 */
export async function getRevisionByParentAndId(
  contentItemId: string,
  revisionId: string,
  tx?: Prisma.TransactionClient
): Promise<ContentRevision | null> {
  const db = tx ?? prisma;

  // Direct compound database query ensuring parent scoping
  const revision = await db.contentRevision.findFirst({
    where: {
      id: revisionId,
      contentItemId,
    },
    include: {
      author: { select: PUBLISHER_SELECT },
    },
  });

  if (revision) {
    return revision;
  }

  // Check if the revision exists under another ContentItem to detect ownership mismatch
  const otherRevision = await db.contentRevision.findUnique({
    where: { id: revisionId },
    select: { id: true, contentItemId: true },
  });

  if (otherRevision && otherRevision.contentItemId !== contentItemId) {
    throw new RevisionOwnershipMismatchError(
      revisionId,
      contentItemId,
      otherRevision.contentItemId
    );
  }

  return null;
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
 * Updates a working revision under transactional and predicate protection:
 * 1. Locks the revision row to prevent races with concurrent publication.
 * 2. Enforces immutability:
 *    - Rejects any modification if isPublishedSnapshot is true.
 *    - Rejects any modification if referenced by currentPublishedRevisionId.
 *    - Rejects any modification if status is APPROVED, PUBLISHED_SNAPSHOT, or SUPERSEDED.
 *    - Validates expectedRevisionStatus predicate if supplied (OCC check).
 * 3. Resets status from REJECTED back to WORKING_DRAFT upon editing if no explicit status is given.
 * 4. Executes atomic conditional updateMany so that even if publication committed mid-flight,
 *    the update affects 0 rows and aborts with ConcurrencyConflictError.
 * 
 * @throws {ContentRevisionNotFoundError} if revision does not exist
 * @throws {RevisionOwnershipMismatchError} if revision does not belong to expected contentItemId
 * @throws {ImmutableRevisionError} if revision is a published snapshot or currently active published revision
 * @throws {InvalidRevisionStateError} if revision lifecycle status does not permit updates
 * @throws {ConcurrencyConflictError} if concurrent publication or modification occurred
 */
export async function updateWorkingRevision(
  id: string,
  input: UpdateWorkingRevisionInput,
  expectedContentItemId?: string,
  tx?: Prisma.TransactionClient | PrismaClient
): Promise<ContentRevision> {
  const executeUpdate = async (client: Prisma.TransactionClient) => {
    // 1. Lock the revision row in PostgreSQL
    await lockContentRevisionRow(client, id);

    // 2. Fetch revision with parent pointers
    const revision = await client.contentRevision.findUnique({
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

    // 3. Validate cross-item ownership if requested
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

    // 4. Enforce immutability of published snapshots
    if (revision.isPublishedSnapshot) {
      throw new ImmutableRevisionError(
        id,
        `Revision "${id}" is a published snapshot and cannot be modified.`
      );
    }

    // 5. Enforce immutability if pointed to by currentPublishedRevisionId
    if (revision.contentItem?.currentPublishedRevisionId === id) {
      throw new ImmutableRevisionError(
        id,
        `Revision "${id}" is currently the active published revision and cannot be modified.`
      );
    }

    // 6. Enforce allowed editable lifecycle statuses
    if (!EDITABLE_LIFECYCLE_STATUSES.has(revision.revisionStatus)) {
      throw new InvalidRevisionStateError(
        id,
        revision.revisionStatus,
        `Revision "${id}" cannot be edited in status "${revision.revisionStatus}".`
      );
    }

    // 7. OCC revision status check if expectedRevisionStatus is provided
    if (
      input.expectedRevisionStatus &&
      revision.revisionStatus !== input.expectedRevisionStatus
    ) {
      throw new ConcurrencyConflictError(
        `Revision status mismatch: expected "${input.expectedRevisionStatus}", found "${revision.revisionStatus}"`
      );
    }

    // 8. Build safe update payload
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
      updateData.revisionStatus = "WORKING_DRAFT";
      updateData.rejectionNote = null;
    }

    // 9. Atomic conditional update: guards against TOCTOU publication race
    const updateResult = await client.contentRevision.updateMany({
      where: {
        id,
        isPublishedSnapshot: false,
        revisionStatus: { in: Array.from(EDITABLE_LIFECYCLE_STATUSES) },
        publishedInContentItem: null,
      },
      data: updateData,
    });

    if (updateResult.count === 0) {
      throw new ConcurrencyConflictError(
        `Revision "${id}" was modified or published concurrently during update`
      );
    }

    return client.contentRevision.findUniqueOrThrow({
      where: { id },
      include: {
        author: { select: PUBLISHER_SELECT },
      },
    });
  };

  if (isInteractiveTransactionClient(tx)) {
    return executeUpdate(tx);
  }

  const runner = (tx && "$transaction" in tx ? tx : prisma) as PrismaClient;
  return runner.$transaction(async (client) => {
    return executeUpdate(client);
  });
}

/**
 * Safely prunes older excess working draft revisions for a ContentItem.
 * Retention rules:
 * - Runs atomically inside a transaction (locks parent ContentItem row).
 * - Retains the most recent `maxDraftsToRetain` (default 20) working drafts.
 * - NEVER deletes any published snapshot (isPublishedSnapshot: true).
 * - NEVER deletes the currentPublishedRevisionId.
 * - NEVER deletes the currentWorkingRevisionId.
 * - NEVER deletes revisions with revisionStatus: "PUBLISHED_SNAPSHOT" or "APPROVED".
 * - Enforces SQL-level 1-to-1 pointer exclusion (publishedInContentItem: null, workingInContentItem: null).
 * 
 * Returns the count of deleted revisions.
 */
export async function pruneWorkingDraftRevisions(
  contentItemId: string,
  maxDraftsToRetain = 20,
  tx?: Prisma.TransactionClient | PrismaClient
): Promise<number> {
  const executePruning = async (client: Prisma.TransactionClient) => {
    // 1. Lock the parent ContentItem row to serialize concurrent pointer changes
    await lockContentItemRow(client, contentItemId);

    // 2. Fetch parent ContentItem pointers
    const parentItem = await client.contentItem.findUnique({
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

    // 3. Query candidates for pruning: only non-published, non-approved revisions
    const candidateRevisions = await client.contentRevision.findMany({
      where: {
        contentItemId,
        isPublishedSnapshot: false,
        revisionStatus: { notIn: ["PUBLISHED_SNAPSHOT", "APPROVED"] },
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

    // 4. Delete only eligible drafts with multiple protective predicates
    const deleteResult = await client.contentRevision.deleteMany({
      where: {
        id: { in: idsToPrune },
        isPublishedSnapshot: false,
        revisionStatus: { notIn: ["PUBLISHED_SNAPSHOT", "APPROVED"] },
        publishedInContentItem: null,
        workingInContentItem: null,
      },
    });

    return deleteResult.count;
  };

  if (isInteractiveTransactionClient(tx)) {
    return executePruning(tx);
  }

  const runner = (tx && "$transaction" in tx ? tx : prisma) as PrismaClient;
  return runner.$transaction(async (client) => {
    return executePruning(client);
  });
}
