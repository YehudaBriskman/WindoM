import { z } from 'zod';
import type { FastifyRequest, FastifyReply } from 'fastify';
import * as authEmailService from '../services/auth-email.service.js';

// ── Shared page shell ──────────────────────────────────────────────────────
// Full glass-morphism page: animated gradient blobs + backdrop-filter card.
// Used for reset-password and verify-email browser pages.

function buildPage(opts: {
  title: string;
  body: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>WindoM — ${opts.title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
      background: #07080f;
      color: #e0e4f0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      overflow: hidden;
      position: relative;
    }

    /* ── Animated blob background ── */
    .bg {
      position: fixed;
      inset: 0;
      z-index: 0;
      overflow: hidden;
    }
    .blob {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.55;
      animation: drift 18s ease-in-out infinite alternate;
    }
    .blob-1 {
      width: 600px; height: 600px;
      background: radial-gradient(circle, rgba(88,72,255,0.7), rgba(88,72,255,0.1));
      top: -200px; left: -150px;
      animation-duration: 20s;
    }
    .blob-2 {
      width: 500px; height: 500px;
      background: radial-gradient(circle, rgba(139,55,255,0.6), rgba(139,55,255,0.05));
      bottom: -180px; right: -100px;
      animation-duration: 25s;
      animation-direction: alternate-reverse;
    }
    .blob-3 {
      width: 350px; height: 350px;
      background: radial-gradient(circle, rgba(56,100,255,0.45), transparent);
      top: 40%; left: 55%;
      animation-duration: 30s;
    }
    @keyframes drift {
      0%   { transform: translate(0, 0) scale(1); }
      33%  { transform: translate(40px, -60px) scale(1.07); }
      66%  { transform: translate(-30px, 30px) scale(0.95); }
      100% { transform: translate(20px, -20px) scale(1.04); }
    }

    /* ── Glass card ── */
    .card {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 440px;
      background: rgba(12, 13, 26, 0.65);
      backdrop-filter: blur(24px) saturate(1.4);
      -webkit-backdrop-filter: blur(24px) saturate(1.4);
      border: 1px solid rgba(255, 255, 255, 0.10);
      border-radius: 24px;
      padding: 44px 40px;
      box-shadow:
        0 0 0 1px rgba(88, 72, 255, 0.08),
        0 24px 64px rgba(0, 0, 0, 0.55),
        inset 0 1px 0 rgba(255,255,255,0.06);
    }

    /* ── Logo ── */
    .logo {
      display: inline-flex;
      align-items: center;
      background: linear-gradient(135deg, #5448ff, #8b37ff);
      border-radius: 12px;
      padding: 8px 16px;
      margin-bottom: 32px;
      font-size: 18px;
      font-weight: 700;
      color: #fff;
      letter-spacing: -0.4px;
      box-shadow: 0 4px 20px rgba(84, 72, 255, 0.4);
    }

    h1 {
      font-size: 26px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.6px;
      line-height: 1.25;
      margin-bottom: 12px;
    }

    .subtitle {
      font-size: 15px;
      color: rgba(176, 184, 204, 0.85);
      line-height: 1.6;
      margin-bottom: 32px;
    }

    /* ── Form elements ── */
    .field {
      margin-bottom: 16px;
    }
    input[type="password"] {
      width: 100%;
      padding: 13px 16px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 12px;
      color: #e0e4f0;
      font-family: inherit;
      font-size: 15px;
      transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
      outline: none;
    }
    input[type="password"]::placeholder {
      color: rgba(176, 184, 204, 0.4);
    }
    input[type="password"]:focus {
      background: rgba(255, 255, 255, 0.09);
      border-color: rgba(84, 72, 255, 0.7);
      box-shadow: 0 0 0 3px rgba(84, 72, 255, 0.18);
    }

    button[type="submit"] {
      width: 100%;
      padding: 14px;
      margin-top: 8px;
      background: linear-gradient(135deg, #5448ff 0%, #8b37ff 100%);
      border: none;
      border-radius: 12px;
      color: #ffffff;
      font-family: inherit;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      letter-spacing: 0.1px;
      box-shadow: 0 4px 24px rgba(84, 72, 255, 0.45), 0 2px 8px rgba(0,0,0,0.3);
      transition: opacity 0.15s, transform 0.15s, box-shadow 0.15s;
    }
    button[type="submit"]:hover {
      opacity: 0.9;
      transform: translateY(-1px);
      box-shadow: 0 6px 32px rgba(84, 72, 255, 0.55), 0 2px 8px rgba(0,0,0,0.3);
    }
    button[type="submit"]:active {
      transform: translateY(0);
      opacity: 1;
    }

    /* ── States ── */
    .msg-error {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      background: rgba(239, 68, 68, 0.10);
      border: 1px solid rgba(239, 68, 68, 0.25);
      border-radius: 10px;
      padding: 12px 14px;
      font-size: 14px;
      color: rgba(255, 160, 160, 0.95);
      margin-bottom: 24px;
      line-height: 1.5;
    }
    .msg-success {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      background: rgba(34, 197, 94, 0.10);
      border: 1px solid rgba(34, 197, 94, 0.20);
      border-radius: 10px;
      padding: 14px 16px;
      font-size: 15px;
      color: rgba(134, 239, 172, 0.95);
      line-height: 1.6;
    }
    .icon { font-size: 18px; flex-shrink: 0; margin-top: 1px; }
  </style>
</head>
<body>

  <!-- Animated background -->
  <div class="bg" aria-hidden="true">
    <div class="blob blob-1"></div>
    <div class="blob blob-2"></div>
    <div class="blob blob-3"></div>
  </div>

  <!-- Glass card -->
  <div class="card">
    <div class="logo">WindoM</div>
    ${opts.body}
  </div>

</body>
</html>`;
}

// ── Page bodies ────────────────────────────────────────────────────────────

function resetFormBody(token: string): string {
  return `
    <h1>Reset your password</h1>
    <p class="subtitle">Enter a new password for your WindoM account.</p>
    <form method="POST" action="/auth/reset-password">
      <input type="hidden" name="token" value="${token}" />
      <div class="field">
        <input
          type="password"
          name="newPassword"
          placeholder="New password — min 8 characters"
          required
          minlength="8"
          autocomplete="new-password"
          autofocus
        />
      </div>
      <button type="submit">Update password &nbsp;→</button>
    </form>`;
}

function resetErrorBody(message: string): string {
  return `
    <h1>Reset password</h1>
    <div class="msg-error">
      <span class="icon">⚠</span>
      <span>${message} Request a new link from the WindoM extension.</span>
    </div>`;
}

function resetSuccessBody(): string {
  return `
    <h1>Password updated</h1>
    <div class="msg-success">
      <span class="icon">✓</span>
      <span>Your password has been changed successfully. You can close this tab and sign in to WindoM.</span>
    </div>`;
}

function verifySuccessBody(): string {
  return `
    <h1>Email verified</h1>
    <div class="msg-success">
      <span class="icon">✓</span>
      <span>Your email address has been verified. You're all set — close this tab and return to WindoM.</span>
    </div>`;
}

function verifyErrorBody(message: string): string {
  return `
    <h1>Verification failed</h1>
    <div class="msg-error">
      <span class="icon">⚠</span>
      <span>${message}</span>
    </div>`;
}

// ── Controllers ────────────────────────────────────────────────────────────

export async function resendVerificationController(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const result = await authEmailService.sendVerification(req.user.sub);
  if (result === 'already_verified') {
    void reply.status(400).send({ error: 'ALREADY_VERIFIED', message: 'Email is already verified' });
    return;
  }
  void reply.send({ ok: true });
}

export async function verifyEmailController(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { token } = req.query as { token?: string };
  if (!token) {
    void reply.type('text/html').send(buildPage({ title: 'Verification Failed', body: verifyErrorBody('Missing verification token.') }));
    return;
  }
  const result = await authEmailService.verifyEmail(token);
  if (result === 'invalid') {
    void reply.type('text/html').send(buildPage({ title: 'Verification Failed', body: verifyErrorBody('This verification link is invalid or has expired. Request a new one from the WindoM extension.') }));
    return;
  }
  void reply.type('text/html').send(buildPage({ title: 'Email Verified', body: verifySuccessBody() }));
}

const forgotSchema = z.object({ email: z.string().email() });

export async function forgotPasswordController(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const parsed = forgotSchema.safeParse(req.body);
  if (!parsed.success) {
    void reply.send({ ok: true });
    return;
  }
  void authEmailService.sendPasswordReset(parsed.data.email).catch((err) => {
    console.error('[forgotPassword] email send failed:', err);
  });
  void reply.send({ ok: true });
}

export async function resetPasswordPageController(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { token } = req.query as { token?: string };
  if (!token) {
    void reply.type('text/html').send(buildPage({ title: 'Reset Password', body: resetErrorBody('Missing reset token.') }));
    return;
  }
  void reply.type('text/html').send(buildPage({ title: 'Reset Password', body: resetFormBody(token) }));
}

const resetSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
});

export async function resetPasswordController(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const raw = req.body as Record<string, unknown>;
  const parsed = resetSchema.safeParse(raw);
  const isHtml = (req.headers['content-type'] ?? '').includes('application/x-www-form-urlencoded');

  if (!parsed.success) {
    if (isHtml) {
      void reply.type('text/html').send(buildPage({ title: 'Reset Password', body: resetErrorBody('Password must be at least 8 characters.') }));
    } else {
      void reply.status(400).send({ error: 'Bad Request', message: parsed.error.issues[0]?.message });
    }
    return;
  }

  const result = await authEmailService.resetPassword(parsed.data.token, parsed.data.newPassword);

  if (result === 'invalid') {
    if (isHtml) {
      void reply.type('text/html').send(buildPage({ title: 'Reset Password', body: resetErrorBody('This reset link is invalid or has expired.') }));
    } else {
      void reply.status(400).send({ error: 'INVALID_TOKEN', message: 'Reset link is invalid or has expired' });
    }
    return;
  }

  if (isHtml) {
    void reply.type('text/html').send(buildPage({ title: 'Password Updated', body: resetSuccessBody() }));
  } else {
    void reply.send({ ok: true });
  }
}
