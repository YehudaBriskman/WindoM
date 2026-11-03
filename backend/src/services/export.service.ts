import { desc, eq, getTableColumns } from 'drizzle-orm';
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core';
import { db } from '../db/client.js';
import {
  users,
  refreshSessions,
  oauthAccounts,
  oauthStates,
  emailTokens,
  userSettings,
  auditLogs,
} from '../db/schema.js';

/**
 * GDPR data export (GET /me/export, #265).
 *
 * Every column of every table in schema.ts is classified here, by hand. Only columns listed
 * under `exported` are ever selected; everything else is withheld with a stated reason.
 * This is an allowlist on purpose: a column added later is withheld until someone decides
 * otherwise, and export-policy.test.ts fails until they do, so a new secret cannot leak
 * into the export by default.
 */

type Withheld = 'secret' | 'internal';

interface TablePolicy<T extends PgTable> {
  table: T;
  exported: readonly (keyof T['_']['columns'] & string)[];
  withheld: Partial<Record<keyof T['_']['columns'] & string, { kind: Withheld; reason: string }>>;
}

function policy<T extends PgTable>(p: TablePolicy<T>): TablePolicy<T> {
  return p;
}

export const EXPORT_POLICY = {
  users: policy({
    table: users,
    exported: ['id', 'email', 'name', 'emailVerified', 'createdAt'],
    withheld: {
      passwordHash: { kind: 'secret', reason: 'bcrypt password hash; exported only as hasPassword' },
    },
  }),
  refreshSessions: policy({
    table: refreshSessions,
    exported: ['id', 'createdAt', 'expiresAt', 'revokedAt', 'renewalCount', 'deviceLabel'],
    withheld: {
      userId: { kind: 'internal', reason: 'always the requesting user' },
      tokenHash: { kind: 'secret', reason: 'refresh-token hash' },
      tokenLookup: { kind: 'secret', reason: 'refresh-token lookup digest' },
      rotatedFromId: { kind: 'internal', reason: 'rotation chain bookkeeping' },
      userAgent: {
        kind: 'internal',
        reason: 'stored only as a SHA-256 digest; exported as the deviceId prefix shown in Settings',
      },
      ip: { kind: 'internal', reason: 'stored only as a SHA-256 digest for anomaly detection; no IP address is held' },
    },
  }),
  oauthAccounts: policy({
    table: oauthAccounts,
    exported: ['provider', 'providerUserId', 'scopes', 'tokenExpiresAt', 'providerClientId', 'updatedAt'],
    withheld: {
      id: { kind: 'internal', reason: 'row key' },
      userId: { kind: 'internal', reason: 'always the requesting user' },
      accessTokenEnc: { kind: 'secret', reason: 'encrypted OAuth access token / GitHub PAT' },
      refreshTokenEnc: { kind: 'secret', reason: 'encrypted OAuth refresh token' },
    },
  }),
  oauthStates: policy({
    table: oauthStates,
    exported: [],
    withheld: {
      id: { kind: 'internal', reason: 'row key' },
      state: { kind: 'secret', reason: 'CSRF nonce for an in-flight OAuth handshake' },
      userId: { kind: 'internal', reason: 'always the requesting user' },
      provider: { kind: 'internal', reason: 'transient handshake record, expires within minutes' },
      purpose: { kind: 'internal', reason: 'transient handshake record, expires within minutes' },
      used: { kind: 'internal', reason: 'transient handshake record, expires within minutes' },
      clientId: {
        kind: 'internal',
        reason: 'transient handshake record; the connected client ID is exported with the account',
      },
      expiresAt: { kind: 'internal', reason: 'transient handshake record, expires within minutes' },
      createdAt: { kind: 'internal', reason: 'transient handshake record, expires within minutes' },
    },
  }),
  emailTokens: policy({
    table: emailTokens,
    exported: ['type', 'createdAt', 'expiresAt', 'usedAt'],
    withheld: {
      id: { kind: 'internal', reason: 'row key' },
      userId: { kind: 'internal', reason: 'always the requesting user' },
      token: { kind: 'secret', reason: 'verification / password-reset token hash' },
      tokenHash: { kind: 'secret', reason: 'verification / password-reset token hash' },
      tokenLookup: { kind: 'secret', reason: 'verification / password-reset token lookup digest' },
    },
  }),
  userSettings: policy({
    table: userSettings,
    exported: ['data', 'updatedAt'],
    withheld: {
      userId: { kind: 'internal', reason: 'always the requesting user' },
    },
  }),
  auditLogs: policy({
    table: auditLogs,
    // Holds no IP, user agent, email or token by design, so every event column is the user's.
    exported: ['action', 'createdAt', 'sessionId', 'deviceLabel'],
    withheld: {
      id: { kind: 'internal', reason: 'row key' },
      userId: { kind: 'internal', reason: 'always the requesting user' },
    },
  }),
} as const;

/**
 * The settings blob is one jsonb column, so it gets its own allowlist: section -> keys.
 * Keys the user typed in as credentials (third-party API keys) are withheld; every key the
 * settings validator accepts must appear in exactly one of the two lists (export-policy.test.ts).
 */
export const SETTINGS_EXPORTED: Readonly<Record<string, readonly string[]>> = {
  general: ['userName', 'searchEngine', 'sidebarSide', 'showGreeting'],
  clock: ['timeFormat', 'showSeconds', 'leadingZero', 'style', 'color', 'size', 'weight', 'showDate', 'dateFormat'],
  background: ['source', 'unsplashCollectionId'],
  weather: ['show', 'unit', 'location'],
  widgets: ['showLinks', 'showFocus', 'showQuotes', 'quoteSource', 'quickLinks'],
  integrations: ['calendar', 'spotify', 'gmail'],
};

export const SETTINGS_WITHHELD: Readonly<Record<string, readonly string[]>> = {
  background: ['unsplashApiKey'],
  weather: ['apiKey'],
};

function pickColumns<T extends PgTable>(p: TablePolicy<T>): Record<string, PgColumn> {
  const all = getTableColumns(p.table) as Record<string, PgColumn>;
  return Object.fromEntries(p.exported.map((k) => [k, all[k]]));
}

function filterSettings(data: unknown): Record<string, unknown> {
  if (typeof data !== 'object' || data === null) return {};
  const out: Record<string, unknown> = {};
  for (const [section, keys] of Object.entries(SETTINGS_EXPORTED)) {
    const value = (data as Record<string, unknown>)[section];
    if (typeof value !== 'object' || value === null || Array.isArray(value)) continue;
    const kept: Record<string, unknown> = {};
    for (const key of keys) {
      if (key in value) kept[key] = (value as Record<string, unknown>)[key];
    }
    out[section] = kept;
  }
  return out;
}

export interface UserExport {
  exportedAt: string;
  format: 'windom-export/1';
  profile: Record<string, unknown> | null;
  settings: { data: Record<string, unknown>; updatedAt: unknown } | null;
  sessions: Record<string, unknown>[];
  integrations: Record<string, unknown>[];
  emailTokens: Record<string, unknown>[];
  securityLog: Record<string, unknown>[];
  withheld: string[];
}

export async function buildUserExport(userId: string): Promise<UserExport> {
  const P = EXPORT_POLICY;

  const [profileRows, passwordRows, sessionRows, deviceRows, accountRows, tokenRows, settingsRows, auditRows] =
    await Promise.all([
      db.select(pickColumns(P.users)).from(users).where(eq(users.id, userId)).limit(1),
      // Read only to derive the hasPassword flag; the hash itself never leaves this function.
      db.select({ hasPassword: users.passwordHash }).from(users).where(eq(users.id, userId)).limit(1),
      db.select(pickColumns(P.refreshSessions)).from(refreshSessions).where(eq(refreshSessions.userId, userId)),
      db
        .select({ id: refreshSessions.id, ua: refreshSessions.userAgent })
        .from(refreshSessions)
        .where(eq(refreshSessions.userId, userId)),
      db.select(pickColumns(P.oauthAccounts)).from(oauthAccounts).where(eq(oauthAccounts.userId, userId)),
      db.select(pickColumns(P.emailTokens)).from(emailTokens).where(eq(emailTokens.userId, userId)),
      db.select(pickColumns(P.userSettings)).from(userSettings).where(eq(userSettings.userId, userId)).limit(1),
      db
        .select(pickColumns(P.auditLogs))
        .from(auditLogs)
        .where(eq(auditLogs.userId, userId))
        .orderBy(desc(auditLogs.createdAt)),
    ]);

  // Same anonymous prefix GET /me/sessions shows as deviceId: a digest prefix, not the UA.
  const deviceIds = new Map(deviceRows.map((r) => [r.id, r.ua.slice(0, 12)]));
  const profile = profileRows[0] ?? null;
  const settings = settingsRows[0] ?? null;

  const withheld = [
    ...Object.entries(EXPORT_POLICY).flatMap(([name, p]) =>
      Object.entries(p.withheld as Record<string, { kind: Withheld; reason: string }>)
        .filter(([, w]) => w.kind === 'secret')
        .map(([col, w]) => `${name}.${col}: ${w.reason}`),
    ),
    ...Object.entries(SETTINGS_WITHHELD).flatMap(([section, keys]) =>
      keys.map((k) => `settings.${section}.${k}: third-party API key you entered`),
    ),
  ];

  return {
    exportedAt: new Date().toISOString(),
    format: 'windom-export/1',
    profile: profile ? { ...profile, hasPassword: (passwordRows[0]?.hasPassword ?? null) !== null } : null,
    settings: settings ? { data: filterSettings(settings['data']), updatedAt: settings['updatedAt'] } : null,
    sessions: sessionRows.map((s) => ({ ...s, deviceId: deviceIds.get(s['id'] as string) ?? '' })),
    integrations: accountRows,
    emailTokens: tokenRows,
    securityLog: auditRows,
    withheld,
  };
}
