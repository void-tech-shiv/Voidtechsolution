import { describe, it, expect } from "vitest";
import {
  slugSchema,
  entityIdSchema,
  httpUrlSchema,
  optionalHttpUrlSchema,
  paginationSchema,
  sortOrderSchema,
  searchQuerySchema,
  dateRangeSchema,
  safeJsonSchema,
} from "@/validations/cms/common.schema";

describe("CMS Validation — Common Schema Primitives", () => {
  describe("slugSchema", () => {
    it("accepts valid lowercase kebab-case slugs", () => {
      expect(slugSchema.parse("web-development")).toBe("web-development");
      expect(slugSchema.parse("service-123-fast")).toBe("service-123-fast");
      expect(slugSchema.parse("seo")).toBe("seo");
    });

    it("rejects uppercase letters", () => {
      expect(() => slugSchema.parse("Web-Development")).toThrow();
      expect(() => slugSchema.parse("SEO-SERVICE")).toThrow();
    });

    it("rejects consecutive hyphens, leading hyphens, or trailing hyphens", () => {
      expect(() => slugSchema.parse("-leading-slug")).toThrow();
      expect(() => slugSchema.parse("trailing-slug-")).toThrow();
      expect(() => slugSchema.parse("double--hyphen")).toThrow();
    });

    it("rejects spaces and special characters", () => {
      expect(() => slugSchema.parse("web development")).toThrow();
      expect(() => slugSchema.parse("slug_with_underscore")).toThrow();
      expect(() => slugSchema.parse("slug$special")).toThrow();
    });

    it("enforces length constraints (3 to 100 chars)", () => {
      expect(() => slugSchema.parse("ab")).toThrow();
      expect(slugSchema.parse("abc")).toBe("abc");
      const valid100 = "a".repeat(100);
      expect(slugSchema.parse(valid100)).toBe(valid100);
      const invalid101 = "a".repeat(101);
      expect(() => slugSchema.parse(invalid101)).toThrow();
    });
  });

  describe("entityIdSchema", () => {
    it("accepts valid CUID and alphanumeric entity IDs", () => {
      const cuid = "clh7xyz120000abc123456789";
      expect(entityIdSchema.parse(cuid)).toBe(cuid);
      expect(entityIdSchema.parse("cm12345678")).toBe("cm12345678");
    });

    it("rejects IDs shorter than 10 characters", () => {
      expect(() => entityIdSchema.parse("short123")).toThrow();
    });

    it("rejects IDs with illegal characters or spaces", () => {
      expect(() => entityIdSchema.parse("cm12345678!@#")).toThrow();
      expect(() => entityIdSchema.parse("cm12345 67890")).toThrow();
      expect(() => entityIdSchema.parse("cm12345/67890")).toThrow();
    });
  });

  describe("httpUrlSchema & optionalHttpUrlSchema", () => {
    it("accepts valid https and http URLs", () => {
      expect(httpUrlSchema.parse("https://voidtech.com/image.png")).toBe(
        "https://voidtech.com/image.png"
      );
      expect(httpUrlSchema.parse("http://localhost:3000/assets/logo.png")).toBe(
        "http://localhost:3000/assets/logo.png"
      );
    });

    it("rejects non-http protocols (javascript:, data:, ftp:)", () => {
      expect(() =>
        httpUrlSchema.parse("javascript:alert('xss')")
      ).toThrow();
      expect(() =>
        httpUrlSchema.parse("data:image/png;base64,iVBORw0KGgo=")
      ).toThrow();
      expect(() => httpUrlSchema.parse("ftp://example.com/file")).toThrow();
    });

    it("handles optional URLs correctly", () => {
      expect(optionalHttpUrlSchema.parse(undefined)).toBeUndefined();
      expect(
        optionalHttpUrlSchema.parse("https://example.com/avatar.jpg")
      ).toBe("https://example.com/avatar.jpg");
    });
  });

  describe("paginationSchema & sortOrderSchema", () => {
    it("provides defaults when values are omitted", () => {
      const res = paginationSchema.parse({});
      expect(res.page).toBe(1);
      expect(res.limit).toBe(20);
    });

    it("coerces string values from query parameters to numbers", () => {
      const res = paginationSchema.parse({ page: "3", limit: "50" });
      expect(res.page).toBe(3);
      expect(res.limit).toBe(50);
    });

    it("rejects limit greater than 100 or less than 1", () => {
      expect(() => paginationSchema.parse({ limit: 101 })).toThrow();
      expect(() => paginationSchema.parse({ limit: 0 })).toThrow();
      expect(() => paginationSchema.parse({ page: 0 })).toThrow();
    });

    it("validates sortOrder", () => {
      expect(sortOrderSchema.parse("asc")).toBe("asc");
      expect(sortOrderSchema.parse("desc")).toBe("desc");
      expect(sortOrderSchema.parse(undefined)).toBe("desc");
      expect(() => sortOrderSchema.parse("invalid")).toThrow();
    });
  });

  describe("searchQuerySchema", () => {
    it("trims search query and accepts valid strings", () => {
      expect(searchQuerySchema.parse("  digital marketing  ")).toBe(
        "digital marketing"
      );
      expect(searchQuerySchema.parse(undefined)).toBeUndefined();
    });

    it("rejects queries exceeding 100 characters", () => {
      expect(() => searchQuerySchema.parse("a".repeat(101))).toThrow();
    });
  });

  describe("dateRangeSchema", () => {
    it("accepts valid date range where to >= from", () => {
      const from = new Date("2026-01-01T00:00:00Z");
      const to = new Date("2026-01-02T00:00:00Z");
      const res = dateRangeSchema.parse({ from, to });
      expect(res.from).toEqual(from);
      expect(res.to).toEqual(to);
    });

    it("rejects invalid date range where to < from", () => {
      const from = new Date("2026-01-05T00:00:00Z");
      const to = new Date("2026-01-01T00:00:00Z");
      expect(() => dateRangeSchema.parse({ from, to })).toThrow(
        "End date (to) must be greater than or equal to start date (from)"
      );
    });
  });

  describe("safeJsonSchema (Prototype-Pollution Resistance & Depth Bounding)", () => {
    it("accepts valid JSON primitives, arrays, and nested objects", () => {
      const valid = {
        title: "Cloud Infrastructure",
        tags: ["devops", "cloud", "aws"],
        metrics: {
          uptime: 99.9,
          deployments: 42,
          features: {
            multiRegion: true,
            tier: "enterprise",
          },
        },
      };
      expect(safeJsonSchema.parse(valid)).toEqual(valid);
    });

    it("strictly rejects prototype pollution attempts (__proto__)", () => {
      const malicious = JSON.parse(
        '{"title": "Malicious", "__proto__": {"isAdmin": true}}'
      );
      expect(() => safeJsonSchema.parse(malicious)).toThrow(
        "Illegal object key: __proto__"
      );
    });

    it("strictly rejects constructor and prototype keys", () => {
      expect(() =>
        safeJsonSchema.parse({ constructor: { test: true } })
      ).toThrow("Illegal object key: constructor");
      expect(() =>
        safeJsonSchema.parse({ prototype: { test: true } })
      ).toThrow("Illegal object key: prototype");
    });

    it("strictly rejects objects exceeding maximum nesting depth (depth > 6)", () => {
      // 7 levels of nesting
      const deepObject = {
        l1: {
          l2: {
            l3: {
              l4: {
                l5: {
                  l6: {
                    l7: "too deep",
                  },
                },
              },
            },
          },
        },
      };
      expect(() => safeJsonSchema.parse(deepObject)).toThrow(
        "exceeds maximum allowed depth of 6"
      );
    });

    it("rejects arrays exceeding 500 items", () => {
      const hugeArray = new Array(501).fill("item");
      expect(() => safeJsonSchema.parse(hugeArray)).toThrow(
        "Array length exceeds maximum limit of 500 items"
      );
    });

    it("rejects objects with more than 200 keys", () => {
      const hugeObject: Record<string, string> = {};
      for (let i = 0; i < 201; i++) {
        hugeObject[`key_${i}`] = "value";
      }
      expect(() => safeJsonSchema.parse(hugeObject)).toThrow(
        "Object key count exceeds maximum limit of 200 keys"
      );
    });
  });
});
