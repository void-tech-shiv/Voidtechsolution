"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAdmin } from "@/server/actions/auth.actions";
import {
  verifyTestimonial,
  recordClientConsent,
  revokeClientConsent,
} from "@/server/repositories/testimonials.repo";
import { publishContentItem } from "@/server/services/cms/publishing.service";
import type { ActionResult } from "./lifecycle.actions";

/**
 * VOIDTECH SOLUTION — Testimonial Verification & Legal Consent Server Actions
 * 
 * Enforces Safeguard 4:
 * Single authoritative verification state and legal client consent before publication.
 */

export async function verifyTestimonialAction(
  testimonialId: string
): Promise<ActionResult<{ id: string; verificationStatus: string }>> {
  try {
    const current = await getCurrentAdmin();
    if (!current || !current.user.isActive) {
      return {
        success: false,
        error: { code: "UNAUTHENTICATED", message: "Active administrator session required." },
      };
    }

    if (current.user.role === "EDITOR") {
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "Editors cannot verify client testimonials." },
      };
    }

    const updated = await verifyTestimonial(testimonialId, current.user.id);

    return {
      success: true,
      data: {
        id: updated.id,
        verificationStatus: updated.verificationStatus,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to verify testimonial.";
    return {
      success: false,
      error: { code: "VERIFICATION_FAILED", message: msg },
    };
  }
}

export async function recordClientConsentAction(
  testimonialId: string,
  consentEvidenceUrl: string
): Promise<ActionResult<{ id: string; clientConsentStatus: string }>> {
  try {
    const current = await getCurrentAdmin();
    if (!current || !current.user.isActive) {
      return {
        success: false,
        error: { code: "UNAUTHENTICATED", message: "Active administrator session required." },
      };
    }

    if (current.user.role === "EDITOR") {
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "Editors cannot record client consent." },
      };
    }

    if (!consentEvidenceUrl || !consentEvidenceUrl.startsWith("http")) {
      return {
        success: false,
        error: { code: "INVALID_URL", message: "Valid consent documentation URL is required." },
      };
    }

    const updated = await recordClientConsent(testimonialId, consentEvidenceUrl);

    return {
      success: true,
      data: {
        id: updated.id,
        clientConsentStatus: updated.clientConsentStatus,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to record client consent.";
    return {
      success: false,
      error: { code: "CONSENT_RECORD_FAILED", message: msg },
    };
  }
}

export async function revokeTestimonialConsentAction(
  testimonialId: string
): Promise<ActionResult<{ id: string; clientConsentStatus: string; isActive: boolean }>> {
  try {
    const current = await getCurrentAdmin();
    if (!current || !current.user.isActive) {
      return {
        success: false,
        error: { code: "UNAUTHENTICATED", message: "Active administrator session required." },
      };
    }

    if (current.user.role === "EDITOR") {
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "Editors cannot revoke client consent." },
      };
    }

    const updated = await revokeClientConsent(testimonialId);

    try {
      revalidatePath("/");
      revalidatePath("/about");
    } catch {
      // Best effort
    }

    return {
      success: true,
      data: {
        id: updated.id,
        clientConsentStatus: updated.clientConsentStatus,
        isActive: updated.isActive,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to revoke client consent.";
    return {
      success: false,
      error: { code: "REVOKE_FAILED", message: msg },
    };
  }
}

export async function publishTestimonialAction(input: {
  contentItemId: string;
  revisionId: string;
  expectedVersion: number;
}): Promise<ActionResult<{ testimonialId: string; version: number }>> {
  try {
    const current = await getCurrentAdmin();
    if (!current || !current.user.isActive) {
      return {
        success: false,
        error: { code: "UNAUTHENTICATED", message: "Active administrator session required." },
      };
    }

    if (current.user.role === "EDITOR") {
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "Editors cannot publish testimonials." },
      };
    }

    const result = await publishContentItem({
      contentItemId: input.contentItemId,
      revisionId: input.revisionId,
      expectedVersion: input.expectedVersion,
      actor: current.user,
    });

    try {
      revalidatePath("/");
      revalidatePath("/about");
    } catch {
      // Best effort
    }

    return {
      success: true,
      data: {
        testimonialId: result.contentItemId,
        version: result.version,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to publish testimonial.";
    const code = err instanceof Object && "code" in err ? String(err.code) : "TESTIMONIAL_PUBLISH_FAILED";
    return {
      success: false,
      error: { code, message: msg },
    };
  }
}

