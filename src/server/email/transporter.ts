import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { getEmailConfig } from "./config";

let transporterInstance: Transporter | null = null;

/**
 * Creates or retrieves the singleton reusable Nodemailer transporter instance.
 * Accepts an optional mock transporter for isolated testing.
 */
export function getSmtpTransporter(customTransporter?: Transporter): Transporter {
  if (customTransporter) {
    return customTransporter;
  }

  if (transporterInstance) {
    return transporterInstance;
  }

  const config = getEmailConfig();

  transporterInstance = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_SECURE,
    auth: {
      user: config.SMTP_USER,
      pass: config.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === "production",
    },
  });

  return transporterInstance;
}

/**
 * Resets the cached transporter instance (used in testing).
 */
export function resetSmtpTransporter(): void {
  transporterInstance = null;
}

/**
 * Verifies active SMTP connection credentials with the mail server.
 */
export async function verifySmtpConnection(transporter?: Transporter): Promise<boolean> {
  const activeTransporter = transporter || getSmtpTransporter();
  try {
    await activeTransporter.verify();
    return true;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown SMTP error";
    // Sanitize credentials out of logs
    console.error("[smtp.transporter] SMTP connection verification failed:", msg);
    return false;
  }
}
