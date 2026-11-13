import { describe, it, expect } from "vitest";
import {
  createWorkingRevisionSchema,
  updateWorkingRevisionSchema,
  revisionQuerySchema,
} from "@/validations/cms/content-revision.schema";
import { RevisionLifecycleStatus } from "@/types/cms";

describe("CMS Validation — ContentRevision Schemas", () => {
  describe("createWorkingRevisionSchema", () => {
    it("accepts valid working revision payload", () => {
      const input = {
        contentItemId: "clh7xyz120000abc123456789",
        title: "Cloud Migration Architecture Guide",
        snapshotData: {
          headline: "Accelerate your migration to AWS and Azure",
          features: ["Automated CI/CD", "Kubernetes cluster provisioning"],
          pricingTier: "Scale",
        },
        changeSummary: "Added Kubernetes cluster deployment features",
      };
      const result = createWorkingRevisionSchema.parse(input);
      expect(result.contentItemId).toBe("clh7xyz120000abc123456789");
      expect(result.title).toBe("Cloud Migration Architecture Guide");
      expect(result.changeSummary).toBe(
        "Added Kubernetes cluster deployment features"
      );
    });

    it("rejects empty or excessively long titles", () => {
      expect(() =>
        createWorkingRevisionSchema.parse({
          contentItemId: "clh7xyz120000abc123456789",
          title: "",
          snapshotData: { key: "value" },
        })
      ).toThrow("Revision title must be at least 1 character");

      expect(() =>
        createWorkingRevisionSchema.parse({
          contentItemId: "clh7xyz120000abc123456789",
          title: "a".repeat(201),
          snapshotData: { key: "value" },
        })
      ).toThrow("Revision title cannot exceed 200 characters");
    });

    it("rejects change summaries longer than 500 characters", () => {
      expect(() =>
        createWorkingRevisionSchema.parse({
          contentItemId: "clh7xyz120000abc123456789",
          title: "Valid Title",
          snapshotData: { key: "value" },
          changeSummary: "a".repeat(501),
        })
      ).toThrow("Change summary cannot exceed 500 characters");
    });

    it("strictly enforces safeJsonSchema rules on snapshotData (rejects prototype pollution)", () => {
      const maliciousPayload = {
        contentItemId: "clh7xyz120000abc123456789",
        title: "Malicious Revision",
        snapshotData: JSON.parse(
          '{"validKey": "validVal", "__proto__": {"injected": true}}'
        ),
      };
      expect(() =>
        createWorkingRevisionSchema.parse(maliciousPayload)
      ).toThrow("Illegal object key: __proto__");
    });
  });

  describe("updateWorkingRevisionSchema", () => {
    it("accepts valid partial revision update", () => {
      const input = {
        id: "clh7rev120000abc123456789",
        title: "Refined Cloud Migration Guide",
        changeSummary: "Corrected typos in feature bullet points",
      };
      const result = updateWorkingRevisionSchema.parse(input);
      expect(result.id).toBe("clh7rev120000abc123456789");
      expect(result.title).toBe("Refined Cloud Migration Guide");
      expect(result.snapshotData).toBeUndefined();
    });

    it("rejects invalid entity ID for revision", () => {
      expect(() =>
        updateWorkingRevisionSchema.parse({
          id: "short",
          title: "New Title",
        })
      ).toThrow();
    });
  });

  describe("revisionQuerySchema", () => {
    it("validates revision query filters", () => {
      const query = {
        contentItemId: "clh7xyz120000abc123456789",
        revisionStatus: RevisionLifecycleStatus.PENDING_REVIEW,
        isPublishedSnapshot: "true",
        page: "1",
        limit: "10",
        sortBy: "versionNumber",
        sortOrder: "desc",
      };
      const result = revisionQuerySchema.parse(query);
      expect(result.contentItemId).toBe("clh7xyz120000abc123456789");
      expect(result.revisionStatus).toBe(RevisionLifecycleStatus.PENDING_REVIEW);
      expect(result.isPublishedSnapshot).toBe(true);
      expect(result.sortBy).toBe("versionNumber");
    });

    it("parses boolean string flags correctly", () => {
      expect(
        revisionQuerySchema.parse({ isPublishedSnapshot: "false" })
          .isPublishedSnapshot
      ).toBe(false);
      expect(
        revisionQuerySchema.parse({ isPublishedSnapshot: true })
          .isPublishedSnapshot
      ).toBe(true);
      expect(
        revisionQuerySchema.parse({}).isPublishedSnapshot
      ).toBeUndefined();
    });
  });
});
