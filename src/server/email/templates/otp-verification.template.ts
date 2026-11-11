import { renderBaseEmailLayout, renderBaseEmailText } from "./base-layout";

export interface OtpVerificationTemplateProps {
  code: string;
  recipientName?: string;
  purpose?: string;
  expiresInMinutes?: number;
}

export function renderOtpVerificationEmail(props: OtpVerificationTemplateProps): {
  subject: string;
  html: string;
  text: string;
} {
  const expiry = props.expiresInMinutes || 5;
  const name = props.recipientName || "Valued User";
  const purposeText = props.purpose ? ` (${props.purpose})` : "";
  const subject = `Your Verification Code: ${props.code} — VOIDTECH SOLUTION`;

  const contentHtml = `
    <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #ffffff;">
      Verification Code
    </h2>
    <p style="margin: 0 0 20px 0; color: #9ca3af; font-size: 14px;">
      Hello <strong>${name}</strong>,
    </p>
    <p style="margin: 0 0 24px 0; color: #d1d5db; font-size: 15px;">
      You requested a single-use verification code${purposeText} for your VOIDTECH SOLUTION account session. Use the 6-digit code below to complete authorization:
    </p>

    <!-- CODE CONTAINER -->
    <div style="margin: 28px 0; padding: 24px; background-color: #121218; border: 1px solid #7c3aed; border-radius: 8px; text-align: center;">
      <div style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 0.25em; color: #a855f7; text-shadow: 0 0 12px rgba(168, 85, 247, 0.4);">
        ${props.code}
      </div>
      <div style="margin-top: 10px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #9ca3af;">
        Valid for ${expiry} minutes only
      </div>
    </div>

    <div style="margin: 24px 0 0 0; padding: 14px 18px; background-color: #1a1625; border-left: 3px solid #8b5cf6; border-radius: 4px; font-size: 13px; color: #c4b5fd;">
      <strong>Security Notice:</strong> Never share this code with anyone. VOIDTECH SOLUTION engineers and support personnel will never request your code via email, phone, or chat.
    </div>
  `;

  const plainTextBody = `Hello ${name},

You requested a single-use verification code${purposeText} for your VOIDTECH SOLUTION account.

YOUR 6-DIGIT VERIFICATION CODE:
${props.code}

This code is single-use and will expire in ${expiry} minutes.

SECURITY NOTICE:
Never share this code with anyone. VOIDTECH SOLUTION engineers will never ask for your code.
If you did not request this verification, please contact security@voidtechsolution.com.`;

  const html = renderBaseEmailLayout({
    title: "Account Verification Code",
    previewText: `Your verification code is ${props.code}. Valid for ${expiry} minutes.`,
    contentHtml,
  });

  const text = renderBaseEmailText("Account Verification Code", plainTextBody);

  return { subject, html, text };
}

