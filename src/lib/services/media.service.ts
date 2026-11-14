import crypto from "crypto";
import path from "path";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { getStorageProvider } from "@/lib/storage";
import type { MediaAsset, StorageProviderType } from "@prisma/client";

/**
 * VOIDTECH SOLUTION — Media Asset Processing Service
 * 
 * Implements Safeguard 5: Hardened Media Security Pipeline:
 * 1. Hard-disables SVG uploads by default.
 * 2. Magic-byte MIME detection (never trust client Content-Type).
 * 3. EXIF metadata stripping and orientation normalization.
 * 4. Maximum dimension bounds (2560px) and WebP raster re-encoding.
 * 5. SHA-256 integrity hashing and cryptographically generated storage keys.
 * 6. Confinement to local filesystem / configured StorageProvider.
 */

export const MAX_MEDIA_SIZE_BYTES = 5 * 1024 * 1024; // 5.0 MB
export const MAX_DIMENSION_PX = 2560;

export interface ProcessMediaInput {
  buffer: Buffer;
  originalName: string;
  defaultAltText: string;
  caption?: string | null;
  uploaderId?: string | null;
}

export type SupportedRasterMime = "image/jpeg" | "image/png" | "image/webp";

/**
 * Detects whether the file payload is an SVG (by extension, MIME, or content sniffing).
 */
export function isSvgPayload(buffer: Buffer, originalName?: string, mimeType?: string): boolean {
  if (originalName && originalName.toLowerCase().endsWith(".svg")) {
    return true;
  }
  if (mimeType && mimeType.toLowerCase().includes("svg")) {
    return true;
  }
  const preview = buffer.slice(0, 500).toString("utf8").trim().toLowerCase();
  return preview.includes("<svg") || preview.includes("<?xml");
}

/**
 * Sniffs raw buffer magic bytes to determine true MIME type.
 */
export function sniffRasterMimeType(buffer: Buffer): SupportedRasterMime | null {
  if (buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }

  // WebP: RIFF (bytes 0-3) ... WEBP (bytes 8-11)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "image/webp";
  }

  return null;
}

/**
 * Computes SHA-256 cryptographic hash of buffer.
 */
export function computeBufferSha256(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

/**
 * Processes, sanitizes, optimizes, and persists an uploaded media asset.
 */
export async function processAndStoreMediaAsset(
  input: ProcessMediaInput
): Promise<MediaAsset> {
  const { buffer, originalName, defaultAltText, caption, uploaderId } = input;

  // 1. File size enforcement
  if (!buffer || buffer.length === 0) {
    throw new Error("Invalid upload: File buffer is empty.");
  }
  if (buffer.length > MAX_MEDIA_SIZE_BYTES) {
    throw new Error(
      `File size exceeds maximum permitted threshold of 5.0 MB (received ${(
        buffer.length /
        (1024 * 1024)
      ).toFixed(2)} MB).`
    );
  }

  // 2. SVG rejection by default (Safeguard 5)
  if (isSvgPayload(buffer, originalName)) {
    throw new Error(
      "SVG uploads are disabled by default in initial implementation. Permitted raster formats: JPEG, PNG, WebP."
    );
  }

  // 3. Magic-byte verification
  const detectedMime = sniffRasterMimeType(buffer);
  if (!detectedMime) {
    throw new Error(
      "Unsupported or disguised file format. Permitted raster formats: JPEG, PNG, WebP."
    );
  }

  // 4. Sharp raster optimization, EXIF stripping, and WebP transcoding
  const imagePipeline = sharp(buffer)
    .rotate() // Automatically orient based on EXIF before stripping
    .resize({
      width: MAX_DIMENSION_PX,
      height: MAX_DIMENSION_PX,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 85 });

  const processedBuffer = await imagePipeline.toBuffer();
  const metadata = await sharp(processedBuffer).metadata();

  const width = metadata.width ?? null;
  const height = metadata.height ?? null;
  const sha256Hash = computeBufferSha256(processedBuffer);

  // 5. Generate cryptographically safe storage key
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const randomUuid = crypto.randomUUID();
  const storageKey = `uploads/${year}/${month}/${randomUuid}.webp`;

  // 6. Write to StorageProvider
  const storage = getStorageProvider();
  const uploadResult = await storage.upload({
    buffer: processedBuffer,
    filename: `${randomUuid}.webp`,
    mimeType: "image/webp",
    storageKey,
  });

  // 7. Persist MediaAsset record in database
  const mediaAsset = await prisma.mediaAsset.create({
    data: {
      storageKey,
      provider: storage.type as StorageProviderType,
      filename: `${randomUuid}.webp`,
      originalName: path.basename(originalName),
      mimeType: "image/webp",
      sizeBytes: uploadResult.sizeBytes,
      width,
      height,
      sha256Hash,
      isSvg: false,
      publicUrl: uploadResult.publicUrl,
      defaultAltText: defaultAltText.trim(),
      caption: caption?.trim() || null,
      uploaderId: uploaderId || null,
    },
  });

  return mediaAsset;
}

/**
 * Permanently deletes a media asset and unlinks its storage file.
 */
export async function deleteMediaAsset(id: string): Promise<boolean> {
  const asset = await prisma.mediaAsset.findUnique({
    where: { id },
  });

  if (!asset) {
    return false;
  }

  const storage = getStorageProvider();
  await storage.delete(asset.storageKey);

  await prisma.mediaAsset.delete({
    where: { id },
  });

  return true;
}
