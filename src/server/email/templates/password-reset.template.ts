import { renderBaseEmailLayout, renderBaseEmailText } from "./base-layout";

export interface PasswordResetTemplateProps {
  resetUrl: string;
  recipientName?: string;
  expiresInMinutes?: number;
}

export function renderPasswordResetEmail(props: PasswordResetTemplateProps): {
  subject: string;
  html: string;
  text: string;
} {
  const expiry = props.expiresInMinutes || 15;
  const name = props.recipientName || "Valued User";
  const subject = "Password Reset Request — VOIDTECH SOLUTION";

  const contentHtml = `
    <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #ffffff;">
      Password Reset Request
    </h2>
    <p style="margin: 0 0 20px 0; color: #9ca3af; font-size: 14px;">
      Hello <strong>${name}</strong>,
    </p>
    <p style="margin: 0 0 24px 0; color: #d1d5db; font-size: 15px;">
      We received a request to reset the password associated with your VOIDTECH SOLUTION account. Click the button below to establish a new secure credential:
    </p>

    <!-- ACTION BUTTON -->
    <div style="margin: 32px 0; text-align: center;">
      <a href="${props.resetUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; border-radius: 8px; letter-spacing: 0.05em; text-transform: uppercase; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.4);">
        Reset My Password
      </a>
    </div>

    <p style="margin: 24px 0 12px 0; font-size: 13px; color: #9ca3af;">
      If the button above does not work, copy and paste this link into your browser:
    </p>
    <div style="padding: 12px; background-color: #121218; border: 1px solid #1f1f2e; border-radius: 6px; font-family: monospace; font-size: 12px; color: #a855f7; word-break: break-all;">
      ${props.resetUrl}
    </div>

    <div style="margin: 28px 0 0 0; padding: 14px 18px; background-color: #1a1625; border-left: 3px solid #8b5cf6; border-radius: 4px; font-size: 13px; color: #c4b5fd;">
      <strong>Note:</strong> This link expires in ${expiry} minutes. If you did not request a password reset, no action is required; your account password remains unchanged.
    </div>
  `;

  const plainTextBody = `Hello ${name},

We received a request to reset the password for your VOIDTECH SOLUTION account.

RESET URL:
${props.resetUrl}

This reset link is valid for ${expiry} minutes only.

If you did not request this password reset, please ignore this email or notify security@voidtechsolution.com.`;

  const html = renderBaseEmailLayout({
    title: "Password Reset Request",
    previewText: `Reset your VOIDTECH SOLUTION password. Link expires in ${expiry} minutes.`,
    contentHtml,
  });

  const text = renderBaseEmailText("Password Reset Request", plainTextBody);

  return { subject, html, text };
}

