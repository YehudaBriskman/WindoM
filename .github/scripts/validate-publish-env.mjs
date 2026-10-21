import { pathToFileURL } from 'node:url';

export const requiredVariables = [
  'CHROME_EXTENSION_ID', 'CHROME_PUBLISHER_ID', 'CHROME_CLIENT_ID',
  'CHROME_CLIENT_SECRET', 'CHROME_REFRESH_TOKEN', 'VITE_BACKEND_URL',
];

/** Diagnostics contain variable names only, never their secret values. */
export function validatePublishEnv(env) {
  const errors = requiredVariables
    .filter((name) => typeof env[name] !== 'string' || !env[name].trim())
    .map((name) => `Missing required secret: ${name}`);

  if (env.VITE_BACKEND_URL?.trim()) {
    try {
      const url = new URL(env.VITE_BACKEND_URL);
      if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Invalid URL');
    } catch {
      errors.push('VITE_BACKEND_URL must be an HTTPS URL without embedded credentials');
    }
  }
  return errors;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const errors = validatePublishEnv(process.env);
  for (const error of errors) console.error(error);
  process.exitCode = errors.length ? 1 : 0;
}
