/**
 * VOIDTECH SOLUTION — CMS Repository Error Taxonomy
 * 
 * Strongly-typed error classes for CMS data-access repositories.
 * All errors inherit from CmsRepositoryError and maintain standard .code and .name properties.
 */

export class CmsRepositoryError extends Error {
  readonly code: string;

  constructor(message: string, code = "CMS_REPOSITORY_ERROR") {
    super(message);
    this.name = new.target.name;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when a ContentItem lookup by ID or slug returns no record.
 */
export class ContentItemNotFoundError extends CmsRepositoryError {
  readonly identifier: string;

  constructor(identifier: string, message?: string) {
    super(
      message ?? `Content item not found: "${identifier}"`,
      "CONTENT_ITEM_NOT_FOUND"
    );
    this.identifier = identifier;
  }
}

/**
 * Thrown when a ContentRevision lookup by ID returns no record.
 */
export class ContentRevisionNotFoundError extends CmsRepositoryError {
  readonly identifier: string;

  constructor(identifier: string, message?: string) {
    super(
      message ?? `Content revision not found: "${identifier}"`,
      "CONTENT_REVISION_NOT_FOUND"
    );
    this.identifier = identifier;
  }
}

/**
 * Thrown when attempting to create or update a ContentItem with a slug that already exists.
 */
export class SlugAlreadyExistsError extends CmsRepositoryError {
  readonly slug: string;

  constructor(slug: string, message?: string) {
    super(message ?? `Slug already exists: "${slug}"`, "SLUG_ALREADY_EXISTS");
    this.slug = slug;
  }
}

/**
 * Thrown when an optimistic concurrency control (OCC) version check fails.
 */
export class ConcurrencyConflictError extends CmsRepositoryError {
  readonly expectedVersion?: number;
  readonly currentVersion?: number;

  constructor(
    message = "Concurrency conflict: ContentItem was modified concurrently",
    expectedVersion?: number,
    currentVersion?: number
  ) {
    super(message, "CONCURRENCY_CONFLICT");
    this.expectedVersion = expectedVersion;
    this.currentVersion = currentVersion;
  }
}

/**
 * Thrown when a revision is accessed or modified with an unexpected parent ContentItem ID.
 */
export class RevisionOwnershipMismatchError extends CmsRepositoryError {
  readonly revisionId: string;
  readonly contentItemId: string;
  readonly actualContentItemId?: string;

  constructor(
    revisionId: string,
    contentItemId: string,
    actualContentItemId?: string,
    message?: string
  ) {
    super(
      message ??
        `Revision "${revisionId}" does not belong to content item "${contentItemId}"${
          actualContentItemId ? ` (belongs to "${actualContentItemId}")` : ""
        }`,
      "REVISION_OWNERSHIP_MISMATCH"
    );
    this.revisionId = revisionId;
    this.contentItemId = contentItemId;
    this.actualContentItemId = actualContentItemId;
  }
}

/**
 * Thrown when an update or delete operation is attempted on an immutable revision
 * (such as a published snapshot or the current published revision).
 */
export class ImmutableRevisionError extends CmsRepositoryError {
  readonly revisionId: string;

  constructor(revisionId: string, message?: string) {
    super(
      message ?? `Revision "${revisionId}" is immutable and cannot be updated or deleted`,
      "IMMUTABLE_REVISION"
    );
    this.revisionId = revisionId;
  }
}

/**
 * Thrown when a revision operation is attempted in an invalid lifecycle status
 * (e.g. attempting to edit an APPROVED or SUPERSEDED revision).
 */
export class InvalidRevisionStateError extends CmsRepositoryError {
  readonly revisionId: string;
  readonly currentStatus?: string;

  constructor(revisionId: string, currentStatus?: string, message?: string) {
    super(
      message ??
        `Revision "${revisionId}" cannot be edited in lifecycle status: "${
          currentStatus ?? "UNKNOWN"
        }"`,
      "INVALID_REVISION_STATE"
    );
    this.revisionId = revisionId;
    this.currentStatus = currentStatus;
  }
}

/**
 * Thrown when deletion of a ContentItem is blocked by safety safeguards
 * (e.g. item is published, has immutable revision history, or is linked to domain records).
 */
export class ContentItemDeletionBlockedError extends CmsRepositoryError {
  readonly identifier: string;
  readonly reason: string;

  constructor(identifier: string, reason: string, message?: string) {
    super(
      message ?? `Deletion of content item "${identifier}" is blocked: ${reason}`,
      "CONTENT_ITEM_DELETION_BLOCKED"
    );
    this.identifier = identifier;
    this.reason = reason;
  }
}

/**
 * Thrown when a business precondition is not satisfied before publishing
 * (e.g. testimonial lacks verification or explicit client consent).
 */
export class PreconditionFailedError extends CmsRepositoryError {
  readonly precondition: string;

  constructor(precondition: string, message?: string) {
    super(
      message ?? `Precondition failed: ${precondition}`,
      "PRECONDITION_FAILED"
    );
    this.precondition = precondition;
  }
}

/**
 * Thrown when content payload or snapshotData fails schema validation.
 */
export class SchemaValidationError extends CmsRepositoryError {
  readonly details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message, "VALIDATION_FAILED");
    this.details = details;
  }
}

