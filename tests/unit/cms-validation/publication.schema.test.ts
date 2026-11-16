import { describe, it, expect } from "vitest";
import {
  submitForReviewSchema,
  approveRevisionSchema,
  rejectRevisionSchema,
  publishRevisionSchema,
  archiveContentSchema,
  restoreContentSchema,
} from "@/validations/cms/publication.schema";

describe("CMS Validation — Publication Workflow Schemas", () => {
  const contentItemId = "clh7itm120000abc123456789";
  const revisionId = "clh7rev120000abc123456789";

  describe("submitForReviewSchema", () => {
    it("validates review submission with optional notes", () => {
      const res = submitForReviewSchema.parse({
        contentItemId,
        revisionId,
        notes: "Ready for copy review and image verification",
      });
      expect(res.contentItemId).toBe(contentItemId);
      expect(res.revisionId).toBe(revisionId);
      expect(res.notes).toBe("Ready for copy review and image verification");
    });

    it("rejects invalid contentItemId or revisionId", () => {
      expect(() =>
        submitForReviewSchema.parse({
          contentItemId: "short",
          revisionId,
        })
      ).toThrow();
    });

    it("STRICT MODE: Rejects attempts to pass unauthorized state fields", () => {
      expect(() =>
        submitForReviewSchema.parse({
          contentItemId,
          revisionId,
          revisionStatus: "APPROVED",
        })
      ).toThrow(/unrecognized_keys/);
    });
  });

  describe("approveRevisionSchema", () => {
    it("validates approval with optional notes", () => {
      const res = approveRevisionSchema.parse({
        contentItemId,
        revisionId,
        approvalNotes: "LGTM. All SEO requirements and tags satisfied.",
      });
      expect(res.approvalNotes).toBe(
        "LGTM. All SEO requirements and tags satisfied."
      );
    });

    it("STRICT MODE: Rejects attempts to inject internal reviewer ID", () => {
      expect(() =>
        approveRevisionSchema.parse({
          contentItemId,
          revisionId,
          reviewerId: "usr_attacker",
        })
      ).toThrow(/unrecognized_keys/);
    });
  });

  describe("rejectRevisionSchema", () => {
    it("validates rejection with mandatory feedback reason", () => {
      const res = rejectRevisionSchema.parse({
        contentItemId,
        revisionId,
        rejectionReason: "Missing required meta title and pricing breakdown.",
      });
      expect(res.rejectionReason).toBe(
        "Missing required meta title and pricing breakdown."
      );
    });

    it("MANDATORY FEEDBACK: Rejects missing or overly brief rejection reasons", () => {
      expect(() =>
        rejectRevisionSchema.parse({
          contentItemId,
          revisionId,
        })
      ).toThrow("A rejection reason must be provided");

      expect(() =>
        rejectRevisionSchema.parse({
          contentItemId,
          revisionId,
          rejectionReason: "No",
        })
      ).toThrow(
        "Rejection reason must be at least 5 characters explaining what needs revision"
      );
    });
  });

  describe("publishRevisionSchema (OCC Enforcement & Pointers Isolation)", () => {
    it("validates publication with mandatory expectedVersion for Optimistic Concurrency Control", () => {
      const res = publishRevisionSchema.parse({
        contentItemId,
        revisionId,
        expectedVersion: 4,
        changeSummary: "Promoted approved revision v4 to production",
      });
      expect(res.expectedVersion).toBe(4);
    });

    it("STRICT OCC: Rejects publication missing expectedVersion", () => {
      expect(() =>
        publishRevisionSchema.parse({
          contentItemId,
          revisionId,
        })
      ).toThrow(
        "expectedVersion is required for Optimistic Concurrency Control (OCC)"
      );
    });

    it("rejects non-positive expectedVersion", () => {
      expect(() =>
        publishRevisionSchema.parse({
          contentItemId,
          revisionId,
          expectedVersion: 0,
        })
      ).toThrow("Version must be greater than 0");
    });

    it("rejects expectedVersion exceeding 32-bit integer limit", () => {
      expect(() =>
        publishRevisionSchema.parse({
          contentItemId,
          revisionId,
          expectedVersion: 2147483648,
        })
      ).toThrow("Version exceeds maximum 32-bit integer boundary");
    });

    it("STRICT MODE: Rejects attempts to inject publishedById, publishedAt, or revision pointers", () => {
      const injectionAttempt = {
        contentItemId,
        revisionId,
        expectedVersion: 1,
        publishedById: "usr_attacker",
        publishedAt: new Date().toISOString(),
        currentPublishedRevisionId: revisionId,
      };
      expect(() => publishRevisionSchema.parse(injectionAttempt)).toThrow(
        /unrecognized_keys/
      );
    });
  });

  describe("archiveContentSchema & restoreContentSchema", () => {
    it("validates archive request with expectedVersion and reason", () => {
      const res = archiveContentSchema.parse({
        contentItemId,
        expectedVersion: 2,
        reason: "Discontinued legacy service offering",
      });
      expect(res.expectedVersion).toBe(2);
      expect(res.reason).toBe("Discontinued legacy service offering");
    });

    it("requires expectedVersion for archive request", () => {
      expect(() =>
        archiveContentSchema.parse({
          contentItemId,
        })
      ).toThrow("expectedVersion is required for OCC verification");
    });

    it("validates restore request with expectedVersion", () => {
      const res = restoreContentSchema.parse({
        contentItemId,
        expectedVersion: 3,
      });
      expect(res.expectedVersion).toBe(3);
    });

    it("requires expectedVersion for restore request", () => {
      expect(() =>
        restoreContentSchema.parse({
          contentItemId,
        })
      ).toThrow("expectedVersion is required for OCC verification");
    });

    it("STRICT MODE: Rejects injected archival metadata", () => {
      expect(() =>
        archiveContentSchema.parse({
          contentItemId,
          expectedVersion: 1,
          archivedById: "usr_attacker",
        })
      ).toThrow(/unrecognized_keys/);
    });
  });
});
