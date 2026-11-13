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

  describe("publishRevisionSchema (OCC Enforcement)", () => {
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
  });
});
