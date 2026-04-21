import { z } from 'zod';
import type { FastifyRequest, FastifyReply } from 'fastify';
import * as settingsService from '../services/settings.service.js';

const quickLinkSchema = z.object({
  name: z.string().max(100),
  url: z.string().url().max(2048),
  icon: z.string().max(2048).optional(),
});

const settingsSectionSchema = z.object({
  general: z.object({
    userName: z.string().max(50),
    searchEngine: z.enum(['google', 'bing', 'duckduckgo', 'brave']),
    sidebarSide: z.enum(['left', 'right']),
    showGreeting: z.boolean(),
  }).partial().optional(),

  clock: z.object({
    timeFormat: z.enum(['12h', '24h']),
    showSeconds: z.boolean(),
    leadingZero: z.boolean(),
    style: z.enum(['default', 'glass', 'outline']),
    color: z.string().max(50),
    size: z.number().int().min(20).max(500),
    weight: z.union([z.literal(100), z.literal(200), z.literal(400), z.literal(600)]),
    showDate: z.boolean(),
    dateFormat: z.enum(['long', 'short', 'numeric']),
  }).partial().optional(),

  background: z.object({
    source: z.enum(['unsplash', 'local']),
    unsplashApiKey: z.string().max(100),
    unsplashCollectionId: z.string().max(100),
  }).partial().optional(),

  weather: z.object({
    show: z.boolean(),
    unit: z.enum(['F', 'C']),
    location: z.string().max(100),
    apiKey: z.string().max(100),
  }).partial().optional(),

  widgets: z.object({
    showLinks: z.boolean(),
    showFocus: z.boolean(),
    showQuotes: z.boolean(),
    quoteSource: z.enum(['local', 'api']),
    quickLinks: z.array(quickLinkSchema).max(50),
  }).partial().optional(),

  integrations: z.object({
    calendar: z.object({
      days: z.union([z.literal(7), z.literal(14), z.literal(30)]),
      connected: z.boolean(),
    }).partial().optional(),
    spotify: z.object({
      connected: z.boolean(),
    }).partial().optional(),
  }).partial().optional(),

  _updatedAt: z.number().optional(),
});

export async function getSettingsController(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const data = await settingsService.getSettings(req.user.sub);
  void reply.send({ data });
}

export async function putSettingsController(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const incoming = settingsSectionSchema.parse(req.body);

  // Strip _updatedAt from stored data (sync metadata, not settings)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _updatedAt: _, ...incomingSections } = incoming;

  const existing = (await settingsService.getSettings(req.user.sub)) ?? {};

  const merged: Record<string, unknown> = { ...existing };
  for (const [section, value] of Object.entries(incomingSections)) {
    if (value !== undefined) {
      merged[section] = {
        ...(typeof existing[section] === 'object' && existing[section] !== null
          ? (existing[section] as Record<string, unknown>)
          : {}),
        ...(value as Record<string, unknown>),
      };
    }
  }

  const saved = await settingsService.saveSettings(req.user.sub, merged);
  void reply.send({ data: saved });
}
