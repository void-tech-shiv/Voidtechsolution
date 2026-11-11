import { renderBaseEmailLayout, renderBaseEmailText } from "./base-layout";

export interface EnquiryStatusUpdateTemplateProps {
  recipientName: string;
  enquiryId: string;
  oldStatus: string;
  newStatus: string;
  notes?: string;
}

export function renderEnquiryStatusUpdateEmail(props: EnquiryStatusUpdateTemplateProps): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Update on Your Enquiry [${props.enquiryId.slice(-8).toUpperCase()}] — VOIDTECH SOLUTION`;

  const contentHtml = `
    <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #ffffff;">
      Enquiry Status Update
    </h2>
    <p style="margin: 0 0 20px 0; color: #9ca3af; font-size: 14px;">
      Hello <strong>${props.recipientName}</strong>,
    </p>
    <p style="margin: 0 0 24px 0; color: #d1d5db; font-size: 15px;">
      The status of your enquiry has been updated by our engineering and project management team.
    </p>

    <!-- STATUS TRANSITION BADGE -->
    <div style="margin: 24px 0; padding: 20px; background-color: #121218; border: 1px solid #1f1f2e; border-radius: 8px; text-align: center;">
      <div style="font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">
        Current Project Status
      </div>
      <div style="display: inline-block; padding: 8px 24px; background-color: #1a1625; border: 1px solid #7c3aed; border-radius: 9999px; font-size: 16px; font-weight: 800; color: #a855f7; letter-spacing: 0.08em; text-transform: uppercase;">
        ${props.newStatus}
      </div>
      <div style="margin-top: 10px; font-size: 12px; color: #6b7280;">
        Previous state: ${props.oldStatus}
      </div>
    </div>

    ${
      props.notes
        ? `<div style="margin: 20px 0; padding: 18px; background-color: #0d0d14; border-left: 3px solid #8b5cf6; border-radius: 4px;">
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #8b5cf6; margin-bottom: 8px;">
              Architect / Project Notes:
            </div>
            <div style="color: #d1d5db; font-size: 14px; line-height: 1.6;">${props.notes}</div>
          </div>`
        : ""
    }

    <p style="margin: 24px 0 0 0; font-size: 14px; color: #9ca3af;">
      If you have questions regarding this update or want to attach updated technical specs, feel free to reply directly to this email.
    </p>
  `;

  const plainTextBody = `Hello ${props.recipientName},

The status of your enquiry (${props.enquiryId}) has been updated.

CURRENT STATUS: ${props.newStatus}
PREVIOUS STATUS: ${props.oldStatus}
${props.notes ? `\nARCHITECT NOTES:\n${props.notes}\n` : ""}

Reply to contact@voidtechsolution.com with any questions.`;

  const html = renderBaseEmailLayout({
    title: "Enquiry Status Update",
    previewText: `Your enquiry status is now ${props.newStatus}.`,
    contentHtml,
  });

  const text = renderBaseEmailText("Enquiry Status Update", plainTextBody);

  return { subject, html, text };
}
