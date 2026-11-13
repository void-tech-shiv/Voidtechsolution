import { z } from "zod";
import { StorageProviderType } from "@/types/cms";
import {
  entityIdSchema,
  httpUrlSchema,
  paginationSchema,
  sortOrderSchema,
  searchQuerySchema,
} from "./common.schema";

/**
 * Strictly allowed raster image MIME types.
 * SVG (image/svg+xml) is explicitly excluded due to script execution / stored XSS risk.
 */
export const ALLOWED_MEDIA_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AllowedMediaMimeType = (typeof ALLOWED_MEDIA_MIME_TYPES)[number];

export const MAX_MEDIA_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_MEDIA_DIMENSION_PX = 8192; // 8K resolution boundary

/**
 * Validates that a string does not contain path traversal sequences (..),
 * null bytes, or illegal filesystem characters.
 */
export const safeStorageKeySchema = z
  .string({ required_error: "Storage key is required" })
  .trim()
  .min(3, "Storage key must be at least 3 characters")
  .max(500, "Storage key cannot exceed 500 characters")
  .regex(
    /^[a-zA-Z0-9_\-\.\/]+$/,
    "Storage key contains illegal characters. Only alphanumeric, dashes, underscores, periods, and forward slashes are allowed"
  )
  .refine(
    (key) => !key.includes("..") && !key.startsWith("/") && !key.startsWith("\\"),
    {
      message:
        "Storage key cannot contain directory traversal (..) or leading slashes",
    }
  );

/**
 * Validates safe filenames without path traversal or dangerous characters.
 */
export const safeFilenameSchema = z
  .string({ required_error: "Filename is required" })
  .trim()
  .min(1, "Filename must be at least 1 character")
  .max(255, "Filename cannot exceed 255 characters")
  .regex(
    /^[a-zA-Z0-9_\-\.]+$/,
    "Filename contains invalid characters. Only alphanumeric, dashes, underscores, and periods are permitted"
  )
  .refine(
    (name) => !name.includes("..") && !name.includes("/") && !name.includes("\\"),
    {
      message: "Filename cannot contain directory separators or path traversal (..)",
    }
  );

/**
 * SHA-256 hex digest schema (64 lowercase hexadecimal characters)
 */
export const sha256HexSchema = z
  .string()
  .trim()
  .length(64, "SHA-256 hash must be exactly 64 hex characters")
  .regex(/^[a-f0-9]{64}$/, "SHA-256 hash must be lowercase hexadecimal");

/**
 * Create Media Metadata Record Schema
 * 
 * Validates the metadata created when an asset is uploaded and stored.
 * Security Rules:
 * - strict() mode is enforced: uploadedById, id, timestamps cannot be client-injected.
 * - Server injects uploader identity and database IDs.
 */
export const createMediaMetadataSchema = z
  .object({
    filename: safeFilenameSchema,
    originalName: z
      .string()
      .trim()
      .min(1, "Original name must be at least 1 character")
      .max(255, "Original name cannot exceed 255 characters")
      .optional(),
    mimeType: z.enum(ALLOWED_MEDIA_MIME_TYPES, {
      errorMap: () => ({
        message:
          "Unsupported MIME type. Only image/jpeg, image/png, and image/webp are allowed. SVG is prohibited.",
      }),
    }),
    sizeBytes: z
      .number({ required_error: "File size in bytes is required" })
      .int("File size must be an integer")
      .positive("File size must be greater than 0")
      .max(
        MAX_MEDIA_FILE_SIZE_BYTES,
        `File size cannot exceed 10MB (${MAX_MEDIA_FILE_SIZE_BYTES} bytes)`
      ),
    width: z
      .number()
      .int("Width must be an integer")
      .positive("Width must be greater than 0")
      .max(MAX_MEDIA_DIMENSION_PX, `Width cannot exceed ${MAX_MEDIA_DIMENSION_PX}px`)
      .optional(),
    height: z
      .number()
      .int("Height must be an integer")
      .positive("Height must be greater than 0")
      .max(MAX_MEDIA_DIMENSION_PX, `Height cannot exceed ${MAX_MEDIA_DIMENSION_PX}px`)
      .optional(),
    sha256Hash: sha256HexSchema.optional(),
    defaultAltText: z
      .string({ required_error: "Default alt text is required for accessibility" })
      .trim()
      .min(1, "Alt text must be at least 1 character")
      .max(300, "Alt text cannot exceed 300 characters"),
    caption: z
      .string()
      .trim()
      .max(1000, "Caption cannot exceed 1000 characters")
      .optional(),
    provider: z
      .nativeEnum(StorageProviderType, {
        errorMap: () => ({ message: "Invalid storage provider type" }),
      })
      .default(StorageProviderType.LOCAL),
    storageKey: safeStorageKeySchema,
    publicUrl: httpUrlSchema,
  })
  .strict();

export type CreateMediaMetadataInput = z.infer<
  typeof createMediaMetadataSchema
>;

/**
 * Update Media Metadata Schema
 * 
 * Allows updating descriptive metadata (alt text, caption). Storage key,
 * provider, hash, physical file attributes, and ownership cannot be mutated here.
 */
export const updateMediaMetadataSchema = z
  .object({
    id: entityIdSchema,
    defaultAltText: z
      .string()
      .trim()
      .min(1, "Alt text must be at least 1 character")
      .max(300, "Alt text cannot exceed 300 characters")
      .optional(),
    caption: z
      .string()
      .trim()
      .max(1000, "Caption cannot exceed 1000 characters")
      .nullable()
      .optional(),
  })
  .strict();

export type UpdateMediaMetadataInput = z.infer<
  typeof updateMediaMetadataSchema
>;

/**
 * Allowed sort fields for media listings
 */
export const mediaAssetSortFields = [
  "createdAt",
  "updatedAt",
  "filename",
  "sizeBytes",
] as const;

/**
 * Media Query & Filter Schema
 */
export const mediaAssetQuerySchema = paginationSchema.extend({
  provider: z.nativeEnum(StorageProviderType).optional(),
  mimeType: z.enum(ALLOWED_MEDIA_MIME_TYPES).optional(),
  search: searchQuerySchema,
  sortBy: z.enum(mediaAssetSortFields).default("createdAt"),
  sortOrder: sortOrderSchema,
});

export type MediaAssetQueryInput = z.infer<typeof mediaAssetQuerySchema>;
