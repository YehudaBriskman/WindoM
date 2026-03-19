import type { FastifyInstance } from 'fastify';
import { registerController, loginController, refreshController, logoutController } from '../controllers/auth.controller.js';

export function authRoutes(app: FastifyInstance): void {
  app.post('/register', { config: { rateLimit: { max: 5, timeWindow: '15 minutes' } } }, registerController);
  app.post('/login', { config: { rateLimit: { max: 10, timeWindow: '15 minutes' } } }, loginController);
  app.post('/refresh', { config: { rateLimit: { max: 30, timeWindow: '15 minutes' } } }, refreshController);
  app.post('/logout', logoutController);
}
