/**
 * Vitest global setup — runs before every test file.
 *
 * Points DATABASE_URL at the test database so client.ts connects to the
 * right pool. Requires DATABASE_URL_TEST to be set in the environment
 * (or in a .env.test file loaded by the test runner).
 *
 * Create .env.test alongside .env with:
 *   DATABASE_URL_TEST=postgresql://windom:windom@localhost:5433/windom_test
 */
import { config as loadDotenv } from 'dotenv';

// Load base env then overlay .env.test so DATABASE_URL_TEST is available
loadDotenv();
loadDotenv({ path: '.env.test', override: true });

const testUrl = process.env['DATABASE_URL_TEST'];
if (testUrl) {
  process.env['DATABASE_URL'] = testUrl;
}
