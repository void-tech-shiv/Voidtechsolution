"use server";

import { getCurrentAdmin } from "@/server/actions/auth.actions";
import {
  processAndStoreMediaAsset,
  deleteMediaAsset,
} from "@/lib/services/media.service";
import type { ActionResult } from "./lifecycle.actions";
import type { MediaAsset } from "@prisma/client";

/**
 * VOIDTECH SOLUTION — Media Asset Server Actions
 * 
 * Enforces Safeguard 5: Hardened Media Pipeline:
 * - All admin roles can upload raster images (JPEG/PNG/WebP).
 * - SVG uploads are hard-disabled by default.
 * - Permanent deletion of media files is restricted strictly to SUPER_ADMIN.
 */

export async function uploadMediaAction(
  formData: FormData
): Promise<ActionResult<MediaAsset>> {
  try {
    const current = await getCurrentAdmin();
    if (!current || !current.user.isActive) {
      return {
        success: false,
        error: { code: "UNAUTHENTICATED", message: "Active administrator session required." },
      };
    }

    const file = formData.get("file") as File | null;
    const defaultAltText = formData.get("defaultAltText") as string | null;
    const caption = formData.get("caption") as string | null;

    if (!file) {
      return {
        success: false,
        error: { code: "BAD_REQUEST", message: "No file was provided for upload." },
      };
    }

    if (!defaultAltText || defaultAltText.trim().length < 3) {
      return {
        success: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "A meaningful defaultAltText of at least 3 characters is mandatory for accessibility.",
        },
      };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const asset = await processAndStoreMediaAsset({
      buffer,
      originalName: file.name,
      defaultAltText: defaultAltText.trim(),
      caption: caption || undefined,
      uploaderId: current.user.id,
    });

    return {
      success: true,
      data: asset,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Media upload failed.";
    return {
      success: false,
      error: { code: "UPLOAD_FAILED", message: msg },
    };
  }
}

export async function deleteMediaAction(
  mediaId: string
): Promise<ActionResult<{ id: string; deleted: boolean }>> {
  try {
    const current = await getCurrentAdmin();
    if (!current || !current.user.isActive) {
      return {
        success: false,
        error: { code: "UNAUTHENTICATED", message: "Active administrator session required." },
      };
    }

    // Safeguard: Only SUPER_ADMIN can permanently delete media files
    if (current.user.role !== "SUPER_ADMIN") {
      return {
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Media governance policy: Permanent deletion of media assets is restricted to SUPER_ADMIN.",
        },
      };
    }

    const deleted = await deleteMediaAsset(mediaId);

    return {
      success: true,
      data: { id: mediaId, deleted },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete media asset.";
    return {
      success: false,
      error: { code: "DELETE_FAILED", message: msg },
    };
  }
}

