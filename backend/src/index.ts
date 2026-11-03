import * as Sentry from '@sentry/node';
import { config } from './config.js';
import { buildApp } from './app.js';
import { closeSentry, initSentry } from './lib/sentry.js';

// A no-op unless SENTRY_DSN is set (#204). Initialised before the app is built so
// the uncaught-exception and unhandled-rejection handlers cover startup as well.
initSentry(config);

const app = await buildApp();

try {
  await app.listen({ port: config.PORT, host: '0.0.0.0' });
  app.log.info(`✅ WindoM API listening on port ${config.PORT}`);
} catch (err) {
  app.log.error(err);
  Sentry.captureException(err);
  await closeSentry();
  process.exit(1);
}
