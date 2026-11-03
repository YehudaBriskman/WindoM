/**
 * Vitest global setup - runs before every test file.
 *
 * Points DATABASE_URL at the test database so client.ts connects to the
 * right pool. Requires DATABASE_URL_TEST to be set in the environment
 * (or in a .env.test file loaded by the test runner).
 *
 * Create .env.test alongside .env with:
 *   DATABASE_URL_TEST=postgresql://windom:windom@localhost:5433/windom_test
 */
import { vi } from 'vitest';
import { config as loadDotenv } from 'dotenv';

// Precedence: the real environment > .env.test > .env. dotenv never overrides a variable
// that is already set, so loading .env.test first lets it win over .env, and a
// DATABASE_URL_TEST from the shell or CI wins over both. .env.test used to load with
// `override: true`, which silently replaced an explicit DATABASE_URL_TEST with
// localhost:5433 - whatever happens to own that port, which truncateAll() then wipes.
loadDotenv({ path: '.env.test' });
loadDotenv();

const testUrl = process.env['DATABASE_URL_TEST'];
if (testUrl) {
  process.env['DATABASE_URL'] = testUrl;
}

// ── No test may send real email (#323) ──────────────────────────────────────
// `.env` on a developer machine can hold live SMTP credentials, and config.ts loads it.
// Two independent layers keep the suite from ever reaching a real mail server:
//
// 1. nodemailer is replaced for every test file, so the transport email.ts builds is an
//    in-memory fake whatever credentials are set. A test that inspects how the transport
//    is constructed (smtp-config.test.ts) layers its own vi.doMock on top of this one.
// 2. Fail closed: should a test ever unmock nodemailer, the SMTP target is pinned to a
//    loopback discard port, so a real transport fails with ECONNREFUSED instead of
//    delivering through whatever provider `.env` names. This runs after dotenv and before
//    config.ts loads, and dotenv never overrides a variable that is already set.
vi.mock('nodemailer', () => {
  const createTransport = vi.fn(() => ({
    sendMail: vi.fn((message: { to?: unknown }) =>
      Promise.resolve({ messageId: '<test@windom.invalid>', accepted: [message.to], rejected: [] }),
    ),
    verify: vi.fn(() => Promise.resolve(true)),
    close: vi.fn(),
  }));
  return { default: { createTransport }, createTransport };
});

process.env['SMTP_HOST'] = '127.0.0.1';
process.env['SMTP_PORT'] = '9';
