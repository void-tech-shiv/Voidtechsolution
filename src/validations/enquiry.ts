import { z } from "zod";

export const serviceCategoryEnum = z.enum([
  "WEB_DEVELOPMENT",
  "MOBILE_DEVELOPMENT",
  "API_BACKEND",
  "AI_AUTOMATION",
  "BOTS_AUTOMATION",
  "DESIGN_CREATIVE",
  "ENTERPRISE_SYSTEMS",
  "FINTECH_PAYMENTS",
  "CLOUD_HOSTING",
  "OTHER",
]);

export const budgetRangeEnum = z.enum([
  "UNDER_2K",
  "2K_TO_5K",
  "5K_TO_15K",
  "15K_TO_50K",
  "50K_PLUS",
  "NOT_SURE",
]);

export const timelineEnum = z.enum([
  "URGENT_UNDER_1_MONTH",
  "1_TO_3_MONTHS",
  "3_TO_6_MONTHS",
  "FLEXIBLE",
]);

/**
 * Validates reference URLs: must be a valid http/https URL when provided.
 */
const optionalUrlSchema = z
  .string()
  .trim()
  .max(300, "Reference URL must not exceed 300 characters")
  .refine(
    (val) => {
      if (!val || val === "") return true;
      try {
        const parsed = new URL(val);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "Please enter a valid URL starting with http:// or https://" }
  )
  .optional()
  .or(z.literal(""));

/**
 * Client-facing Form Schema
 */
export const enquiryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters long")
    .max(100, "Name must not exceed 100 characters"),
  email: z
    .string()
    .trim()
    .email("Please provide a valid business email address")
    .max(150, "Email must not exceed 150 characters"),
  phone: z
    .string()
    .trim()
    .max(30, "Phone number is too long")
    .optional()
    .or(z.literal("")),
  companyName: z
    .string()
    .trim()
    .max(100, "Company name is too long")
    .optional()
    .or(z.literal("")),
  serviceCategory: serviceCategoryEnum,
  budgetRange: budgetRangeEnum.optional().nullable(),
  timeline: timelineEnum.optional().nullable(),
  message: z
    .string()
    .trim()
    .min(10, "Please provide at least 10 characters describing your project")
    .max(3000, "Message cannot exceed 3000 characters"),
  selectedPackage: z
    .string()
    .trim()
    .max(100, "Package identifier is too long")
    .optional()
    .or(z.literal("")),
  additionalConfig: z.record(z.unknown()).optional().nullable(),
  referenceUrl: optionalUrlSchema,
  consentGiven: z
    .boolean()
    .default(true)
    .refine((val) => val === true, "You must accept the consultation review policy to proceed"),
  // Honeypot field for bot detection (must remain empty)
  website_url: z
    .string()
    .max(0, "Spam submission detected")
    .optional()
    .or(z.literal("")),
});

export type EnquiryFormValues = z.infer<typeof enquiryFormSchema>;

/**
 * Server-side Submission Schema (Strictly rejects unexpected properties)
 */
export const enquirySubmissionSchema = enquiryFormSchema.strict();

export type EnquirySubmissionInput = z.infer<typeof enquirySubmissionSchema>;
