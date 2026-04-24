import type { FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

export async function registerSwagger(app: FastifyInstance, isDev: boolean): Promise<void> {
  // Register shared schemas in Fastify's schema store so route serializers can resolve $ref.
  app.addSchema({
    $id: 'Error',
    type: 'object',
    properties: {
      statusCode: { type: 'integer' },
      error: { type: 'string' },
      message: { type: 'string' },
    },
  });
  app.addSchema({
    $id: 'AuthTokens',
    type: 'object',
    required: ['accessToken', 'refreshToken'],
    properties: {
      accessToken: { type: 'string' },
      refreshToken: { type: 'string' },
    },
  });
  app.addSchema({
    $id: 'User',
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      email: { type: 'string', format: 'email' },
      name: { type: 'string' },
      emailVerified: { type: 'boolean' },
      hasPassword: { type: 'boolean' },
      createdAt: { type: 'string', format: 'date-time' },
    },
  });

  await app.register(swagger, {
    openapi: {
      openapi: '3.0.3',
      info: {
        title: 'WindoM API',
        description: 'REST API for the WindoM Chrome extension — auth, calendar, Spotify, and settings.',
        version: '1.3.5',
      },
      servers: [
        { url: 'https://api.windom.app', description: 'Production' },
        { url: 'http://localhost:8080', description: 'Local dev' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
        schemas: {
          Error: {
            type: 'object',
            properties: {
              statusCode: { type: 'integer' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          AuthTokens: {
            type: 'object',
            required: ['accessToken', 'refreshToken'],
            properties: {
              accessToken: { type: 'string' },
              refreshToken: { type: 'string' },
            },
          },
          User: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              email: { type: 'string', format: 'email' },
              name: { type: 'string' },
              emailVerified: { type: 'boolean' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
      tags: [
        { name: 'Auth', description: 'Registration, login, token refresh, logout' },
        { name: 'Auth — Email', description: 'Email verification and password reset flows' },
        { name: 'Auth — Google', description: 'Google Sign-In OAuth flow' },
        { name: 'Me', description: 'Authenticated user profile management' },
        { name: 'Settings', description: 'Extension settings sync' },
        { name: 'Integrations', description: 'OAuth integration management (Google Calendar, Spotify)' },
        { name: 'Calendar', description: 'Google Calendar events' },
        { name: 'Spotify', description: 'Spotify playback and user data' },
        { name: 'Health', description: 'Server health check' },
      ],
    },
  });

  if (isDev) {
    await app.register(swaggerUi, {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: true,
        persistAuthorization: true,
      },
      staticCSP: true,
    });
  }
}
