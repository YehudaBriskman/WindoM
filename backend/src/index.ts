import { config } from './config.js';
import { buildApp } from './app.js';
import { pool } from './db/client.js';
import { drainHttp, installShutdownHandlers } from './lib/shutdown.js';
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

// The one SIGTERM/SIGINT path (#478): drain HTTP, end the pool, flush telemetry, exit.
installShutdownHandlers({
  closeServer: () => drainHttp(app),
  closePool: () => pool.end(),
  flushTelemetry: () => shutdownTelemetry(),
  log: app.log,
});
