import type { Transporter } from "nodemailer";
import type { Enquiry } from "@prisma/client";
import { sendEmail } from "./email.service";
import { getEmailConfig } from "./config";
import {
  renderEnquiryConfirmationEmail,
  renderEnquiryAdminAlertEmail,
} from "./templates";

export interface DispatchEnquiryEmailsResult {
  customerEmailSuccess: boolean;
  adminEmailSuccess: boolean;
  errors: string[];
}

/**
 * Dispatches transactional enquiry confirmation and admin notification emails independently.
 * Designed with safe boundaries: email failures NEVER invalidate or fail the enquiry persistence.
 */
export async function dispatchEnquiryNotifications(
  enquiry: Enquiry,
  customTransporter?: Transporter
): Promise<DispatchEnquiryEmailsResult> {
  const result: DispatchEnquiryEmailsResult = {
    customerEmailSuccess: false,
    adminEmailSuccess: false,
    errors: [],
  };

  let adminRecipient = "admin@voidtechsolution.com";
  try {
    const config = getEmailConfig();
    if (config.ADMIN_ALERT_EMAIL) {
      adminRecipient = config.ADMIN_ALERT_EMAIL;
    }
  } catch {
    // If SMTP config validation fails, use fallback address
  }

  // 1. Customer Enquiry Confirmation Email
  try {
    const confirmation = renderEnquiryConfirmationEmail({
      recipientName: enquiry.name,
      projectCategory: enquiry.serviceCategory,
      selectedPackage: enquiry.selectedPackage || undefined,
      enquiryId: enquiry.id,
    });

    const customerSendResult = await sendEmail({
      to: enquiry.email,
      subject: confirmation.subject,
      html: confirmation.html,
      text: confirmation.text,
      templateName: "ENQUIRY_CONFIRMATION",
      customTransporter,
    });

    result.customerEmailSuccess = customerSendResult.success;
    if (!customerSendResult.success && customerSendResult.error) {
      result.errors.push(`Customer email failed: ${customerSendResult.error}`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.warn("[enquiry-mailer] Customer confirmation dispatch error:", msg);
    result.errors.push(`Customer email exception: ${msg}`);
  }

  // 2. Administrator Notification Email
  try {
    const adminAlert = renderEnquiryAdminAlertEmail({
      enquiryId: enquiry.id,
      prospectName: enquiry.name,
      email: enquiry.email,
      phone: enquiry.phone || undefined,
      companyName: enquiry.companyName || undefined,
      serviceCategory: enquiry.serviceCategory,
      selectedPackage: enquiry.selectedPackage || undefined,
      budgetRange: enquiry.budgetRange || undefined,
      timeline: enquiry.timeline || undefined,
      message: enquiry.message,
      referenceUrl: enquiry.referenceUrl || undefined,
      submittedAt: enquiry.createdAt,
    });

    const adminSendResult = await sendEmail({
      to: adminRecipient,
      subject: adminAlert.subject,
      html: adminAlert.html,
      text: adminAlert.text,
      templateName: "ENQUIRY_ADMIN_ALERT",
      customTransporter,
    });

    result.adminEmailSuccess = adminSendResult.success;
    if (!adminSendResult.success && adminSendResult.error) {
      result.errors.push(`Admin alert email failed: ${adminSendResult.error}`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.warn("[enquiry-mailer] Admin alert dispatch error:", msg);
    result.errors.push(`Admin email exception: ${msg}`);
  }

  return result;
}
