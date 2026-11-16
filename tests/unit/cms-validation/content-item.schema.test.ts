import { describe, it, expect } from "vitest";
import {
  createContentItemSchema,
  updateContentItemSchema,
  contentItemQuerySchema,
} from "@/validations/cms/content-item.schema";
import { ContentType, ContentPublicationStatus } from "@/types/cms";

describe("CMS Validation — ContentItem Schemas", () => {
  describe("createContentItemSchema", () => {
    it("validates valid content item creation payload", () => {
      const input = {
        contentType: ContentType.SERVICE,
        slug: "custom-cloud-solutions",
        publicationStatus: ContentPublicationStatus.DRAFT,
      };
      const result = createContentItemSchema.parse(input);
      expect(result.contentType).toBe(ContentType.SERVICE);
      expect(result.slug).toBe("custom-cloud-solutions");
      expect(result.publicationStatus).toBe(ContentPublicationStatus.DRAFT);
    });

    it("defaults publicationStatus to DRAFT when omitted", () => {
      const input = {
        contentType: ContentType.FAQ,
        slug: "frequently-asked-questions",
      };
      const result = createContentItemSchema.parse(input);
      expect(result.publicationStatus).toBe(ContentPublicationStatus.DRAFT);
    });

    it("rejects direct creation with PUBLISHED or ARCHIVED status", () => {
      expect(() =>
        createContentItemSchema.parse({
          contentType: ContentType.SERVICE,
          slug: "custom-cloud-solutions",
          publicationStatus: "PUBLISHED",
        })
      ).toThrow(/New content items must start in DRAFT status/);

      expect(() =>
        createContentItemSchema.parse({
          contentType: ContentType.SERVICE,
          slug: "custom-cloud-solutions",
          publicationStatus: "ARCHIVED",
        })
      ).toThrow(/New content items must start in DRAFT status/);
    });

    it("STRICT MODE: Rejects attempts to inject internal pointers on creation", () => {
      expect(() =>
        createContentItemSchema.parse({
          contentType: ContentType.SERVICE,
          slug: "custom-cloud-solutions",
          currentPublishedRevisionId: "clh7rev120000abc123456789",
        })
      ).toThrow(/unrecognized_keys/);
    });

    it("rejects invalid content types", () => {
      const input = {
        contentType: "INVALID_TYPE",
        slug: "invalid-content",
      };
      expect(() => createContentItemSchema.parse(input)).toThrow(
        /Invalid contentType/
      );
    });

    it("rejects invalid slug format (uppercase / special characters)", () => {
      const input = {
        contentType: ContentType.PAGE_SECTION,
        slug: "Homepage_Hero!",
      };
      expect(() => createContentItemSchema.parse(input)).toThrow();
    });
  });

  describe("updateContentItemSchema (Lifecycle Separation & OCC)", () => {
    it("accepts valid metadata update with optimistic concurrency control expectedVersion", () => {
      const input = {
        id: "clh7xyz120000abc123456789",
        slug: "updated-service-slug",
        expectedVersion: 3,
      };
      const result = updateContentItemSchema.parse(input);
      expect(result.id).toBe("clh7xyz120000abc123456789");
      expect(result.slug).toBe("updated-service-slug");
      expect(result.expectedVersion).toBe(3);
    });

    it("MANDATORY OCC: Rejects update when expectedVersion is missing", () => {
      const input = {
        id: "clh7xyz120000abc123456789",
        slug: "updated-service-slug",
      };
      expect(() => updateContentItemSchema.parse(input)).toThrow(
        "expectedVersion is required for Optimistic Concurrency Control (OCC)"
      );
    });

    it("rejects zero or negative expectedVersion", () => {
      expect(() =>
        updateContentItemSchema.parse({
          id: "clh7xyz120000abc123456789",
          expectedVersion: 0,
        })
      ).toThrow("Version must be greater than 0");

      expect(() =>
        updateContentItemSchema.parse({
          id: "clh7xyz120000abc123456789",
          expectedVersion: -1,
        })
      ).toThrow("Version must be greater than 0");
    });

    it("rejects expectedVersion exceeding 32-bit integer limit", () => {
      expect(() =>
        updateContentItemSchema.parse({
          id: "clh7xyz120000abc123456789",
          expectedVersion: 2147483648,
        })
      ).toThrow("Version exceeds maximum 32-bit integer boundary");
    });

    it("LIFECYCLE SEPARATION: Rejects generic update attempting to set publicationStatus to PUBLISHED", () => {
      const input = {
        id: "clh7xyz120000abc123456789",
        publicationStatus: "PUBLISHED",
        expectedVersion: 3,
      };
      expect(() => updateContentItemSchema.parse(input)).toThrow(
        /unrecognized_keys/
      );
    });

    it("LIFECYCLE SEPARATION: Rejects generic update attempting to set publicationStatus to ARCHIVED", () => {
      const input = {
        id: "clh7xyz120000abc123456789",
        publicationStatus: "ARCHIVED",
        expectedVersion: 3,
      };
      expect(() => updateContentItemSchema.parse(input)).toThrow(
        /unrecognized_keys/
      );
    });

    it("STRICT MODE: Rejects attempts to inject internal revision pointers", () => {
      const input = {
        id: "clh7xyz120000abc123456789",
        currentPublishedRevisionId: "clh7rev120000abc123456789",
        expectedVersion: 3,
      };
      expect(() => updateContentItemSchema.parse(input)).toThrow(
        /unrecognized_keys/
      );
    });

    it("rejects missing or malformed id", () => {
      expect(() =>
        updateContentItemSchema.parse({
          id: "short",
          slug: "valid-slug",
          expectedVersion: 1,
        })
      ).toThrow();
    });
  });

  describe("contentItemQuerySchema", () => {
    it("validates query parameters with pagination and filters", () => {
      const query = {
        contentType: ContentType.PORTFOLIO_PROJECT,
        publicationStatus: ContentPublicationStatus.PUBLISHED,
        page: "2",
        limit: "15",
        search: "enterprise",
        sortBy: "slug",
        sortOrder: "asc",
      };
      const result = contentItemQuerySchema.parse(query);
      expect(result.contentType).toBe(ContentType.PORTFOLIO_PROJECT);
      expect(result.publicationStatus).toBe(ContentPublicationStatus.PUBLISHED);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(15);
      expect(result.search).toBe("enterprise");
      expect(result.sortBy).toBe("slug");
      expect(result.sortOrder).toBe("asc");
    });

    it("applies defaults for query schema", () => {
      const result = contentItemQuerySchema.parse({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.sortBy).toBe("updatedAt");
      expect(result.sortOrder).toBe("desc");
      expect(result.search).toBeUndefined();
    });
  });
});
