import type { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/authenticate.js';
import { getGithubSummaryController } from '../controllers/github.controller.js';

const security = [{ bearerAuth: [] }];
const errorResponse = { $ref: 'Error#' };

export function githubRoutes(app: FastifyInstance): void {
  app.get('/summary', {
    preHandler: authenticate,
    schema: {
      tags: ['GitHub'],
      summary: 'Get GitHub notification and PR summary',
      security,
      response: {
        200: {
          type: 'object',
          properties: {
            notificationCount: { type: 'integer' },
            reviewRequested: { type: 'integer' },
            assignedIssues: { type: 'integer' },
            username: { type: 'string' },
          },
        },
        401: errorResponse,
        404: errorResponse,
        503: errorResponse,
      },
    },
  }, getGithubSummaryController);
}
