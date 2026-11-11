import { z } from "zod";

/**
 * Zod validation schema for server-side SMTP configuration.
 * All credentials are strictly kept on the server and never sent to frontend bundles or logged.
 */
export const emailConfigSchema = z.object({
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
  SMTP_FROM_EMAIL: z.string().email("SMTP_FROM_EMAIL must be a valid email").default("notifications@voidtechsolution.com"),
  ADMIN_ALERT_EMAIL: z.string().email("ADMIN_ALERT_EMAIL must be a valid email").default("admin@voidtechsolution.com"),
});

export type EmailConfig = z.infer<typeof emailConfigSchema>;

/**
 * Parses and validates SMTP environment variables.
 * Allows passing an optional overrides dictionary for testing without mutating process.env.
 */
export function getEmailConfig(overrides?: Partial<Record<string, string | undefined>>): EmailConfig {
  const envSource = overrides || process.env;

  const raw = {
    SMTP_HOST: envSource.SMTP_HOST || "smtp.voidtechsolution.com",
    SMTP_PORT: envSource.SMTP_PORT || "587",
    SMTP_SECURE: envSource.SMTP_SECURE || "false",
    SMTP_USER: envSource.SMTP_USER || "mailer@voidtechsolution.com",
    SMTP_PASS: envSource.SMTP_PASS || "voidtech_smtp_dummy_secret",
    SMTP_FROM_NAME: envSource.SMTP_FROM_NAME || "VOIDTECH SOLUTION",
    SMTP_FROM_EMAIL: envSource.SMTP_FROM_EMAIL || "notifications@voidtechsolution.com",
    ADMIN_ALERT_EMAIL: envSource.ADMIN_ALERT_EMAIL || "admin@voidtechsolution.com",
  };

  const parsed = emailConfigSchema.safeParse(raw);
  if (!parsed.success) {
    const errorDetails = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
    throw new Error(`SMTP configuration validation failed: ${errorDetails}`);
  }

  return parsed.data;
}

