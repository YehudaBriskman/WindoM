/**
 * Redaction helpers with no dependencies, so the OpenTelemetry bootstrap can use them
 * without loading the app (which must load only after instrumentation is in place).
 */

/**
 * The request URL with every query-string value replaced, keeping the parameter
 * names so a log line still says which flow it was.
 *
 * Several GET routes carry a credential in the query string: /auth/verify-email
 * and /auth/reset-password take a single-use `token`, and the OAuth callbacks
 * take `code` and `state`. Logging `req.url` verbatim put a still-valid password
 * reset token in Fly's log search for anyone with log access. Redacting every
 * value, not a list of known names, keeps the next such route safe by default.
 */
export function redactUrlQuery(url: string): string {
  const q = url.indexOf('?');
  if (q === -1) return url;
  const hashAt = url.indexOf('#', q);
  const query = hashAt === -1 ? url.slice(q + 1) : url.slice(q + 1, hashAt);
  const redacted = query
    .split('&')
    .filter((pair) => pair !== '')
    .map((pair) => {
      const eq = pair.indexOf('=');
      return eq === -1 ? pair : `${pair.slice(0, eq)}=[redacted]`;
    })
    .join('&');
  return `${url.slice(0, q)}?${redacted}`;
}
