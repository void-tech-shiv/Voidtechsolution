"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAdmin } from "@/server/actions/auth.actions";
import { publishContentItem } from "@/server/services/cms/publishing.service";
import { createWorkingRevision } from "@/server/repositories/cms/content-revision.repo";
import { pricingPackageSnapshotSchema } from "@/validations/cms";
import type { ActionResult } from "./lifecycle.actions";
import { ServiceCategory } from "@prisma/client";

/**
 * VOIDTECH SOLUTION — CMS Commercial Pricing Server Actions
 * 
 * Enforces Decision 7 & Safeguard 3:
 * - Pricing drafting is open to all editors.
 * - Pricing publication and live rate modifications in INR are strictly restricted
 *   to SUPER_ADMIN and ADMIN roles.
 */

export interface SavePricingDraftInput {
  contentItemId: string;
  name: string;
  category: ServiceCategory;
  priceInr: number;
  currency?: "INR";
  isStartingPrice?: boolean;
  billingPeriod?: string | null;
  features: string[];
  popular?: boolean;
  orderIndex?: number;
  changeSummary?: string;
}

export async function savePricingDraftAction(
  input: SavePricingDraftInput
): Promise<ActionResult<{ revisionId: string; versionNumber: number }>> {
  try {
    const current = await getCurrentAdmin();
    if (!current || !current.user.isActive) {
      return {
        success: false,
        error: { code: "UNAUTHENTICATED", message: "Active administrator session required." },
      };
    }

    const validatedData = pricingPackageSnapshotSchema.parse({
      name: input.name,
      category: input.category,
      priceInr: input.priceInr,
      currency: input.currency ?? "INR",
      isStartingPrice: input.isStartingPrice ?? true,
      billingPeriod: input.billingPeriod ?? null,
      features: input.features,
      popular: input.popular ?? false,
      orderIndex: input.orderIndex ?? 0,
    });

    const revision = await createWorkingRevision({
      contentItemId: input.contentItemId,
      title: `Pricing: ${validatedData.name} (₹${validatedData.priceInr})`,
      snapshotData: validatedData,
      authorId: current.user.id,
      authorName: current.user.name,
      changeSummary: input.changeSummary || "Updated commercial pricing package",
    });

    return {
      success: true,
      data: {
        revisionId: revision.id,
        versionNumber: revision.versionNumber,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to save pricing draft.";
    return {
      success: false,
      error: { code: "PRICING_DRAFT_FAILED", message: msg },
    };
  }
}

export async function publishPricingAction(input: {
  contentItemId: string;
  revisionId: string;
  expectedVersion: number;
  changeSummary?: string;
}): Promise<ActionResult<{ packageId: string; version: number }>> {
  try {
    const current = await getCurrentAdmin();
    if (!current || !current.user.isActive) {
      return {
        success: false,
        error: { code: "UNAUTHENTICATED", message: "Active administrator session required." },
      };
    }

    // Strict commercial authorization check
    if (current.user.role === "EDITOR") {
      return {
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Commercial governance policy: Editors cannot publish or alter live pricing tiers in INR.",
        },
      };
    }

    const result = await publishContentItem({
      contentItemId: input.contentItemId,
      revisionId: input.revisionId,
      expectedVersion: input.expectedVersion,
      actor: current.user,
      changeSummary: input.changeSummary,
    });

    try {
      revalidatePath("/pricing");
      revalidatePath("/");
    } catch {
      // Best effort
    }

    return {
      success: true,
      data: {
        packageId: result.contentItemId,
        version: result.version,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to publish pricing package.";
    const code = err instanceof Object && "code" in err ? String(err.code) : "PRICING_PUBLISH_FAILED";
    return {
      success: false,
      error: { code, message: msg },
    };
  }
}

