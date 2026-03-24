import { useState } from 'react';
import { apiGet, apiPost, setAccessToken, setRefreshToken } from '../../lib/api';

interface Props {
  onSuccess?: () => void;
  onError?: (msg: string) => void;
  label?: string;
}

/** Map Chrome's internal OAuth error messages to user-friendly ones. */
function mapChromeOAuthError(msg: string): string {
  if (/could not be loaded|not loaded/i.test(msg)) {
    return 'Could not open the sign-in page. Check your internet connection and try again.';
  }
  if (/cancelled|canceled|dismissed|closed|did not approve/i.test(msg)) {
    return 'Sign-in was cancelled.';
  }
  if (/timed? ?out/i.test(msg)) {
    return 'Sign-in timed out. Please try again.';
  }
  return msg;
}

export function LoginWithGoogle({ onSuccess, onError, label = 'Continue with Google' }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      // Get the chromiumapp.org redirect URL Chrome auto-intercepts for this extension
      const redirectUri = chrome.identity.getRedirectURL();

      const { authUrl } = await apiGet<{ authUrl: string }>(
        `/auth/google/start?redirectUri=${encodeURIComponent(redirectUri)}`,
      );

      // Open Google consent — launchWebAuthFlow captures the redirect to chromiumapp.org.
      // Wrap in a 2-minute timeout so a hanging popup doesn't block the UI forever.
      const redirectUrl = await new Promise<string>((resolve, reject) => {
        let settled = false;
        const timer = setTimeout(() => {
          settled = true;
          reject(new Error('Sign-in timed out. Please try again.'));
        }, 120_000);

        chrome.identity.launchWebAuthFlow(
          { url: authUrl, interactive: true },
          (url) => {
            clearTimeout(timer);
            if (settled) return;
            if (chrome.runtime.lastError || !url) {
              reject(new Error(mapChromeOAuthError(chrome.runtime.lastError?.message ?? 'Auth cancelled')));
            } else {
              resolve(url);
            }
          },
        );
      });

      // Google redirects to chromiumapp.org?code=...&state=...
      const params = new URL(redirectUrl).searchParams;
      const error = params.get('error');
      const code = params.get('code');
      const state = params.get('state');

      if (error || !code || !state) throw new Error(error ?? 'No auth code returned');

      // Send code to backend for server-side token exchange
      const { accessToken, refreshToken } = await apiPost<{ accessToken: string; refreshToken: string }>('/auth/google/exchange', {
        code,
        state,
        redirectUri,
      });

      await setAccessToken(accessToken);
      await setRefreshToken(refreshToken);
      onSuccess?.();
      window.location.reload();
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="auth-google-btn"
    >
      {loading ? (
        'Connecting…'
      ) : (
        <>
          <GoogleIcon />
          {label}
        </>
      )}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}
