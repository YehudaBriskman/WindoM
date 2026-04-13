import nodemailer from 'nodemailer';
import { config } from '../config.js';

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
// All styles are inline for maximum email client compatibility.
// The outer wrapper uses a dark gradient; the card sits centred on top.

function buildEmail(opts: {
  preheader: string;
  heading: string;
  bodyLines: string[];
  ctaLabel: string;
  ctaUrl: string;
  footerNote?: string;
}): string {
  const { preheader, heading, bodyLines, ctaLabel, ctaUrl, footerNote } = opts;

  const bodyHtml = bodyLines
    .map(
      (line) =>
        `<p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;color:#c8cdd8;">${line}</p>`,
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${heading}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    body, table, td, a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    table, td { mso-table-lspace:0; mso-table-rspace:0; }
    img { -ms-interpolation-mode:bicubic; border:0; height:auto; outline:none; text-decoration:none; }
    body { margin:0; padding:0; background-color:#0d0f1a; }
    .preheader { display:none!important; visibility:hidden; mso-hide:all; font-size:1px; color:#0d0f1a; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden; }
    a.cta-btn:hover { background: linear-gradient(135deg,#6a7cff,#a78bfa)!important; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#0d0f1a;font-family:'Inter',ui-sans-serif,system-ui,-apple-system,sans-serif;">

  <!-- preheader hidden text -->
  <span class="preheader">${preheader}&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;</span>

  <!-- outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d0f1a;background-image:linear-gradient(135deg,#0d0f1a 0%,#131629 50%,#0d1020 100%);min-height:100vh;">
    <tr>
      <td align="center" style="padding:48px 16px;">

        <!-- card -->
        <table role="presentation" width="100%" style="max-width:540px;" cellpadding="0" cellspacing="0">

          <!-- logo row -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#4f63ff,#7c3aed);border-radius:14px;padding:10px 14px;">
                    <span style="font-family:'Inter',sans-serif;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;white-space:nowrap;">WindoM</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- main card -->
          <tr>
            <td style="background:linear-gradient(160deg,rgba(255,255,255,0.07) 0%,rgba(255,255,255,0.03) 100%);border:1px solid rgba(255,255,255,0.10);border-radius:20px;padding:48px 40px;backdrop-filter:blur(12px);">

              <!-- heading -->
              <h1 style="margin:0 0 24px 0;font-size:26px;font-weight:700;line-height:1.3;color:#ffffff;letter-spacing:-0.5px;">${heading}</h1>

              <!-- body -->
              ${bodyHtml}

              <!-- CTA button -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:32px 0 0 0;">
                <tr>
                  <td style="border-radius:12px;background:linear-gradient(135deg,#4f63ff,#7c3aed);box-shadow:0 4px 24px rgba(79,99,255,0.35);">
                    <a href="${ctaUrl}" class="cta-btn" target="_blank"
                       style="display:inline-block;padding:14px 32px;font-family:'Inter',sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.1px;border-radius:12px;background:linear-gradient(135deg,#4f63ff,#7c3aed);">
                      ${ctaLabel}
                    </a>
                  </td>
                </tr>
              </table>

              <!-- fallback link -->
              <p style="margin:20px 0 0 0;font-size:13px;color:#666d7f;line-height:1.5;">
                Button not working? Copy and paste this link into your browser:<br/>
                <a href="${ctaUrl}" style="color:#7a8aff;word-break:break-all;text-decoration:none;">${ctaUrl}</a>
              </p>

              ${
                footerNote
                  ? `<!-- footer note inside card -->
              <p style="margin:28px 0 0 0;padding-top:24px;border-top:1px solid rgba(255,255,255,0.07);font-size:13px;color:#4d5465;line-height:1.5;">${footerNote}</p>`
                  : ''
              }

            </td>
          </tr>

          <!-- below-card footer -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0;font-size:12px;color:#3d4255;line-height:1.6;">
                &copy; ${new Date().getFullYear()} WindoM &nbsp;&bull;&nbsp; You're receiving this because you have an account at windom.app<br/>
                If you didn't request this, you can safely ignore this email.
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

// ── Core send ──────────────────────────────────────────────────────────────

async function send(to: string, subject: string, html: string): Promise<void> {
  if (!transporter) {
    console.warn(`[email] SMTP not configured — skipping email to ${to}: "${subject}"`);
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
      heading: `Welcome${name ? `, ${name}` : ''} — verify your email`,
      bodyLines: [
        'Thanks for creating a WindoM account! Before you can use all features, please verify your email address.',
        'This link expires in <strong style="color:#ffffff;">24 hours</strong>.',
      ],
      ctaLabel: 'Verify Email Address',
      ctaUrl: url,
      footerNote: "Didn't create a WindoM account? No action needed — this email was sent in error.",
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
        'Click the button below to choose a new password. This link expires in <strong style="color:#ffffff;">1 hour</strong>.',
      ],
      ctaLabel: 'Reset Password',
      ctaUrl: url,
      footerNote: "Didn't request a password reset? Your account is safe — you can ignore this email.",
    }),
  );
}

export async function sendGoogleOnlyResetEmail(to: string, name: string): Promise<void> {
  await send(
    to,
    'WindoM — no password on this account',
    buildEmail({
      preheader: 'Your WindoM account uses Google sign-in.',
      heading: 'This account uses Google sign-in',
      bodyLines: [
        `Hi${name ? ` ${name}` : ''}, your WindoM account was created with Google and doesn't have a separate password.`,
        'To access your account, click the button below and sign in with your Google account.',
      ],
      ctaLabel: 'Sign in with Google',
      ctaUrl: `${config.APP_URL.replace('/api', '')}`,
      footerNote: "If you didn't make this request, your account is safe — no changes were made.",
    }),
  );
}
