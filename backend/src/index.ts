import { config } from './config.js';
import { buildApp } from './app.js';
import { shutdownTelemetry } from './telemetry/lifecycle.js';

// OpenTelemetry, when configured, was already started by `node --import
// ./dist/instrumentation.js` (#476). Everything below is a no-op without it.

const app = await buildApp();

try {
  await app.listen({ port: config.PORT, host: '0.0.0.0' });
  app.log.info(`✅ WindoM API listening on port ${config.PORT}`);
} catch (err) {
  app.log.error(err);
  // Ship the failure's log line before exiting; bounded, so a dead collector cannot hold the exit.
  await shutdownTelemetry();
  process.exit(1);
}
