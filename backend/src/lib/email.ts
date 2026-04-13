import nodemailer from 'nodemailer';
import { config } from '../config.js';

// ── Transporter (singleton) ────────────────────────────────────────────────
// Created once at module load. If SMTP credentials are not set (local dev),
// all send calls fall back to a console.warn so the app still runs fine.

const transporter =
  config.SMTP_USER && config.SMTP_PASS
    ? nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // SSL — required for port 465
        auth: {
          user: config.SMTP_USER,
          pass: config.SMTP_PASS,
        },
      })
    : null;

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
    `<p>Hi ${name || 'there'},</p>
<p>Click the link below to verify your email address. The link expires in 24 hours.</p>
<p><a href="${url}">${url}</a></p>
<p>If you didn't create a WindoM account, you can ignore this email.</p>`,
  );
}

export async function sendPasswordResetEmail(to: string, name: string, token: string): Promise<void> {
  const url = `${config.APP_URL}/auth/reset-password?token=${token}`;
  await send(
    to,
    'Reset your WindoM password',
    `<p>Hi ${name || 'there'},</p>
<p>Click the link below to reset your password. The link expires in 1 hour.</p>
<p><a href="${url}">${url}</a></p>
<p>If you didn't request a password reset, you can ignore this email.</p>`,
  );
}

export async function sendGoogleOnlyResetEmail(to: string, name: string): Promise<void> {
  await send(
    to,
    'WindoM password reset',
    `<p>Hi ${name || 'there'},</p>
<p>Your WindoM account uses Google sign-in and doesn't have a password. Sign in with your Google account instead.</p>`,
  );
}
