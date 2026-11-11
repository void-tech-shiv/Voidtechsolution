import type { Transporter, SentMessageInfo } from "nodemailer";
import { getEmailConfig } from "./config";
import { getSmtpTransporter } from "./transporter";
import {
  createEmailDelivery,
  updateEmailDeliveryStatus,
} from "@/server/repositories/delivery.repo";
import {
  renderOtpVerificationEmail,
  renderPasswordResetEmail,
  renderEnquiryConfirmationEmail,
  renderEnquiryAdminAlertEmail,
  renderEnquiryStatusUpdateEmail,
  renderSecurityNotificationEmail,
  type OtpVerificationTemplateProps,
  type PasswordResetTemplateProps,
  type EnquiryConfirmationTemplateProps,
  type EnquiryAdminAlertTemplateProps,
  type EnquiryStatusUpdateTemplateProps,
  type SecurityNotificationTemplateProps,
} from "./templates";

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  templateName?: string;
  replyTo?: string;
  customTransporter?: Transporter;
  maxRetries?: number;
  initialBackoffMs?: number;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  deliveryId?: string;
  error?: string;
  retries: number;
}

/**
 * Sends a transactional email using Nodemailer with automatic delivery tracking,
 * exponential backoff retry for transient failures, and credential sanitization.
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const config = getEmailConfig();
  const transporter = options.customTransporter || getSmtpTransporter();
  const recipients = Array.isArray(options.to) ? options.to.join(", ") : options.to;
  const templateName = options.templateName || "GENERIC";
  const maxRetries = options.maxRetries !== undefined ? Math.min(options.maxRetries, 3) : 3;
  const initialBackoff = options.initialBackoffMs !== undefined ? options.initialBackoffMs : 100;

  // 1. Persist initial delivery audit record
  const delivery = await createEmailDelivery({
    recipient: recipients,
    subject: options.subject,
    template: templateName,
    status: "PENDING",
  });

  const mailOptions = {
    from: `"${config.SMTP_FROM_NAME}" <${config.SMTP_FROM_EMAIL}>`,
    to: options.to,
    replyTo: options.replyTo || config.SMTP_FROM_EMAIL,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt <= maxRetries) {
    try {
      const info: SentMessageInfo = await transporter.sendMail(mailOptions);

      // Record successful delivery
      await updateEmailDeliveryStatus(delivery.id, {
        status: "SENT",
        providerMessageId: info.messageId || `msg-${Date.now()}`,
        sentAt: new Date(),
        retryCount: attempt,
      });

      return {
        success: true,
        messageId: info.messageId,
        deliveryId: delivery.id,
        retries: attempt,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      attempt++;

      if (attempt <= maxRetries) {
        const delay = initialBackoff * Math.pow(2, attempt - 1);
        await new Promise((res) => setTimeout(res, delay));
      }
    }
  }

  // Record failure after retries exhausted
  const failureMessage = lastError ? lastError.message : "Delivery failed";
  const sanitizedMsg = failureMessage.replace(/([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)/g, "$1@***");

  await updateEmailDeliveryStatus(delivery.id, {
    status: "FAILED",
    failureCode: "SMTP_DISPATCH_FAILURE",
    errorMessage: sanitizedMsg,
    retryCount: attempt - 1,
  });

  return {
    success: false,
    deliveryId: delivery.id,
    error: sanitizedMsg,
    retries: attempt - 1,
  };
}

// ------------------------------------------------------------------------------
// CONVENIENCE TYPED DISPATCHERS
// ------------------------------------------------------------------------------

export async function sendOtpEmail(
  to: string,
  props: OtpVerificationTemplateProps,
  customTransporter?: Transporter
): Promise<SendEmailResult> {
  const { subject, html, text } = renderOtpVerificationEmail(props);
  return sendEmail({
    to,
    subject,
    html,
    text,
    templateName: "OTP_VERIFICATION",
    customTransporter,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  props: PasswordResetTemplateProps,
  customTransporter?: Transporter
): Promise<SendEmailResult> {
  const { subject, html, text } = renderPasswordResetEmail(props);
  return sendEmail({
    to,
    subject,
    html,
    text,
    templateName: "PASSWORD_RESET",
    customTransporter,
  });
}

export async function sendEnquiryConfirmationEmail(
  to: string,
  props: EnquiryConfirmationTemplateProps,
  customTransporter?: Transporter
): Promise<SendEmailResult> {
  const { subject, html, text } = renderEnquiryConfirmationEmail(props);
  return sendEmail({
    to,
    subject,
    html,
    text,
    templateName: "ENQUIRY_CONFIRMATION",
    customTransporter,
  });
}

export async function sendEnquiryAdminAlertEmail(
  props: EnquiryAdminAlertTemplateProps,
  customTransporter?: Transporter
): Promise<SendEmailResult> {
  const config = getEmailConfig();
  const { subject, html, text } = renderEnquiryAdminAlertEmail(props);
  return sendEmail({
    to: config.ADMIN_ALERT_EMAIL,
    subject,
    html,
    text,
    templateName: "ENQUIRY_ADMIN_ALERT",
    customTransporter,
  });
}

export async function sendEnquiryStatusUpdateEmail(
  to: string,
  props: EnquiryStatusUpdateTemplateProps,
  customTransporter?: Transporter
): Promise<SendEmailResult> {
  const { subject, html, text } = renderEnquiryStatusUpdateEmail(props);
  return sendEmail({
    to,
    subject,
    html,
    text,
    templateName: "ENQUIRY_STATUS_UPDATE",
    customTransporter,
  });
}

export async function sendSecurityNotificationEmail(
  to: string,
  props: SecurityNotificationTemplateProps,
  customTransporter?: Transporter
): Promise<SendEmailResult> {
  const { subject, html, text } = renderSecurityNotificationEmail(props);
  return sendEmail({
    to,
    subject,
    html,
    text,
    templateName: "SECURITY_NOTIFICATION",
    customTransporter,
  });
}

