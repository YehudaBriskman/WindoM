/**
 * Maps Chrome OAuth error messages and URL error params to user-friendly strings.
 * Handles both chrome.runtime.lastError messages and ?error= URL parameters.
 */
export function mapOAuthError(msg: string): string {
  if (msg === 'access_denied' || msg.includes('access_denied')) {
    return 'You declined the sign-in request. Please try again and allow access.';
  }
  if (/user_cancelled|User cancelled/i.test(msg)) {
    return 'Sign-in was cancelled.';
  }
  if (/could not be loaded|not loaded/i.test(msg)) {
    return 'Could not open the sign-in page. Check your internet connection and try again.';
  }
  if (/cancelled|canceled|dismissed|closed|did not approve/i.test(msg)) {
    return 'Sign-in was cancelled.';
  }
  if (/network_error|ERR_/i.test(msg)) {
    return 'A network error occurred. Check your internet connection and try again.';
  }
  if (/popup_closed|Popup closed/i.test(msg)) {
    return 'Sign-in was cancelled.';
  }
  if (/timed? ?out/i.test(msg)) {
    return 'Sign-in timed out. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}
