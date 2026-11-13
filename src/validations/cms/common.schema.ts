import { z } from "zod";

/**
 * Validates kebab-case URL slugs (e.g. "cloud-architecture", "seo-services-2026")
 * Rules:
 * - Lowercase alphanumeric and single hyphens
 * - No leading, trailing, or consecutive hyphens
 * - Length between 3 and 100 characters
 */
export const slugSchema = z
  .string({ required_error: "Slug is required" })
  .trim()
  .min(3, "Slug must be at least 3 characters")
  .max(100, "Slug cannot exceed 100 characters")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug must be lowercase alphanumeric with single hyphens (e.g. 'cloud-architecture')"
  );

/**
 * Validates CUID and alphanumeric entity identifiers (min 10, max 128 chars)
 */
export const entityIdSchema = z
  .string({ required_error: "Entity ID is required" })
  .trim()
  .min(10, "Invalid identifier: minimum 10 characters")
  .max(128, "Invalid identifier: maximum 128 characters")
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    "Identifier contains invalid characters (alphanumeric, underscore, hyphen only)"
  );

/**
 * Validates external HTTP/HTTPS URLs
 */
export const httpUrlSchema = z
  .string()
  .trim()
  .max(500, "URL cannot exceed 500 characters")
  .refine(
    (val) => {
      if (!val) return false;
      try {
        const u = new URL(val);
        return u.protocol === "http:" || u.protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "Must be a valid URL starting with http:// or https://" }
  );

/**
 * Optional HTTP/HTTPS URL schema (accepts undefined or valid URL)
 */
export const optionalHttpUrlSchema = z.preprocess((val) => {
  if (val === "" || val === null || val === undefined) return undefined;
  return val;
}, httpUrlSchema.optional());

/**
 * Standard pagination parameters for list queries
 */
export const paginationSchema = z.object({
  page: z.coerce
    .number()
    .int("Page must be an integer")
    .min(1, "Page must be greater than or equal to 1")
    .default(1),
  limit: z.coerce
    .number()
    .int("Limit must be an integer")
    .min(1, "Limit must be at least 1")
    .max(100, "Limit cannot exceed 100 items per page")
    .default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

/**
 * Sort order schema (ascending or descending)
 */
export const sortOrderSchema = z.enum(["asc", "desc"]).default("desc");

export type SortOrderInput = z.infer<typeof sortOrderSchema>;

/**
 * Search query string schema (trimmed, max 100 chars, optional)
 */
export const searchQuerySchema = z.preprocess((val) => {
  if (val === "" || val === null || val === undefined) return undefined;
  return typeof val === "string" ? val.trim() : val;
}, z.string().max(100, "Search query cannot exceed 100 characters").optional());

/**
 * Date range filter with cross-field consistency refinement
 */
export const dateRangeSchema = z
  .object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  })
  .refine(
    (data) => {
      if (data.from && data.to) {
        return data.to.getTime() >= data.from.getTime();
      }
      return true;
    },
    {
      message: "End date (to) must be greater than or equal to start date (from)",
      path: ["to"],
    }
  );

export type DateRangeInput = z.infer<typeof dateRangeSchema>;

/**
 * JSON primitive types
 */
const jsonPrimitive = z.union([z.string(), z.number(), z.boolean(), z.null()]);

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

/**
 * Safe JSON key schema enforcing string length limits and strictly prohibiting prototype pollution
 */
export const safeJsonKeySchema = z
  .string()
  .max(100, "Key length cannot exceed 100 characters")
  .refine(
    (k) => k !== "__proto__" && k !== "constructor" && k !== "prototype",
    (k) => ({ message: `Illegal object key: ${k}` })
  );

/**
 * Safe, bounded, prototype-pollution-resistant JSON schema for CMS snapshots & metadata
 */
export const safeJsonSchema: z.ZodType<JsonValue> = z
  .lazy(() =>
    z
      .union([
        jsonPrimitive,
        z
          .array(safeJsonSchema)
          .max(500, "Array length exceeds maximum limit of 500 items"),
        z.record(safeJsonKeySchema, safeJsonSchema),
      ])
      .superRefine((val, ctx) => {
        function check(current: unknown, depth = 0): boolean {
          if (depth > 6) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "JSON depth exceeds maximum allowed depth of 6",
            });
            return false;
          }
          if (current === null || typeof current !== "object") return true;

          if (Array.isArray(current)) {
            if (current.length > 500) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Array length exceeds maximum limit of 500 items",
              });
              return false;
            }
            for (const item of current) {
              if (!check(item, depth + 1)) return false;
            }
            return true;
          }

          const currentObj = current as Record<string, unknown>;
          const keys = Object.keys(currentObj);
          if (keys.length > 200) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Object key count exceeds maximum limit of 200 keys",
            });
            return false;
          }

          for (const k of keys) {
            if (!check(currentObj[k], depth + 1)) return false;
          }
          return true;
        }

        check(val, 0);
      })
  );
