import type { FastifyInstance } from 'fastify';
import { registerController, loginController, refreshController, logoutController } from '../controllers/auth.controller.js';

const tokenResponse = { $ref: 'AuthTokens#' };
const errorResponse = { $ref: 'Error#' };

export function authRoutes(app: FastifyInstance): void {
  app.post('/register', {
    config: { rateLimit: { max: 5, timeWindow: '15 minutes' } },
    schema: {
      tags: ['Auth'],
      summary: 'Register a new account',
      body: {
        type: 'object',
        required: ['email', 'password', 'name'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          name: { type: 'string', minLength: 1, maxLength: 100 },
        },
      },
      response: {
        200: {
          type: 'object',
          required: ['accessToken', 'refreshToken'],
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
            emailSent: { type: 'boolean' },
          },
        },
        400: errorResponse,
        409: errorResponse,
      },
    },
  }, registerController);

  // 5 attempts per 15 min (~480/day) - OWASP recommended threshold for brute-force prevention
  app.post('/login', {
    config: { rateLimit: { max: 5, timeWindow: '15 minutes' } },
    schema: {
      tags: ['Auth'],
      summary: 'Log in with email and password',
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      response: {
        200: tokenResponse,
        400: errorResponse,
        401: errorResponse,
      },
    },
  }, loginController);

  // 5 refreshes per 15 min is sufficient for all legitimate tab/startup usage
  app.post('/refresh', {
    config: { rateLimit: { max: 5, timeWindow: '15 minutes' } },
    schema: {
      tags: ['Auth'],
      summary: 'Rotate refresh token and get new access token',
      description: 'Accepts the refresh token from the HttpOnly cookie or from `refreshToken` in the request body. Returns a new access token and rotates the refresh token.',
      body: {
        type: 'object',
        properties: {
          refreshToken: { type: 'string', description: 'Fallback if the HttpOnly cookie is not sent' },
        },
      },
      response: {
        200: tokenResponse,
        401: errorResponse,
      },
    },
  }, refreshController);

  // Rate limit logout to prevent session enumeration via rapid token probing
  app.post('/logout', {
    config: { rateLimit: { max: 20, timeWindow: '1 hour' } },
    schema: {
      tags: ['Auth'],
      summary: 'Revoke the current session and clear the refresh token cookie',
      response: {
        200: {
          type: 'object',
          properties: { success: { type: 'boolean' } },
        },
      },
    },
  }, logoutController);
}
