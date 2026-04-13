import type { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/authenticate.js';
import {
  resendVerificationController,
  verifyEmailController,
  forgotPasswordController,
  resetPasswordPageController,
  resetPasswordController,
} from '../controllers/auth-email.controller.js';

export function authEmailRoutes(app: FastifyInstance): void {
  // Authenticated: resend verification email
  app.post(
    '/resend-verification',
    { preHandler: authenticate, config: { rateLimit: { max: 3, timeWindow: '15 minutes' } } },
    resendVerificationController,
  );

  // Public: click link from email → verify email
  app.get(
    '/verify-email',
    { config: { rateLimit: { max: 10, timeWindow: '15 minutes' } } },
    verifyEmailController,
  );

  // Public: request a password reset email
  app.post(
    '/forgot-password',
    { config: { rateLimit: { max: 3, timeWindow: '15 minutes' } } },
    forgotPasswordController,
  );

  // Public: render HTML reset form (GET) + handle form submit (POST)
  app.get(
    '/reset-password',
    { config: { rateLimit: { max: 10, timeWindow: '15 minutes' } } },
    resetPasswordPageController,
  );
  app.post(
    '/reset-password',
    { config: { rateLimit: { max: 5, timeWindow: '15 minutes' } } },
    resetPasswordController,
  );
}
