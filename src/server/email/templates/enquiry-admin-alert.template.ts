import { renderBaseEmailLayout, renderBaseEmailText } from "./base-layout";

export interface EnquiryAdminAlertTemplateProps {
  enquiryId: string;
  prospectName: string;
  email: string;
  phone?: string;
  companyName?: string;
  serviceCategory: string;
  selectedPackage?: string;
  budgetRange?: string;
  timeline?: string;
  message: string;
  referenceUrl?: string;
  submittedAt?: Date | string;
}

export function renderEnquiryAdminAlertEmail(props: EnquiryAdminAlertTemplateProps): {
  subject: string;
  html: string;
  text: string;
} {
  const refCode = props.enquiryId ? ` [Ref: ${props.enquiryId.slice(-8).toUpperCase()}]` : "";
  const leadName = props.prospectName ? `: ${props.prospectName}` : "";
  const subject = `New Project Enquiry — VOIDTECH SOLUTION${leadName}${refCode}`;
  const timestamp = props.submittedAt
    ? new Date(props.submittedAt).toUTCString()
    : new Date().toUTCString();

  const contentHtml = `
    <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #ffffff;">
      New Project Enquiry
    </h2>
    <p style="margin: 0 0 20px 0; color: #9ca3af; font-size: 14px;">
      A new commercial enquiry was submitted on <strong>voidtechsolution.com</strong>.
    </p>

    <!-- LEAD DETAILS TABLE -->
    <table role="presentation" border="0" cellpadding="8" cellspacing="0" width="100%" style="background-color: #121218; border: 1px solid #1f1f2e; border-radius: 8px; font-size: 14px; margin-bottom: 24px;">
      <tr>
        <td width="30%" style="color: #8b5cf6; font-weight: 600; border-bottom: 1px solid #1a1a26;">Enquiry ID:</td>
        <td style="color: #ffffff; border-bottom: 1px solid #1a1a26; font-family: monospace;">${props.enquiryId}</td>
      </tr>
      <tr>
        <td style="color: #8b5cf6; font-weight: 600; border-bottom: 1px solid #1a1a26;">Lead Name:</td>
        <td style="color: #ffffff; border-bottom: 1px solid #1a1a26;">${props.prospectName}</td>
      </tr>
      <tr>
        <td style="color: #8b5cf6; font-weight: 600; border-bottom: 1px solid #1a1a26;">Email:</td>
        <td style="color: #ffffff; border-bottom: 1px solid #1a1a26;"><a href="mailto:${props.email}" style="color: #a855f7; text-decoration: none;">${props.email}</a></td>
      </tr>
      <tr>
        <td style="color: #8b5cf6; font-weight: 600; border-bottom: 1px solid #1a1a26;">Phone:</td>
        <td style="color: #ffffff; border-bottom: 1px solid #1a1a26;">${props.phone || "Not provided"}</td>
      </tr>
      <tr>
        <td style="color: #8b5cf6; font-weight: 600; border-bottom: 1px solid #1a1a26;">Company:</td>
        <td style="color: #ffffff; border-bottom: 1px solid #1a1a26;">${props.companyName || "Not provided"}</td>
      </tr>
      <tr>
        <td style="color: #8b5cf6; font-weight: 600; border-bottom: 1px solid #1a1a26;">Project Track:</td>
        <td style="color: #ffffff; border-bottom: 1px solid #1a1a26;"><strong>${props.serviceCategory}</strong></td>
      </tr>
      ${
        props.selectedPackage
          ? `<tr>
              <td style="color: #8b5cf6; font-weight: 600; border-bottom: 1px solid #1a1a26;">Selected Package:</td>
              <td style="color: #a855f7; border-bottom: 1px solid #1a1a26;"><strong>${props.selectedPackage}</strong></td>
            </tr>`
          : ""
      }
      <tr>
        <td style="color: #8b5cf6; font-weight: 600; border-bottom: 1px solid #1a1a26;">Budget Range:</td>
        <td style="color: #ffffff; border-bottom: 1px solid #1a1a26;">${props.budgetRange || "Not specified"}</td>
      </tr>
      <tr>
        <td style="color: #8b5cf6; font-weight: 600; border-bottom: 1px solid #1a1a26;">Timeline:</td>
        <td style="color: #ffffff; border-bottom: 1px solid #1a1a26;">${props.timeline || "Not specified"}</td>
      </tr>
      ${
        props.referenceUrl
          ? `<tr>
              <td style="color: #8b5cf6; font-weight: 600; border-bottom: 1px solid #1a1a26;">Reference URL:</td>
              <td style="color: #ffffff; border-bottom: 1px solid #1a1a26;"><a href="${props.referenceUrl}" style="color: #a855f7;">${props.referenceUrl}</a></td>
            </tr>`
          : ""
      }
      <tr>
        <td style="color: #8b5cf6; font-weight: 600;">Submitted At:</td>
        <td style="color: #9ca3af; font-size: 12px;">${timestamp}</td>
      </tr>
    </table>

    <div style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #8b5cf6; margin-bottom: 8px;">
      Project Brief & Requirements:
    </div>
    <div style="padding: 16px; background-color: #0d0d12; border: 1px solid #1a1a24; border-radius: 6px; color: #e5e7eb; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">
${props.message}
    </div>
  `;

  const plainTextBody = `NEW PROJECT ENQUIRY [${props.enquiryId}]
Timestamp: ${timestamp}

LEAD CONTACT:
- Name: ${props.prospectName}
- Email: ${props.email}
- Phone: ${props.phone || "N/A"}
- Company: ${props.companyName || "N/A"}

PROJECT SPECIFICATION:
- Category Track: ${props.serviceCategory}
- Package: ${props.selectedPackage || "N/A"}
- Budget: ${props.budgetRange || "Not specified"}
- Timeline: ${props.timeline || "Not specified"}
- Reference URL: ${props.referenceUrl || "N/A"}

BRIEF:
${props.message}`;

  const html = renderBaseEmailLayout({
    title: "New Project Enquiry Alert",
    previewText: `New inbound project enquiry from ${props.prospectName} (${props.serviceCategory})`,
    contentHtml,
  });

  const text = renderBaseEmailText("New Project Enquiry", plainTextBody);

  return { subject, html, text };
}
