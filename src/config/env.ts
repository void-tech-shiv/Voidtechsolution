import { z } from "zod";

/**
 * VOIDTECH SOLUTION — Comprehensive Environment Configuration Schema
 * All credentials are strictly kept server-side.
 * Only variables with NEXT_PUBLIC_ are exposed to the client.
 */
export const appEnvSchema = z
  .object({
    // Database
    DATABASE_URL: z
      .string()
      .min(1, "DATABASE_URL is required")
      .refine(
        (val) => val.startsWith("postgresql://") || val.startsWith("postgres://"),
        "DATABASE_URL must be a valid PostgreSQL connection string"
      ),
    DIRECT_URL: z
      .string()
      .min(1, "DIRECT_URL is required")
      .refine(
        (val) => val.startsWith("postgresql://") || val.startsWith("postgres://"),
        "DIRECT_URL must be a valid PostgreSQL direct connection string"
      ),

    // Authentication & Security
    AUTH_SECRET: z
      .string()
      .min(32, "AUTH_SECRET must be at least 32 characters long for cryptographic security"),
    OTP_PEPPER_SECRET: z
      .string()
      .min(16, "OTP_PEPPER_SECRET must be at least 16 characters long"),

    // Administrator Bootstrap
    ADMIN_EMAIL: z
      .string()
      .email("ADMIN_EMAIL must be a valid email address")
      .default("admin@voidtechsolution.com"),
    ADMIN_PASSWORD: z
      .string()
      .optional()
      .refine((val) => !val || val.length >= 8, "ADMIN_PASSWORD must be at least 8 characters if provided"),

    // SMTP / Nodemailer
    SMTP_HOST: z.string().min(1, "SMTP_HOST is required"),
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_SECURE: z.preprocess((val) => {
      if (typeof val === "boolean") return val;
      if (typeof val === "string") return val.toLowerCase() === "true" || val === "1";
      return false;
    }, z.boolean().default(false)),
    SMTP_USER: z.string().min(1, "SMTP_USER is required"),
    SMTP_PASS: z.string().min(1, "SMTP_PASS is required"),
    SMTP_FROM_NAME: z.string().min(1).default("VOIDTECH SOLUTION"),
    SMTP_FROM_EMAIL: z
      .string()
      .email("SMTP_FROM_EMAIL must be a valid email address")
      .default("notifications@voidtechsolution.com"),
    ADMIN_ALERT_EMAIL: z
      .string()
      .email("ADMIN_ALERT_EMAIL must be a valid email address")
      .default("admin@voidtechsolution.com"),

    // Application Runtime
    NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  })
  .superRefine((data, ctx) => {
    // In production, reject known development fallback placeholder secrets
    if (data.NODE_ENV === "production") {
      if (data.AUTH_SECRET.includes("dev-secret") || data.AUTH_SECRET.includes("super-secret")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["AUTH_SECRET"],
          message: "Production deployment must use a cryptographically random AUTH_SECRET, not a development placeholder",
        });
      }

      if (data.SMTP_PASS === "voidtech_smtp_dummy_secret" || data.SMTP_PASS.includes("replace-with")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["SMTP_PASS"],
          message: "Production deployment requires a real SMTP password or App Password",
        });
      }

      if (data.DATABASE_URL.includes("localhost:5432") || data.DATABASE_URL.includes("user:password")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["DATABASE_URL"],
          message: "Production deployment requires a hosted PostgreSQL connection string, not a local placeholder",
        });
      }
    }
  });

export type AppEnv = z.infer<typeof appEnvSchema>;

/**
 * Validates environment variables and returns strongly-typed configuration.
 * Never leaks raw secret values in error messages.
 */
export function validateAppEnvironment(
  overrides?: Partial<Record<string, string | undefined>>
): AppEnv {
  const envSource = overrides || process.env;

  const raw = {
    DATABASE_URL: envSource.DATABASE_URL || "postgresql://user:password@localhost:5432/voidtech_db?schema=public",
    DIRECT_URL: envSource.DIRECT_URL || "postgresql://user:password@localhost:5432/voidtech_db?schema=public",
    AUTH_SECRET: envSource.AUTH_SECRET || "dev-secret-local-development-only-minimum-32-chars-long",
    OTP_PEPPER_SECRET: envSource.OTP_PEPPER_SECRET || "voidtech_secure_otp_pepper_salt_9874",
    ADMIN_EMAIL: envSource.ADMIN_EMAIL || "admin@voidtechsolution.com",
    ADMIN_PASSWORD: envSource.ADMIN_PASSWORD || undefined,
    SMTP_HOST: envSource.SMTP_HOST || "smtp.voidtechsolution.com",
    SMTP_PORT: envSource.SMTP_PORT || "587",
    SMTP_SECURE: envSource.SMTP_SECURE || "false",
    SMTP_USER: envSource.SMTP_USER || "mailer@voidtechsolution.com",
    SMTP_PASS: envSource.SMTP_PASS || "voidtech_smtp_dummy_secret",
    SMTP_FROM_NAME: envSource.SMTP_FROM_NAME || "VOIDTECH SOLUTION",
    SMTP_FROM_EMAIL: envSource.SMTP_FROM_EMAIL || "notifications@voidtechsolution.com",
    ADMIN_ALERT_EMAIL: envSource.ADMIN_ALERT_EMAIL || "admin@voidtechsolution.com",
    NEXT_PUBLIC_SITE_URL: envSource.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    NODE_ENV: envSource.NODE_ENV || "development",
  };

  const parsed = appEnvSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `[${i.path.join(".")}]: ${i.message}`)
      .join("; ");
    throw new Error(`Environment validation failed: ${issues}`);
  }

  return parsed.data;
}
