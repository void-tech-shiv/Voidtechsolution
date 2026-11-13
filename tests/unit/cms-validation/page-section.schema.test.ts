import { describe, it, expect } from "vitest";
import {
  sectionKeySchema,
  createPageSectionSchema,
  updatePageSectionSchema,
  pageSectionQuerySchema,
  MAX_PAGE_SECTION_CONTENT_LENGTH,
} from "@/validations/cms/page-section.schema";

describe("CMS Validation — PageSection Schemas", () => {
  describe("sectionKeySchema", () => {
    it("accepts valid lowercase kebab-case section keys", () => {
      expect(sectionKeySchema.parse("hero")).toBe("hero");
      expect(sectionKeySchema.parse("featured-services")).toBe(
        "featured-services"
      );
      expect(sectionKeySchema.parse("cta-banner-bottom")).toBe(
        "cta-banner-bottom"
      );
    });

    it("rejects uppercase letters and spaces", () => {
      expect(() => sectionKeySchema.parse("HeroSection")).toThrow();
      expect(() => sectionKeySchema.parse("featured services")).toThrow();
    });

    it("rejects single character keys", () => {
      expect(() => sectionKeySchema.parse("a")).toThrow();
    });
  });

  describe("createPageSectionSchema", () => {
    it("validates valid section creation payload", () => {
      const input = {
        key: "tech-stack-overview",
        pageSlug: "services",
        title: "Modern Full-Stack Capabilities",
        subtitle: "Enterprise architecture built for reliability and speed",
        content: "### Our Technology Stack\n\n- Next.js 15\n- PostgreSQL",
        orderIndex: 2,
        isActive: true,
      };
      const result = createPageSectionSchema.parse(input);
      expect(result.key).toBe("tech-stack-overview");
      expect(result.pageSlug).toBe("services");
      expect(result.title).toBe("Modern Full-Stack Capabilities");
      expect(result.orderIndex).toBe(2);
      expect(result.isActive).toBe(true);
    });

    it("enforces Markdown content length boundaries (up to 50,000 characters)", () => {
      // Exactly 50,000 characters passes
      const exactLimit = "x".repeat(MAX_PAGE_SECTION_CONTENT_LENGTH);
      const validInput = {
        key: "long-section",
        pageSlug: "about",
        title: "Company History",
        content: exactLimit,
      };
      expect(createPageSectionSchema.parse(validInput).content).toHaveLength(
        MAX_PAGE_SECTION_CONTENT_LENGTH
      );

      // 50,001 characters fails
      const overLimit = "x".repeat(MAX_PAGE_SECTION_CONTENT_LENGTH + 1);
      const invalidInput = {
        key: "too-long-section",
        pageSlug: "about",
        title: "Company History",
        content: overLimit,
      };
      expect(() => createPageSectionSchema.parse(invalidInput)).toThrow(
        /cannot exceed 50,000 characters/
      );
    });

    it("validates optional metadata object using safeJsonSchema", () => {
      const input = {
        key: "pricing-comparison",
        pageSlug: "pricing",
        title: "Compare Plans",
        content: "Detailed breakdown of plan features",
        metadata: {
          highlightedColumn: "pro",
          features: ["sla", "backups", "audit-logs"],
        },
      };
      const result = createPageSectionSchema.parse(input);
      expect(result.metadata).toEqual({
        highlightedColumn: "pro",
        features: ["sla", "backups", "audit-logs"],
      });
    });

    it("rejects prototype pollution in section metadata", () => {
      const input = {
        key: "pricing-comparison",
        pageSlug: "pricing",
        title: "Compare Plans",
        content: "Detailed breakdown",
        metadata: JSON.parse('{"valid": 1, "__proto__": {"malicious": true}}'),
      };
      expect(() => createPageSectionSchema.parse(input)).toThrow(
        "Illegal object key: __proto__"
      );
    });
  });

  describe("updatePageSectionSchema", () => {
    it("accepts valid partial update", () => {
      const input = {
        id: "clh7sec120000abc123456789",
        title: "Updated Title",
        orderIndex: 5,
        isActive: false,
      };
      const result = updatePageSectionSchema.parse(input);
      expect(result.id).toBe("clh7sec120000abc123456789");
      expect(result.title).toBe("Updated Title");
      expect(result.orderIndex).toBe(5);
      expect(result.isActive).toBe(false);
    });

    it("rejects negative orderIndex", () => {
      expect(() =>
        updatePageSectionSchema.parse({
          id: "clh7sec120000abc123456789",
          orderIndex: -1,
        })
      ).toThrow("Order index cannot be negative");
    });
  });

  describe("pageSectionQuerySchema", () => {
    it("handles pageSlug and boolean isActive filtering", () => {
      const result = pageSectionQuerySchema.parse({
        pageSlug: "home",
        isActive: "true",
      });
      expect(result.pageSlug).toBe("home");
      expect(result.isActive).toBe(true);
      expect(result.sortBy).toBe("orderIndex");
      expect(result.sortOrder).toBe("asc");
    });
  });
});
