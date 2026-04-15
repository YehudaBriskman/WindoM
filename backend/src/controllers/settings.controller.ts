import { z } from 'zod';
import type { FastifyRequest, FastifyReply } from 'fastify';
import * as settingsService from '../services/settings.service.js';

const quickLinkSchema = z.object({
  name: z.string().max(100),
  url: z.string().url().max(2048),
  icon: z.string().max(2048),
});

const settingsSchema = z.object({
  userName: z.string().max(50),
  theme: z.string().max(50),
  language: z.string().max(10),
  timeFormat: z.enum(['12h', '24h']),
  showSeconds: z.boolean(),
  clockLeadingZero: z.boolean(),
  clockStyle: z.enum(['default', 'glass', 'outline']),
  clockColor: z.string().max(50),
  clockSize: z.number().int().min(20).max(500),
  clockWeight: z.union([z.literal(100), z.literal(200), z.literal(400), z.literal(600)]),
  showDate: z.boolean(),
  dateFormat: z.enum(['long', 'short', 'numeric']),
  temperatureUnit: z.enum(['F', 'C']),
  backgroundSource: z.enum(['unsplash', 'local']),
  unsplashApiKey: z.string().max(100),
  unsplashCollectionId: z.string().max(100),
  // Base64-encoded image: must start with a data URI for a supported image type.
  // Capped at 600 KB (encoded) ≈ ~450 KB actual image to prevent storage exhaustion.
  localBackground: z
    .string()
    .max(600_000)
    .refine(
      (v) => v === '' || /^data:image\/(jpeg|png|webp|gif);base64,/.test(v),
      { message: 'localBackground must be a base64-encoded JPEG, PNG, WebP, or GIF data URI' },
    ),
  location: z.string().max(100),
  weatherApiKey: z.string().max(100),
  calendarConnected: z.boolean(),
  calendarDays: z.union([z.literal(7), z.literal(14), z.literal(30)]),
  spotifyConnected: z.boolean(),
  quickLinks: z.array(quickLinkSchema),
  quotesEnabled: z.boolean(),
  quoteSource: z.enum(['local', 'api']),
  mainFocus: z.string().max(200),
  focusCompleted: z.boolean(),
  showWeather: z.boolean(),
  showLinks: z.boolean(),
  showFocus: z.boolean(),
  showGreeting: z.boolean(),
  searchEngine: z.enum(['google', 'bing', 'duckduckgo', 'brave']),
  tabSidebarSide: z.enum(['left', 'right']),
  // Allow the sync timestamp sent by the client
  _updatedAt: z.number().optional(),
}).partial();

export async function getSettingsController(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const data = await settingsService.getSettings(req.user.sub);
  void reply.send({ data });
}

export async function putSettingsController(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const result = settingsSchema.safeParse(req.body);
  if (!result.success) {
    void reply.status(400).send({
      error: 'Invalid settings payload',
      details: result.error.flatten().fieldErrors,
    });
    return;
  }
  const data = await settingsService.saveSettings(req.user.sub, result.data as Record<string, unknown>);
  void reply.send({ data });
}
