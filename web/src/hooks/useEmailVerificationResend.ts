import { useRef, useState } from 'react';
import { apiPost } from '../lib/api';

/** How long the Resend button stays in its "Sent!" state. */
export const RESEND_COOLDOWN_MS = 60_000;

/**
 * Re-sends the email verification link. After a successful send, `sent` stays
 * true for a cooldown so the button cannot be hammered. A failed send is
 * swallowed: the button simply becomes clickable again.
 */
export function useEmailVerificationResend() {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function resend() {
    setSending(true);
    try {
      await apiPost('/auth/resend-verification', {});
      setSent(true);
      cooldownRef.current = setTimeout(() => setSent(false), RESEND_COOLDOWN_MS);
    } catch {
      // ignore - user can retry
    } finally {
      setSending(false);
    }
  }

  return { sending, sent, resend };
}
