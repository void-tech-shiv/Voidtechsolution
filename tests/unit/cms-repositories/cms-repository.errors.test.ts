import { describe, it, expect } from "vitest";
import {
  CmsRepositoryError,
  ContentItemNotFoundError,
  ContentRevisionNotFoundError,
  SlugAlreadyExistsError,
  ConcurrencyConflictError,
  RevisionOwnershipMismatchError,
  ImmutableRevisionError,
  InvalidRevisionStateError,
} from "@/server/repositories/cms/cms-repository.errors";

describe("CMS Repository Errors Taxonomy", () => {
  it("CmsRepositoryError sets name, message, and default code", () => {
    const error = new CmsRepositoryError("Test base error");
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(CmsRepositoryError);
    expect(error.name).toBe("CmsRepositoryError");
    expect(error.code).toBe("CMS_REPOSITORY_ERROR");
    expect(error.message).toBe("Test base error");
  });

  it("ContentItemNotFoundError carries identifier and default message", () => {
    const error = new ContentItemNotFoundError("item-123");
    expect(error).toBeInstanceOf(CmsRepositoryError);
    expect(error.name).toBe("ContentItemNotFoundError");
    expect(error.code).toBe("CONTENT_ITEM_NOT_FOUND");
    expect(error.identifier).toBe("item-123");
    expect(error.message).toContain('item-123');

    const customError = new ContentItemNotFoundError("item-123", "Custom item not found");
    expect(customError.message).toBe("Custom item not found");
  });

  it("ContentRevisionNotFoundError carries identifier and default message", () => {
    const error = new ContentRevisionNotFoundError("rev-456");
    expect(error).toBeInstanceOf(CmsRepositoryError);
    expect(error.name).toBe("ContentRevisionNotFoundError");
    expect(error.code).toBe("CONTENT_REVISION_NOT_FOUND");
    expect(error.identifier).toBe("rev-456");
    expect(error.message).toContain('rev-456');
  });

  it("SlugAlreadyExistsError carries slug and specific code", () => {
    const error = new SlugAlreadyExistsError("web-development");
    expect(error).toBeInstanceOf(CmsRepositoryError);
    expect(error.name).toBe("SlugAlreadyExistsError");
    expect(error.code).toBe("SLUG_ALREADY_EXISTS");
    expect(error.slug).toBe("web-development");
    expect(error.message).toContain("web-development");
  });

  it("ConcurrencyConflictError carries version numbers and message", () => {
    const error = new ConcurrencyConflictError("Conflict occurred", 2, 3);
    expect(error).toBeInstanceOf(CmsRepositoryError);
    expect(error.name).toBe("ConcurrencyConflictError");
    expect(error.code).toBe("CONCURRENCY_CONFLICT");
    expect(error.expectedVersion).toBe(2);
    expect(error.currentVersion).toBe(3);
    expect(error.message).toBe("Conflict occurred");
  });

  it("RevisionOwnershipMismatchError records revision and content item IDs", () => {
    const error = new RevisionOwnershipMismatchError("rev-1", "item-A", "item-B");
    expect(error).toBeInstanceOf(CmsRepositoryError);
    expect(error.name).toBe("RevisionOwnershipMismatchError");
    expect(error.code).toBe("REVISION_OWNERSHIP_MISMATCH");
    expect(error.revisionId).toBe("rev-1");
    expect(error.contentItemId).toBe("item-A");
    expect(error.actualContentItemId).toBe("item-B");
    expect(error.message).toContain("item-A");
    expect(error.message).toContain("item-B");
  });

  it("ImmutableRevisionError records revisionId and protection message", () => {
    const error = new ImmutableRevisionError("rev-pub-1");
    expect(error).toBeInstanceOf(CmsRepositoryError);
    expect(error.name).toBe("ImmutableRevisionError");
    expect(error.code).toBe("IMMUTABLE_REVISION");
    expect(error.revisionId).toBe("rev-pub-1");
    expect(error.message).toContain("immutable");
  });

  it("InvalidRevisionStateError records current status and revisionId", () => {
    const error = new InvalidRevisionStateError("rev-app-1", "APPROVED");
    expect(error).toBeInstanceOf(CmsRepositoryError);
    expect(error.name).toBe("InvalidRevisionStateError");
    expect(error.code).toBe("INVALID_REVISION_STATE");
    expect(error.revisionId).toBe("rev-app-1");
    expect(error.currentStatus).toBe("APPROVED");
    expect(error.message).toContain("APPROVED");
  });
});
