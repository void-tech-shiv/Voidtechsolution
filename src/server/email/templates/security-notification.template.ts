import { renderBaseEmailLayout, renderBaseEmailText } from "./base-layout";

export interface SecurityNotificationTemplateProps {
  recipientName: string;
  eventType: string;
  timestamp?: string;
  ipAddress?: string;
  userAgent?: string;
  actionTaken?: string;
}

export function renderSecurityNotificationEmail(props: SecurityNotificationTemplateProps): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Security Alert: ${props.eventType} — VOIDTECH SOLUTION`;
  const time = props.timestamp || new Date().toUTCString();

  const contentHtml = `
    <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #ffffff;">
      Security Event Detected
    </h2>
    <p style="margin: 0 0 20px 0; color: #9ca3af; font-size: 14px;">
      Hello <strong>${props.recipientName}</strong>,
    </p>
    <p style="margin: 0 0 24px 0; color: #d1d5db; font-size: 15px;">
      This is an automated operational alert regarding a security event registered on your VOIDTECH SOLUTION account.
    </p>

    <!-- EVENT METADATA TABLE -->
    <table role="presentation" border="0" cellpadding="8" cellspacing="0" width="100%" style="background-color: #121218; border: 1px solid #1f1f2e; border-radius: 8px; font-size: 14px; margin-bottom: 24px;">
      <tr>
        <td width="30%" style="color: #ef4444; font-weight: 600; border-bottom: 1px solid #1a1a26;">Event Type:</td>
        <td style="color: #ffffff; font-weight: 700; border-bottom: 1px solid #1a1a26;">${props.eventType}</td>
      </tr>
      <tr>
        <td style="color: #9ca3af; font-weight: 600; border-bottom: 1px solid #1a1a26;">Timestamp:</td>
        <td style="color: #ffffff; border-bottom: 1px solid #1a1a26;">${time}</td>
      </tr>
      <tr>
        <td style="color: #9ca3af; font-weight: 600; border-bottom: 1px solid #1a1a26;">Origin IP:</td>
        <td style="color: #ffffff; font-family: monospace; border-bottom: 1px solid #1a1a26;">${props.ipAddress || "Unknown"}</td>
      </tr>
      <tr>
        <td style="color: #9ca3af; font-weight: 600; border-bottom: 1px solid #1a1a26;">User Agent:</td>
        <td style="color: #ffffff; font-size: 12px; font-family: monospace; border-bottom: 1px solid #1a1a26;">${props.userAgent || "Unknown"}</td>
      </tr>
      ${
        props.actionTaken
          ? `<tr>
              <td style="color: #8b5cf6; font-weight: 600;">System Action:</td>
              <td style="color: #a855f7; font-weight: 600;">${props.actionTaken}</td>
            </tr>`
          : ""
      }
    </table>

    <div style="margin: 24px 0 0 0; padding: 14px 18px; background-color: #1f1315; border-left: 3px solid #ef4444; border-radius: 4px; font-size: 13px; color: #fca5a5;">
      <strong>Action Required:</strong> If you did not recognize or initiate this activity, please revoke your active sessions immediately and contact our security operations center at <a href="mailto:security@voidtechsolution.com" style="color: #f87171; text-decoration: underline;">security@voidtechsolution.com</a>.
    </div>
  `;

  const plainTextBody = `SECURITY ALERT: ${props.eventType}
============================================================
Hello ${props.recipientName},

A security event was registered on your VOIDTECH SOLUTION account.

Event:        ${props.eventType}
Timestamp:    ${time}
Origin IP:    ${props.ipAddress || "Unknown"}
User Agent:   ${props.userAgent || "Unknown"}
${props.actionTaken ? `Action Taken: ${props.actionTaken}\n` : ""}
If this was not you, please contact security@voidtechsolution.com immediately.`;

  const html = renderBaseEmailLayout({
    title: `Security Alert: ${props.eventType}`,
    previewText: `Security event detected: ${props.eventType} on your account.`,
    contentHtml,
  });

  const text = renderBaseEmailText(`Security Alert: ${props.eventType}`, plainTextBody);

  return { subject, html, text };
}

