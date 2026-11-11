import { renderBaseEmailLayout, renderBaseEmailText } from "./base-layout";

export interface EnquiryConfirmationTemplateProps {
  recipientName: string;
  serviceTitle?: string;
  enquiryId?: string;
}

export function renderEnquiryConfirmationEmail(props: EnquiryConfirmationTemplateProps): {
  subject: string;
  html: string;
  text: string;
} {
  const service = props.serviceTitle || "Custom Software Development";
  const refCode = props.enquiryId ? ` [Ref: ${props.enquiryId.slice(-8).toUpperCase()}]` : "";
  const subject = `Enquiry Received — VOIDTECH SOLUTION${refCode}`;

  const contentHtml = `
    <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #ffffff;">
      We've Received Your Enquiry
    </h2>
    <p style="margin: 0 0 20px 0; color: #9ca3af; font-size: 14px;">
      Hello <strong>${props.recipientName}</strong>,
    </p>
    <p style="margin: 0 0 20px 0; color: #d1d5db; font-size: 15px;">
      Thank you for connecting with <strong>VOIDTECH SOLUTION</strong>. We have successfully registered your commercial enquiry for <strong>${service}</strong>.
    </p>

    <!-- INTAKE SUMMARY CARD -->
    <div style="margin: 24px 0; padding: 20px; background-color: #121218; border: 1px solid #1f1f2e; border-radius: 8px;">
      <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #8b5cf6; margin-bottom: 8px;">
        Next Steps & SLA Guarantee
      </div>
      <ul style="margin: 0; padding-left: 20px; color: #9ca3af; font-size: 14px; line-height: 1.8;">
        <li>A Senior Technical Solution Architect is reviewing your technical specifications.</li>
        <li>We will provide an initial feasibility assessment, estimated milestone timeline, and architectural recommendation within <strong>24 business hours</strong>.</li>
        <li>For urgent production requirements, reply directly to this email to coordinate an expedited architecture briefing.</li>
      </ul>
    </div>

    ${
      props.enquiryId
        ? `<div style="margin-top: 16px; font-size: 13px; color: #6b7280;">
            Enquiry Reference ID: <span style="font-family: monospace; color: #a855f7;">${props.enquiryId}</span>
          </div>`
        : ""
    }
  `;

  const plainTextBody = `Hello ${props.recipientName},

Thank you for contacting VOIDTECH SOLUTION. We have received your enquiry regarding ${service}.

NEXT STEPS:
- A Senior Technical Solution Architect is reviewing your specifications.
- We will deliver an initial feasibility assessment and timeline within 24 business hours.
${props.enquiryId ? `\nEnquiry Reference ID: ${props.enquiryId}` : ""}

If you have urgent questions, reply directly to contact@voidtechsolution.com.`;

  const html = renderBaseEmailLayout({
    title: "Enquiry Confirmation",
    previewText: `Thank you for contacting VOIDTECH SOLUTION regarding ${service}.`,
    contentHtml,
  });

  const text = renderBaseEmailText("Enquiry Confirmation", plainTextBody);

  return { subject, html, text };
}
