import { describe, expect, it, vi } from 'vitest';
import nodemailer from 'nodemailer';
import { config } from '../../config.js';
import { sendVerificationEmail } from '../email.js';

/**
 * Guards #323: the suite once sent real mail through the SMTP credentials in a
 * developer's `.env`. These assertions hold whatever that file contains.
 */
describe('test email sandbox', () => {
  it('replaces nodemailer for every test file', () => {
    expect(vi.isMockFunction(nodemailer.createTransport)).toBe(true);
  });

  it('pins the SMTP target to a loopback discard port as a second layer', () => {
    expect(config.SMTP_HOST).toBe('127.0.0.1');
    expect(config.SMTP_PORT).toBe(9);
  });

  it('completes a send in-process, with no network round trip', async () => {
    await expect(sendVerificationEmail('nobody@windom.invalid', 'Nobody', 'tok')).resolves.toBeUndefined();
  });
});
