import { z } from 'zod';
import type { FastifyRequest, FastifyReply } from 'fastify';
import * as authEmailService from '../services/auth-email.service.js';

const resetPageHtml = (opts: { success?: boolean; error?: string; token?: string }) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WindoM — ${opts.success ? 'Password Updated' : 'Reset Password'}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #0f0f13; color: #e0e0e0; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; }
    .card { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 32px; max-width: 420px; width: 100%; }
    h1 { font-size: 20px; font-weight: 600; margin-bottom: 16px; }
    p { font-size: 14px; color: rgba(255,255,255,0.65); line-height: 1.6; margin-bottom: 16px; }
    input { width: 100%; padding: 10px 12px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: #e0e0e0; font-size: 14px; margin-bottom: 8px; }
    input:focus { outline: none; border-color: rgba(255,255,255,0.4); }
    button { width: 100%; padding: 10px; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: #e0e0e0; font-size: 14px; cursor: pointer; margin-top: 8px; }
    button:hover { background: rgba(255,255,255,0.18); }
    .error { color: rgba(239,100,100,0.95); font-size: 13px; margin-bottom: 12px; }
    .success { color: rgba(120,220,140,0.95); }
  </style>
</head>
<body>
  <div class="card">
    ${opts.success
      ? `<h1>Password updated</h1><p class="success">Your password has been changed. Return to the WindoM extension and sign in.</p>`
      : opts.error
        ? `<h1>Reset password</h1><p class="error">${opts.error}</p><p>The reset link may have expired. <a href="#" style="color:rgba(255,255,255,0.7)">Request a new one</a> from the extension.</p>`
        : `<h1>Reset password</h1>
           <p>Enter a new password for your account.</p>
           <form method="POST" action="/auth/reset-password">
             <input type="hidden" name="token" value="${opts.token ?? ''}">
             <input type="password" name="newPassword" placeholder="New password (min 8 characters)" required minlength="8" autocomplete="new-password">
             <button type="submit">Update password</button>
           </form>`
    }
  </div>
</body>
</html>`;

// ── Resend verification ────────────────────────────────────────────────────

export async function resendVerificationController(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const result = await authEmailService.sendVerification(req.user.sub);
  if (result === 'already_verified') {
    void reply.status(400).send({ error: 'ALREADY_VERIFIED', message: 'Email is already verified' });
    return;
  }
  void reply.send({ ok: true });
}

// ── Verify email (GET — link from email) ───────────────────────────────────

export async function verifyEmailController(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { token } = req.query as { token?: string };
  if (!token) {
    void reply.type('text/html').send(resetPageHtml({ error: 'Missing token.' }));
    return;
  }
  const result = await authEmailService.verifyEmail(token);
  if (result === 'invalid') {
    void reply.type('text/html').send(resetPageHtml({ error: 'This verification link is invalid or has expired.' }));
    return;
  }
  void reply.type('text/html').send(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>WindoM — Email Verified</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui,sans-serif;background:#0f0f13;color:#e0e0e0;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}.card{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:32px;max-width:420px;width:100%}h1{font-size:20px;font-weight:600;margin-bottom:16px}p{font-size:14px;color:rgba(255,255,255,.75);line-height:1.6}</style>
</head><body><div class="card"><h1>Email verified</h1><p>You're all set. You can close this tab and return to WindoM.</p></div></body></html>`);
}

// ── Forgot password (POST) ─────────────────────────────────────────────────

const forgotSchema = z.object({ email: z.string().email() });

export async function forgotPasswordController(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const parsed = forgotSchema.safeParse(req.body);
  if (!parsed.success) {
    // Always 200 — don't reveal whether email is registered
    void reply.send({ ok: true });
    return;
  }
  // Fire-and-forget: don't await so timing can't reveal user existence
  void authEmailService.sendPasswordReset(parsed.data.email).catch((err) => {
    console.error('[forgotPassword] email send failed:', err);
  });
  void reply.send({ ok: true });
}

// ── Reset password page (GET — renders HTML form) ─────────────────────────

export async function resetPasswordPageController(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { token } = req.query as { token?: string };
  if (!token) {
    void reply.type('text/html').send(resetPageHtml({ error: 'Missing reset token.' }));
    return;
  }
  void reply.type('text/html').send(resetPageHtml({ token }));
}

// ── Reset password submit (POST — form submission) ────────────────────────

const resetSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
});

export async function resetPasswordController(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  // Supports both JSON body (future API use) and form-encoded (HTML form)
  const raw = req.body as Record<string, unknown>;
  const parsed = resetSchema.safeParse(raw);
  if (!parsed.success) {
    const isHtml = (req.headers['content-type'] ?? '').includes('application/x-www-form-urlencoded');
    if (isHtml) {
      void reply.type('text/html').send(resetPageHtml({ error: 'Password must be at least 8 characters.' }));
    } else {
      void reply.status(400).send({ error: 'Bad Request', message: parsed.error.issues[0]?.message });
    }
    return;
  }

  const result = await authEmailService.resetPassword(parsed.data.token, parsed.data.newPassword);
  const isHtml = (req.headers['content-type'] ?? '').includes('application/x-www-form-urlencoded');

  if (result === 'invalid') {
    if (isHtml) {
      void reply.type('text/html').send(resetPageHtml({ error: 'This reset link is invalid or has expired.' }));
    } else {
      void reply.status(400).send({ error: 'INVALID_TOKEN', message: 'Reset link is invalid or has expired' });
    }
    return;
  }

  if (isHtml) {
    void reply.type('text/html').send(resetPageHtml({ success: true }));
  } else {
    void reply.send({ ok: true });
  }
}
