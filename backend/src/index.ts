import { config } from './config.js';
import { buildApp } from './app.js';

const app = await buildApp();

try {
  await app.listen({ port: config.PORT, host: '0.0.0.0' });
  app.log.info(`✅ WindoM API listening on port ${config.PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
