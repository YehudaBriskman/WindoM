import nodemailer from 'nodemailer';
import { config } from '../config.js';
import { logger } from './logger.js';

// ── Transporter (singleton) ────────────────────────────────────────────────

const transporter =
  config.SMTP_USER && config.SMTP_PASS
    ? nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: config.SMTP_USER,
          pass: config.SMTP_PASS,
        },
      })
    : null;

// ── HTML shell ─────────────────────────────────────────────────────────────
// 600px wide — the email standard width.
// Background: layered radial gradients to simulate glowing orbs on dark bg.
// A <div> wrapper inside each <td> carries the gradient (Gmail ignores
// background-image on tables but renders it on divs).
// Outlook sees only the bgcolor fallback — clean dark, still readable.

function buildEmail(opts: {
  preheader: string;
  heading: string;
  bodyLines: string[];
  ctaLabel: string;
  ctaUrl: string;
  footerNote?: string;
}): string {
  const { preheader, heading, bodyLines, ctaLabel, ctaUrl, footerNote } = opts;
  const year = new Date().getFullYear();

  const bodyHtml = bodyLines
    .map(
      (line) =>
        `<p style="margin:0 0 20px 0;font-size:16px;line-height:1.7;color:#b0b8cc;">${line}</p>`,
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <title>${heading}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
    table,td{mso-table-lspace:0pt;mso-table-rspace:0pt}
    img{-ms-interpolation-mode:bicubic;border:0;height:auto;line-height:100%;outline:none;text-decoration:none}
    body{margin:0;padding:0;background-color:#07080f}
    .preheader{display:none!important;visibility:hidden;mso-hide:all;font-size:1px;color:#07080f;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden}
    /* Hover on CTA — works in Apple Mail / web clients */
    .cta-btn:hover{opacity:0.88!important}
  </style>
</head>
<body style="margin:0;padding:0;background-color:#07080f;font-family:'Inter',ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,sans-serif;">

  <!-- ░ Preheader ░ -->
  <div class="preheader" aria-hidden="true">${preheader}&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;</div>

  <!-- ░░ OUTER WRAPPER ░░ -->
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center" bgcolor="#07080f" style="padding:40px 16px 48px;">

        <!-- ░░ CONTENT TABLE — 600px ░░ -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%;">

          <!-- ═══ HERO ZONE ═══ -->
          <tr>
            <td bgcolor="#07080f" style="border-radius:20px 20px 0 0;overflow:hidden;padding:0;">
              <!--[if !mso]><!-->
              <div style="
                background-color:#07080f;
                background-image:
                  radial-gradient(ellipse 80% 100% at 15% -10%, rgba(88,72,255,0.55) 0%, transparent 55%),
                  radial-gradient(ellipse 60% 80% at 85% 10%,  rgba(139,55,255,0.40) 0%, transparent 50%),
                  radial-gradient(ellipse 50% 60% at 50% 120%, rgba(30,28,80,0.70)  0%, transparent 60%);
                padding:52px 48px 44px;
                text-align:center;">
              <!--<![endif]-->
              <!--[if mso]><div style="background:#07080f;padding:52px 48px 44px;text-align:center;"><![endif]-->

                <!-- Logo pill -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto;">
                  <tr>
                    <td style="background:linear-gradient(135deg,#5448ff 0%,#8b37ff 100%);border-radius:14px;padding:11px 20px;mso-padding-alt:11px 20px;">
                      <span style="font-family:'Inter',sans-serif;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.6px;white-space:nowrap;mso-line-height-rule:exactly;line-height:28px;">WindoM</span>
                    </td>
                  </tr>
                </table>

                <!-- Heading -->
                <h1 style="margin:36px 0 0 0;font-family:'Inter',sans-serif;font-size:34px;font-weight:700;line-height:1.25;color:#ffffff;letter-spacing:-0.8px;mso-line-height-rule:exactly;">${heading}</h1>

              </div>
            </td>
          </tr>

          <!-- ═══ BODY CARD ═══ -->
          <tr>
            <td bgcolor="#0c0d1a" style="border-left:1px solid rgba(255,255,255,0.08);border-right:1px solid rgba(255,255,255,0.08);border-bottom:1px solid rgba(255,255,255,0.08);border-radius:0 0 20px 20px;padding:40px 48px 44px;">

              <!-- Body text -->
              ${bodyHtml}

              <!-- CTA button — full width inside card, centered -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin:32px 0 0 0;">
                <tr>
                  <td align="center">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="border-radius:12px;background:linear-gradient(135deg,#5448ff 0%,#8b37ff 100%);box-shadow:0 0 32px rgba(84,72,255,0.45),0 4px 16px rgba(0,0,0,0.4);">
                          <a href="${ctaUrl}"
                             class="cta-btn"
                             target="_blank"
                             style="display:inline-block;padding:16px 48px;font-family:'Inter',sans-serif;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.1px;border-radius:12px;white-space:nowrap;mso-padding-alt:16px 48px;">
                            ${ctaLabel} &nbsp;→
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin:36px 0 0 0;">
                <tr>
                  <td style="border-top:1px solid rgba(255,255,255,0.07);font-size:1px;line-height:1px;">&nbsp;</td>
                </tr>
              </table>

              <!-- Fallback URL -->
              <p style="margin:20px 0 0 0;font-size:13px;line-height:1.6;color:#50566a;">
                Button not working? Paste this URL into your browser:<br/>
                <a href="${ctaUrl}" style="color:#6e7bff;text-decoration:none;word-break:break-all;">${ctaUrl}</a>
              </p>

              ${footerNote ? `
              <!-- Divider -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin:28px 0 0 0;">
                <tr><td style="border-top:1px solid rgba(255,255,255,0.06);font-size:1px;line-height:1px;">&nbsp;</td></tr>
              </table>
              <p style="margin:20px 0 0 0;font-size:13px;line-height:1.6;color:#3e4457;">${footerNote}</p>
              ` : ''}

            </td>
          </tr>

          <!-- ═══ FOOTER ═══ -->
          <tr>
            <td align="center" style="padding:28px 0 0 0;">
              <p style="margin:0;font-size:12px;line-height:1.7;color:#2e3247;">
                &copy; ${year} WindoM &nbsp;·&nbsp; windom.app<br/>
                You're receiving this because you signed up for a WindoM account.
              </p>
            </td>
          </tr>

        </table>
        <!-- /CONTENT TABLE -->

      </td>
    </tr>
  </table>

</body>
</html>`;
}

// ── Core send ──────────────────────────────────────────────────────────────

async function send(to: string, subject: string, html: string): Promise<void> {
  if (!transporter) {
    logger.warn({ to, subject }, 'email: SMTP not configured — skipping send');
    return;
  }
  await transporter.sendMail({
    from: `"WindoM" <${config.FROM_EMAIL}>`,
    to,
    subject,
    html,
  });
}

// ── Email templates ────────────────────────────────────────────────────────

export async function sendVerificationEmail(to: string, name: string, token: string): Promise<void> {
  const url = `${config.APP_URL}/auth/verify-email?token=${token}`;
  await send(
    to,
    'Verify your WindoM email',
    buildEmail({
      preheader: 'One click to verify your email and get started with WindoM.',
      heading: `Welcome${name ? `, ${name}` : ''} 👋`,
      bodyLines: [
        'Thanks for creating a WindoM account. Before you get started, please verify your email address by clicking the button below.',
        'This link expires in <strong style="color:#e0e4f0;font-weight:600;">24 hours</strong>.',
      ],
      ctaLabel: 'Verify Email Address',
      ctaUrl: url,
      footerNote: "Didn't create a WindoM account? You can safely ignore this email.",
    }),
  );
}

export async function sendPasswordResetEmail(to: string, name: string, token: string): Promise<void> {
  const url = `${config.APP_URL}/auth/reset-password?token=${token}`;
  await send(
    to,
    'Reset your WindoM password',
    buildEmail({
      preheader: 'Someone requested a password reset for your WindoM account.',
      heading: 'Reset your password',
      bodyLines: [
        `Hi${name ? ` ${name}` : ''}, we received a request to reset the password for your WindoM account.`,
        'Click the button below to choose a new password. This link expires in <strong style="color:#e0e4f0;font-weight:600;">1 hour</strong>.',
      ],
      ctaLabel: 'Reset Password',
      ctaUrl: url,
      footerNote: "Didn't request this? Your account is safe — no changes have been made.",
    }),
  );
}

export async function sendGoogleOnlyResetEmail(to: string, name: string): Promise<void> {
  await send(
    to,
    'WindoM — this account uses Google sign-in',
    buildEmail({
      preheader: 'Your WindoM account uses Google sign-in — no password needed.',
      heading: 'No password on this account',
      bodyLines: [
        `Hi${name ? ` ${name}` : ''}, your WindoM account was created with Google sign-in and doesn't have a separate password.`,
        'Use the button below to sign in with your Google account instead.',
      ],
      ctaLabel: 'Sign in with Google',
      ctaUrl: `${config.APP_URL}`,
      footerNote: "Didn't request this? Your account is safe — no changes have been made.",
    }),
  );
}
