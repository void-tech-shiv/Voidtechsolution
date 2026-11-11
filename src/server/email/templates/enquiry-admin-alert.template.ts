import { renderBaseEmailLayout, renderBaseEmailText } from "./base-layout";

export interface EnquiryAdminAlertTemplateProps {
  enquiryId: string;
  prospectName: string;
  email: string;
  phone?: string;
  companyName?: string;
  serviceCategory: string;
  budgetRange?: string;
  timeline?: string;
  message: string;
}

export function renderEnquiryAdminAlertEmail(props: EnquiryAdminAlertTemplateProps): {
  subject: string;
  html: string;
  text: string;
} {
  const company = props.companyName ? ` (${props.companyName})` : "";
  const subject = `[NEW LEAD] ${props.prospectName}${company} — ${props.serviceCategory}`;

  const contentHtml = `
    <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #ffffff;">
      New Inbound Client Lead
    </h2>
    <p style="margin: 0 0 20px 0; color: #9ca3af; font-size: 14px;">
      A new commercial lead was submitted on <strong>voidtechsolution.com</strong>.
    </p>

    <!-- LEAD DETAILS TABLE -->
    <table role="presentation" border="0" cellpadding="8" cellspacing="0" width="100%" style="background-color: #121218; border: 1px solid #1f1f2e; border-radius: 8px; font-size: 14px; margin-bottom: 24px;">
      <tr>
        <td width="30%" style="color: #8b5cf6; font-weight: 600; border-bottom: 1px solid #1a1a26;">Lead Name:</td>
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
        <td style="color: #8b5cf6; font-weight: 600; border-bottom: 1px solid #1a1a26;">Service Track:</td>
        <td style="color: #ffffff; border-bottom: 1px solid #1a1a26;"><strong>${props.serviceCategory}</strong></td>
      </tr>
      <tr>
        <td style="color: #8b5cf6; font-weight: 600; border-bottom: 1px solid #1a1a26;">Budget Range:</td>
        <td style="color: #ffffff; border-bottom: 1px solid #1a1a26;">${props.budgetRange || "Not specified"}</td>
      </tr>
      <tr>
        <td style="color: #8b5cf6; font-weight: 600; border-bottom: 1px solid #1a1a26;">Timeline:</td>
        <td style="color: #ffffff; border-bottom: 1px solid #1a1a26;">${props.timeline || "Not specified"}</td>
      </tr>
      <tr>
        <td style="color: #8b5cf6; font-weight: 600;">Enquiry ID:</td>
        <td style="color: #9ca3af; font-family: monospace;">${props.enquiryId}</td>
      </tr>
    </table>

    <!-- CLIENT MESSAGE -->
    <div style="margin: 20px 0; padding: 18px; background-color: #0d0d14; border-left: 3px solid #7c3aed; border-radius: 4px;">
      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #8b5cf6; margin-bottom: 8px;">
        Project Brief / Message:
      </div>
      <div style="color: #d1d5db; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${props.message}</div>
    </div>
  `;

  const plainTextBody = `NEW INBOUND CLIENT LEAD
============================================================
Lead Name:        ${props.prospectName}
Email:            ${props.email}
Phone:            ${props.phone || "N/A"}
Company:          ${props.companyName || "N/A"}
Service Track:    ${props.serviceCategory}
Budget Range:     ${props.budgetRange || "N/A"}
Timeline:         ${props.timeline || "N/A"}
Enquiry ID:       ${props.enquiryId}

PROJECT BRIEF:
${props.message}
============================================================`;

  const html = renderBaseEmailLayout({
    title: "New Inbound Lead Alert",
    previewText: `New enquiry from ${props.prospectName} for ${props.serviceCategory}`,
    contentHtml,
  });

  const text = renderBaseEmailText("New Inbound Lead Alert", plainTextBody);

  return { subject, html, text };
}
