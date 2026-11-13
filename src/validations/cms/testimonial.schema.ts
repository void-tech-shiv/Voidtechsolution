import { z } from "zod";
import {
  TestimonialVerificationStatus,
  ClientConsentStatus,
} from "@/types/cms";
import {
  slugSchema,
  entityIdSchema,
  optionalHttpUrlSchema,
  paginationSchema,
  sortOrderSchema,
  searchQuerySchema,
} from "./common.schema";

/**
 * Public Testimonial Submission Schema
 * 
 * Used for public-facing client submission forms.
 * SECURITY: Administrative fields (verificationStatus, clientConsentStatus,
 * verifiedById, verifiedAt, isActive, contentItemId) are strictly omitted
 * and strict() mode is enforced to reject any attempted tampering.
 */
export const publicTestimonialSubmissionSchema = z
  .object({
    clientName: z
      .string({ required_error: "Client name is required" })
      .trim()
      .min(2, "Client name must be at least 2 characters")
      .max(100, "Client name cannot exceed 100 characters"),
    clientRole: z
      .string()
      .trim()
      .min(2, "Client role must be at least 2 characters")
      .max(100, "Client role cannot exceed 100 characters")
      .optional(),
    clientCompany: z
      .string()
      .trim()
      .min(2, "Company name must be at least 2 characters")
      .max(100, "Company name cannot exceed 100 characters")
      .optional(),
    content: z
      .string({ required_error: "Testimonial content is required" })
      .trim()
      .min(10, "Testimonial content must be at least 10 characters")
      .max(2000, "Testimonial content cannot exceed 2000 characters"),
    rating: z
      .number({ required_error: "Rating is required" })
      .int("Rating must be an integer")
      .min(1, "Rating must be between 1 and 5")
      .max(5, "Rating must be between 1 and 5"),
    avatarUrl: optionalHttpUrlSchema,
    projectSlug: slugSchema.optional(),
    consentGiven: z.literal(true, {
      errorMap: () => ({
        message: "Explicit client consent is required to submit a testimonial",
      }),
    }),
  })
  .strict();

export type PublicTestimonialSubmissionInput = z.infer<
  typeof publicTestimonialSubmissionSchema
>;

/**
 * Admin Testimonial Moderation & Update Schema
 * 
 * Used by authenticated CMS administrators to moderate, verify, update,
 * and publish testimonials.
 */
export const adminUpdateTestimonialSchema = z
  .object({
    id: entityIdSchema,
    clientName: z
      .string()
      .trim()
      .min(2, "Client name must be at least 2 characters")
      .max(100, "Client name cannot exceed 100 characters")
      .optional(),
    clientRole: z
      .string()
      .trim()
      .max(100, "Client role cannot exceed 100 characters")
      .nullable()
      .optional(),
    clientCompany: z
      .string()
      .trim()
      .max(100, "Company name cannot exceed 100 characters")
      .nullable()
      .optional(),
    content: z
      .string()
      .trim()
      .min(10, "Testimonial content must be at least 10 characters")
      .max(2000, "Testimonial content cannot exceed 2000 characters")
      .optional(),
    rating: z
      .number()
      .int("Rating must be an integer")
      .min(1, "Rating must be between 1 and 5")
      .max(5, "Rating must be between 1 and 5")
      .optional(),
    avatarUrl: optionalHttpUrlSchema.nullable().optional(),
    projectSlug: slugSchema.nullable().optional(),
    orderIndex: z
      .number()
      .int("Order index must be an integer")
      .min(0, "Order index cannot be negative")
      .optional(),
    isActive: z.boolean().optional(),
    verificationStatus: z
      .nativeEnum(TestimonialVerificationStatus, {
        errorMap: () => ({
          message: "Invalid verificationStatus. Must be PENDING, VERIFIED, or REJECTED",
        }),
      })
      .optional(),
    clientConsentStatus: z
      .nativeEnum(ClientConsentStatus, {
        errorMap: () => ({
          message: "Invalid clientConsentStatus. Must be PENDING, GRANTED, or REVOKED",
        }),
      })
      .optional(),
    consentEvidenceUrl: optionalHttpUrlSchema.nullable().optional(),
  })
  .refine(
    (data) => {
      // Business rule: Cannot verify a testimonial if client consent is revoked
      if (
        data.verificationStatus === TestimonialVerificationStatus.VERIFIED &&
        data.clientConsentStatus === ClientConsentStatus.REVOKED
      ) {
        return false;
      }
      return true;
    },
    {
      message:
        "Cannot set verification status to VERIFIED when client consent status is REVOKED",
      path: ["clientConsentStatus"],
    }
  );

export type AdminUpdateTestimonialInput = z.infer<
  typeof adminUpdateTestimonialSchema
>;

/**
 * Allowed sort fields for testimonials
 */
export const testimonialSortFields = [
  "createdAt",
  "updatedAt",
  "rating",
  "orderIndex",
  "clientName",
] as const;

/**
 * Testimonial Query & Filter Schema
 */
export const testimonialQuerySchema = paginationSchema.extend({
  verificationStatus: z.nativeEnum(TestimonialVerificationStatus).optional(),
  clientConsentStatus: z.nativeEnum(ClientConsentStatus).optional(),
  isActive: z
    .preprocess((val) => {
      if (typeof val === "string") {
        if (val.toLowerCase() === "true") return true;
        if (val.toLowerCase() === "false") return false;
      }
      return val;
    }, z.boolean().optional())
    .optional(),
  projectSlug: slugSchema.optional(),
  search: searchQuerySchema,
  sortBy: z.enum(testimonialSortFields).default("createdAt"),
  sortOrder: sortOrderSchema,
});

export type TestimonialQueryInput = z.infer<typeof testimonialQuerySchema>;
