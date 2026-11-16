/**
 * VOIDTECH SOLUTION — Email Base Layout & Theme Engine
 * Visual Identity: Deep charcoal/black (#050507, #0a0a0f, #121218), electric purple/violet (#8b5cf6, #7c3aed),
 * crisp typography, and professional tech aesthetic.
 */

export interface EmailLayoutOptions {
  title: string;
  previewText?: string;
  contentHtml: string;
}

export function renderBaseEmailLayout(options: EmailLayoutOptions): string {
  const previewSnippet = options.previewText
    ? `<div style="display:none;font-size:1px;color:#333333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${options.previewText}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #050507; color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  ${previewSnippet}
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #050507;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #0a0a0f; border: 1px solid #1f1f2e; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);">
          
          <!-- BRAND HEADER -->
          <tr>
            <td style="padding: 32px 36px; border-bottom: 1px solid #1a1a26; background: linear-gradient(180deg, #121218 0%, #0a0a0f 100%); text-align: left;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <div style="font-size: 20px; font-weight: 800; letter-spacing: 0.12em; color: #ffffff; text-transform: uppercase;">
                      VOIDTECH <span style="color: #8b5cf6;">SOLUTION</span>
                    </div>
                    <div style="font-size: 11px; font-weight: 500; letter-spacing: 0.16em; color: #9ca3af; text-transform: uppercase; margin-top: 4px;">
                      Build. Launch. Grow Online.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- MAIN CONTENT BODY -->
          <tr>
            <td style="padding: 36px 36px 28px 36px; color: #e5e7eb; font-size: 15px; line-height: 1.6;">
              ${options.contentHtml}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding: 24px 36px; background-color: #050507; border-top: 1px solid #161622; font-size: 12px; line-height: 1.5; color: #6b7280; text-align: left;">
              <p style="margin: 0 0 8px 0; color: #9ca3af;">
                &copy; ${new Date().getFullYear()} <strong>VOIDTECH SOLUTION</strong>. All rights reserved.
              </p>
              <p style="margin: 0 0 8px 0;">
                Premium software development, web applications, autonomous AI automations & scalable cloud systems.
              </p>
              <p style="margin: 0; font-size: 11px; color: #4b5563;">
                This is an automated operational notification dispatched from a verified system endpoint. If you did not initiate this action, please contact VOIDTECH SOLUTION support at <a href="mailto:voidtechsolutionsupport@gmail.com" style="color: #8b5cf6; text-decoration: none;">voidtechsolutionsupport@gmail.com</a>.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Plain-text fallback wrapper formatting.
 */
export function renderBaseEmailText(title: string, bodyText: string): string {
  return `VOIDTECH SOLUTION — Build. Launch. Grow Online.
============================================================
${title.toUpperCase()}
============================================================

${bodyText}

------------------------------------------------------------
(c) ${new Date().getFullYear()} VOIDTECH SOLUTION. All rights reserved.
Official Website: https://voidtechsolution.codedev.co.in
If you did not initiate this action, please contact VOIDTECH SOLUTION support at voidtechsolutionsupport@gmail.com.
============================================================`;
}

