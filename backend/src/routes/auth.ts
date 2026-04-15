import type { FastifyInstance } from 'fastify';
import { registerController, loginController, refreshController, logoutController } from '../controllers/auth.controller.js';

export function authRoutes(app: FastifyInstance): void {
  app.post('/register', { config: { rateLimit: { max: 5, timeWindow: '15 minutes' } } }, registerController);
  // 5 attempts per 15 min (~480/day) — OWASP recommended threshold for brute-force prevention
  app.post('/login', { config: { rateLimit: { max: 5, timeWindow: '15 minutes' } } }, loginController);
  app.post('/refresh', { config: { rateLimit: { max: 30, timeWindow: '15 minutes' } } }, refreshController);
  // Rate limit logout to prevent session enumeration via rapid token probing
  app.post('/logout', { config: { rateLimit: { max: 20, timeWindow: '1 hour' } } }, logoutController);
}
