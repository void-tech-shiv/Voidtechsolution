import { describe, it, expect, vi, beforeEach } from "vitest";
import sharp from "sharp";
import {
  isSvgPayload,
  sniffRasterMimeType,
  processAndStoreMediaAsset,
  MAX_MEDIA_SIZE_BYTES,
} from "@/lib/services/media.service";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    mediaAsset: {
      create: vi.fn(async ({ data }) => ({
        id: "media_test_1",
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("@/lib/storage", () => ({
  getStorageProvider: () => ({
    type: "LOCAL",
    upload: vi.fn(async ({ buffer, storageKey }) => ({
      storageKey,
      publicUrl: `/uploads/${storageKey}`,
      sizeBytes: buffer.length,
      mimeType: "image/webp",
    })),
    delete: vi.fn(async () => true),
  }),
}));

describe("Task 10.1.10: Media Processing Pipeline & Security Constraints", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("detects SVG payloads via filename or XML content", () => {
    const svgBuffer = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><circle /></svg>');
    const xmlBuffer = Buffer.from('<?xml version="1.0"?><svg></svg>');
    const textBuffer = Buffer.from("plain text");

    expect(isSvgPayload(svgBuffer, "icon.svg")).toBe(true);
    expect(isSvgPayload(xmlBuffer, "vector.xml")).toBe(true);
    expect(isSvgPayload(textBuffer, "logo.svg")).toBe(true);
    expect(isSvgPayload(textBuffer, "photo.png")).toBe(false);
  });

  it("sniffs magic bytes correctly for PNG, JPEG, and WebP", async () => {
    // Generate valid mini PNG with sharp
    const pngBuffer = await sharp({
      create: { width: 10, height: 10, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 1 } },
    })
      .png()
      .toBuffer();

    expect(sniffRasterMimeType(pngBuffer)).toBe("image/png");

    // Generate valid mini JPEG
    const jpegBuffer = await sharp({
      create: { width: 10, height: 10, channels: 3, background: { r: 0, g: 255, b: 0 } },
    })
      .jpeg()
      .toBuffer();

    expect(sniffRasterMimeType(jpegBuffer)).toBe("image/jpeg");

    // Generate valid mini WebP
    const webpBuffer = await sharp({
      create: { width: 10, height: 10, channels: 3, background: { r: 0, g: 0, b: 255 } },
    })
      .webp()
      .toBuffer();

    expect(sniffRasterMimeType(webpBuffer)).toBe("image/webp");

    // Disguised binary / plain text
    const textBuffer = Buffer.from("hello world fake image");
    expect(sniffRasterMimeType(textBuffer)).toBeNull();
  });

  it("strictly rejects SVG uploads by default", async () => {
    const svgBuffer = Buffer.from('<svg><text>hello</text></svg>');
    await expect(
      processAndStoreMediaAsset({
        buffer: svgBuffer,
        originalName: "malicious.svg",
        defaultAltText: "Decorative vector",
      })
    ).rejects.toThrow(/SVG uploads are disabled by default/);
  });

  it("strictly rejects disguised non-image files with .png extension", async () => {
    const fakeBuffer = Buffer.from("MZ disguised executable binary");
    await expect(
      processAndStoreMediaAsset({
        buffer: fakeBuffer,
        originalName: "payload.png",
        defaultAltText: "Test image",
      })
    ).rejects.toThrow(/Unsupported or disguised file format/);
  });

  it("strictly rejects files exceeding 5.0 MB", async () => {
    const oversizedBuffer = Buffer.alloc(MAX_MEDIA_SIZE_BYTES + 1024);
    await expect(
      processAndStoreMediaAsset({
        buffer: oversizedBuffer,
        originalName: "huge.jpg",
        defaultAltText: "Large photo",
      })
    ).rejects.toThrow(/File size exceeds maximum permitted threshold/);
  });

  it("processes valid PNG, converts to optimized WebP, strips metadata, and persists MediaAsset record", async () => {
    const pngBuffer = await sharp({
      create: { width: 50, height: 50, channels: 4, background: { r: 120, g: 50, b: 200, alpha: 1 } },
    })
      .png()
      .toBuffer();

    const result = await processAndStoreMediaAsset({
      buffer: pngBuffer,
      originalName: "banner-hero.png",
      defaultAltText: "Obsidian futuristic technology banner",
      caption: "Agency promotional graphic",
      uploaderId: "admin_123",
    });

    expect(result.id).toBe("media_test_1");
    expect(result.mimeType).toBe("image/webp");
    expect(result.isSvg).toBe(false);
    expect(result.width).toBe(50);
    expect(result.height).toBe(50);
    expect(result.sha256Hash).toHaveLength(64);
    expect(result.publicUrl).toContain("/uploads/");
    expect(result.defaultAltText).toBe("Obsidian futuristic technology banner");

    expect((prisma as any).mediaAsset.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          mimeType: "image/webp",
          originalName: "banner-hero.png",
          uploaderId: "admin_123",
        }),
      })
    );
  });
});
