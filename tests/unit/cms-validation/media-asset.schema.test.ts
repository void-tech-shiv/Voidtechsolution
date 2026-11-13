import { describe, it, expect } from "vitest";
import {
  createMediaMetadataSchema,
  updateMediaMetadataSchema,
  mediaAssetQuerySchema,
  safeStorageKeySchema,
  safeFilenameSchema,
  sha256HexSchema,
  ALLOWED_MEDIA_MIME_TYPES,
  MAX_MEDIA_FILE_SIZE_BYTES,
  MAX_MEDIA_DIMENSION_PX,
} from "@/validations/cms/media-asset.schema";
import { StorageProviderType } from "@/types/cms";

describe("CMS Validation — MediaAsset Schemas", () => {
  describe("MIME Type Policy & Security Constraints", () => {
    it("allows standard raster image MIME types (JPEG, PNG, WebP)", () => {
      expect(ALLOWED_MEDIA_MIME_TYPES).toContain("image/jpeg");
      expect(ALLOWED_MEDIA_MIME_TYPES).toContain("image/png");
      expect(ALLOWED_MEDIA_MIME_TYPES).toContain("image/webp");
    });

    it("STRICT SECURITY POLICY: Prohibits SVG (image/svg+xml) to prevent stored XSS", () => {
      const svgPayload = {
        filename: "vector-logo.svg",
        mimeType: "image/svg+xml",
        sizeBytes: 1024,
        defaultAltText: "Company Logo",
        storageKey: "uploads/2026/11/vector-logo.svg",
        publicUrl: "https://cdn.example.com/vector-logo.svg",
      };
      expect(() => createMediaMetadataSchema.parse(svgPayload)).toThrow(
        /Unsupported MIME type.*SVG is prohibited/
      );
    });

    it("rejects non-image MIME types (PDF, HTML, executable scripts)", () => {
      const pdfPayload = {
        filename: "document.pdf",
        mimeType: "application/pdf",
        sizeBytes: 1024,
        defaultAltText: "Document",
        storageKey: "uploads/document.pdf",
        publicUrl: "https://cdn.example.com/document.pdf",
      };
      expect(() => createMediaMetadataSchema.parse(pdfPayload)).toThrow(
        /Unsupported MIME type/
      );
    });
  });

  describe("File Size & Resolution Boundaries", () => {
    const validBase = {
      filename: "hero-image.webp",
      mimeType: "image/webp",
      defaultAltText: "Modern Cloud Architecture",
      storageKey: "uploads/2026/11/hero-image.webp",
      publicUrl: "https://cdn.example.com/hero-image.webp",
    };

    it("accepts file sizes up to exactly 10MB", () => {
      expect(
        createMediaMetadataSchema.parse({
          ...validBase,
          sizeBytes: MAX_MEDIA_FILE_SIZE_BYTES,
        }).sizeBytes
      ).toBe(MAX_MEDIA_FILE_SIZE_BYTES);
    });

    it("rejects file sizes exceeding 10MB by even 1 byte", () => {
      expect(() =>
        createMediaMetadataSchema.parse({
          ...validBase,
          sizeBytes: MAX_MEDIA_FILE_SIZE_BYTES + 1,
        })
      ).toThrow(/File size cannot exceed 10MB/);
    });

    it("rejects non-positive file sizes (0 or negative)", () => {
      expect(() =>
        createMediaMetadataSchema.parse({
          ...validBase,
          sizeBytes: 0,
        })
      ).toThrow("File size must be greater than 0");
    });

    it("enforces dimension limits (up to 8192px)", () => {
      expect(
        createMediaMetadataSchema.parse({
          ...validBase,
          sizeBytes: 500000,
          width: MAX_MEDIA_DIMENSION_PX,
          height: MAX_MEDIA_DIMENSION_PX,
        }).width
      ).toBe(MAX_MEDIA_DIMENSION_PX);

      expect(() =>
        createMediaMetadataSchema.parse({
          ...validBase,
          sizeBytes: 500000,
          width: MAX_MEDIA_DIMENSION_PX + 1,
        })
      ).toThrow(/Width cannot exceed 8192px/);
    });
  });

  describe("Path Traversal & Storage Security", () => {
    it("safeStorageKeySchema rejects directory traversal (..) and leading slashes", () => {
      expect(() => safeStorageKeySchema.parse("../etc/passwd")).toThrow(
        "directory traversal"
      );
      expect(() => safeStorageKeySchema.parse("/root/uploads/image.png")).toThrow(
        "leading slashes"
      );
      expect(() => safeStorageKeySchema.parse("\\windows\\system32")).toThrow(
        "leading slashes"
      );
      expect(() => safeStorageKeySchema.parse("uploads/../../secret.png")).toThrow(
        "directory traversal"
      );
    });

    it("safeStorageKeySchema accepts safe nested paths", () => {
      expect(
        safeStorageKeySchema.parse("media/2026/11/banner-cloud-9.webp")
      ).toBe("media/2026/11/banner-cloud-9.webp");
    });

    it("safeFilenameSchema rejects path separators and traversal", () => {
      expect(() => safeFilenameSchema.parse("../malicious.png")).toThrow();
      expect(() => safeFilenameSchema.parse("dir/file.png")).toThrow();
      expect(() => safeFilenameSchema.parse("dir\\file.png")).toThrow();
      expect(safeFilenameSchema.parse("clean-asset_1.png")).toBe(
        "clean-asset_1.png"
      );
    });
  });

  describe("SHA-256 Checksum Validation", () => {
    it("accepts valid 64-character lowercase hex digest", () => {
      const validHex =
        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
      expect(sha256HexSchema.parse(validHex)).toBe(validHex);
    });

    it("rejects invalid hash formats (uppercase, wrong length, non-hex)", () => {
      expect(() => sha256HexSchema.parse("E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855")).toThrow();
      expect(() => sha256HexSchema.parse("abc123")).toThrow();
      expect(() => sha256HexSchema.parse("g".repeat(64))).toThrow();
    });
  });

  describe("updateMediaMetadataSchema & Query", () => {
    it("validates updating alt text and caption", () => {
      const update = {
        id: "clh7med120000abc123456789",
        defaultAltText: "Updated Alt Description",
        caption: "Hero section illustration for marketing campaign",
      };
      const res = updateMediaMetadataSchema.parse(update);
      expect(res.defaultAltText).toBe("Updated Alt Description");
      expect(res.caption).toBe(
        "Hero section illustration for marketing campaign"
      );
    });

    it("validates query with provider and mimeType filters", () => {
      const query = {
        provider: StorageProviderType.LOCAL,
        mimeType: "image/webp",
        page: "1",
        limit: "25",
        sortBy: "sizeBytes",
        sortOrder: "asc",
      };
      const res = mediaAssetQuerySchema.parse(query);
      expect(res.provider).toBe(StorageProviderType.LOCAL);
      expect(res.mimeType).toBe("image/webp");
      expect(res.limit).toBe(25);
    });
  });
});
