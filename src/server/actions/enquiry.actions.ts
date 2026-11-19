"use server";

import { headers } from "next/headers";
import { createHash } from "node:crypto";

import type { Prisma } from "@prisma/client";
import {
  enquirySubmissionSchema,
  type EnquirySubmissionInput,
} from "@/validations/enquiry";
import { createEnquiry } from "@/server/repositories/enquiries.repo";
import { dispatchEnquiryNotifications } from "@/server/email";
import {
  checkRateLimit,
  generateSubmissionFingerprint,
  isDuplicateSubmission,
  releaseSubmissionFingerprint,
  getTrustedClientIp,
  hashClientIp,
} from "@/server/security";

export interface SubmitEnquiryActionResult {
  success: boolean;
  enquiryId?: string;
  error?: string;
  errors?: Record<string, string>;
}

/**
 * Server Action for processing and persisting inbound client enquiries.
 */
export async function submitEnquiryAction(
  rawInput: unknown
): Promise<SubmitEnquiryActionResult> {
  // 1. Honeypot Bot Detection Trap (fast rejection before schema parsing)
  if (
    typeof rawInput === "object" &&
    rawInput !== null &&
    "website_url" in rawInput &&
    typeof (rawInput as Record<string, unknown>).website_url === "string" &&
    ((rawInput as Record<string, unknown>).website_url as string).trim() !== ""
  ) {
    console.warn("[enquiry.action] Honeypot field triggered; rejecting submission silently.");
    return {
      success: false,
      error: "Spam submission detected.",
    };
  }

  // 2. Zod Server-Side Schema Validation
  const parseResult = enquirySubmissionSchema.safeParse(rawInput);
  if (!parseResult.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parseResult.error.issues) {
      const field = issue.path[0] ? String(issue.path[0]) : "form";
      fieldErrors[field] = issue.message;
    }
    return {
      success: false,
      error: "Please correct the highlighted errors before submitting.",
      errors: fieldErrors,
    };
  }

  const data: EnquirySubmissionInput = parseResult.data;

  // 3. Derive visitor IP from trusted server-side request headers.
  // When no trusted ingress is configured, use a shared anonymous key rather than a spoofable header.
  let clientIp: string | null = null;
  try {
    clientIp = getTrustedClientIp(await headers());
  } catch {
    // Supports isolated unit tests without a Next.js request context.
  }
  const emailKey = `enquiry_email:${createHash("sha256").update(data.email.toLowerCase()).digest("hex")}`;
  const emailCheck = checkRateLimit(emailKey, 5, 10 * 60 * 1000);
  const ipCheck = clientIp
    ? checkRateLimit(`enquiry_ip:${clientIp}`, 20, 10 * 60 * 1000)
    : { allowed: true, resetInSeconds: 0 };
  if (!emailCheck.allowed || !ipCheck.allowed) {
    const retrySeconds = Math.max(
      !emailCheck.allowed ? emailCheck.resetInSeconds : 0,
      !ipCheck.allowed ? ipCheck.resetInSeconds : 0
    );
    return {
      success: false,
      error: `Submission limit reached. Please wait ${retrySeconds} seconds before submitting again.`,
    };
  }

  // 4. Duplicate Submission Protection (60s cooldown for identical payload)
  const fingerprint = generateSubmissionFingerprint(data.email, data.message, data.selectedPackage);
  if (isDuplicateSubmission(fingerprint, 60 * 1000)) {
    return {
      success: false,
      error: "An identical enquiry was recently submitted. Our team is already reviewing it.",
    };
  }

  // 5. Database Persistence via Repository
  try {
    const enquiry = await createEnquiry(
      {
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        companyName: data.companyName || undefined,
        serviceCategory: data.serviceCategory,
        budgetRange: data.budgetRange || undefined,
        timeline: data.timeline || undefined,
        message: data.message,
        selectedPackage: data.selectedPackage || undefined,
        additionalConfig: (data.additionalConfig as Prisma.InputJsonValue) || undefined,
        referenceUrl: data.referenceUrl || undefined,
        consentGiven: data.consentGiven,
      },
      { ipHash: hashClientIp(clientIp) }
    );

    // 6. Await notification dispatch before returning: unawaited work can
    // be terminated when a serverless request finishes. Email failures do not
    // invalidate an already persisted enquiry.
    try {
      const delivery = await dispatchEnquiryNotifications(enquiry);
      if (delivery.errors.length > 0) {
        console.warn("[enquiry.action] Notification delivery issues:", delivery.errors);
      }
    } catch (err) {
      console.warn("[enquiry.action] Notification dispatch error:", err);
    }

    return {
      success: true,
      enquiryId: enquiry.id,
    };
  } catch (error) {
    releaseSubmissionFingerprint(fingerprint);
    const message = error instanceof Error ? error.message : "Database write operation failed";
    console.error("[enquiry.action] Persistence failure:", message);
    return {
      success: false,
      error: "Unable to record enquiry due to database service interruption. Please try again shortly.",
    };
  }
}
