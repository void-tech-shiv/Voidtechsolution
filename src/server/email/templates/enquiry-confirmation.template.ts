import { renderBaseEmailLayout, renderBaseEmailText } from "./base-layout";

export interface EnquiryConfirmationTemplateProps {
  recipientName: string;
  serviceTitle?: string;
  projectCategory?: string;
  selectedPackage?: string;
  enquiryId?: string;
}

export function renderEnquiryConfirmationEmail(props: EnquiryConfirmationTemplateProps): {
  subject: string;
  html: string;
  text: string;
} {
  const service = props.serviceTitle || props.projectCategory || "Custom Software Development";
  const refCode = props.enquiryId ? ` [Ref: ${props.enquiryId.slice(-8).toUpperCase()}]` : "";
  const subject = `We've Received Your Project Enquiry — VOIDTECH SOLUTION${refCode}`;

  const contentHtml = `
    <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #ffffff;">
      We've Received Your Project Enquiry
    </h2>
    <p style="margin: 0 0 20px 0; color: #9ca3af; font-size: 14px;">
      Hello <strong>${props.recipientName}</strong>,
    </p>
    <p style="margin: 0 0 20px 0; color: #d1d5db; font-size: 15px;">
      Thank you for connecting with <strong>VOIDTECH SOLUTION</strong>. We have successfully registered your commercial enquiry for <strong>${service}</strong>.
    </p>

    <!-- INTAKE SUMMARY CARD -->
    <div style="margin: 24px 0; padding: 20px; background-color: #121218; border: 1px solid #1f1f2e; border-radius: 8px;">
      <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #8b5cf6; margin-bottom: 12px;">
        Enquiry Details & Next Steps
      </div>
      <table role="presentation" border="0" cellpadding="4" cellspacing="0" width="100%" style="font-size: 13px; color: #9ca3af; margin-bottom: 12px;">
        <tr>
          <td width="35%" style="color: #6b7280;">Project Track:</td>
          <td style="color: #ffffff;"><strong>${service}</strong></td>
        </tr>
        ${
          props.selectedPackage
            ? `<tr>
                <td style="color: #6b7280;">Selected Package:</td>
                <td style="color: #a855f7;"><strong>${props.selectedPackage}</strong></td>
              </tr>`
            : ""
        }
        ${
          props.enquiryId
            ? `<tr>
                <td style="color: #6b7280;">Reference ID:</td>
                <td style="font-family: monospace; color: #8b5cf6;">${props.enquiryId}</td>
              </tr>`
            : ""
        }
      </table>
      <ul style="margin: 0; padding-left: 20px; color: #9ca3af; font-size: 14px; line-height: 1.8;">
        <li>A Senior Technical Solution Architect is reviewing your technical specifications.</li>
        <li>We review every enquiry and respond as soon as possible with an initial feasibility assessment, estimated project schedule, and architectural recommendation.</li>
        <li>For urgent questions or scope revisions, reply directly to this email or reach us at <a href="mailto:voidtechsolutionsupport@gmail.com" style="color: #8b5cf6; text-decoration: none;">voidtechsolutionsupport@gmail.com</a>.</li>
      </ul>
    </div>
  `;

  const plainTextBody = `Hello ${props.recipientName},

Thank you for contacting VOIDTECH SOLUTION. We have received your project enquiry regarding ${service}.
${props.selectedPackage ? `Selected Package: ${props.selectedPackage}\n` : ""}${props.enquiryId ? `Enquiry Reference ID: ${props.enquiryId}\n` : ""}
NEXT STEPS:
- A Senior Technical Solution Architect is reviewing your specifications.
- We review every enquiry and respond as soon as possible with an initial feasibility assessment and timeline.

If you have urgent questions, reply directly to this email or reach us at voidtechsolutionsupport@gmail.com.`;

  const html = renderBaseEmailLayout({
    title: "Enquiry Confirmation",
    previewText: `Thank you for contacting VOIDTECH SOLUTION regarding ${service}.`,
    contentHtml,
  });

  const text = renderBaseEmailText("Enquiry Confirmation", plainTextBody);

  return { subject, html, text };
}
