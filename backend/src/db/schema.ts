import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  index,
  uniqueIndex,
  integer,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ── Users ──────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique(),
  name: text('name').notNull().default(''),
  passwordHash: text('password_hash'),
  emailVerified: boolean('email_verified').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── Refresh Sessions ───────────────────────────────────────────────────────

export const refreshSessions = pgTable(
  'refresh_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    /** SHA-256 hex of the raw token - uniquely indexed for O(1) session lookup. */
    tokenLookup: text('token_lookup'),
    rotatedFromId: uuid('rotated_from_id'),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    userAgent: text('user_agent').notNull().default(''),
    /** Coarse "Browser · OS" parsed at sign-in/renewal; null for rows that predate it. */
    deviceLabel: text('device_label'),
    /** SHA-256 hex of the client IP - stored hashed for anomaly detection, never as plaintext. */
    ip: text('ip').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    renewalCount: integer('renewal_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('refresh_sessions_token_lookup_idx').on(table.tokenLookup),
    // Enables O(1) lookup for token reuse detection (WHERE rotated_from_id = $1)
    index('refresh_sessions_rotated_from_idx').on(table.rotatedFromId),
  ],
);

// ── OAuth Accounts ─────────────────────────────────────────────────────────

export const oauthAccounts = pgTable(
  'oauth_accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull(), // 'google' | 'spotify'
    providerUserId: text('provider_user_id').notNull(),
    accessTokenEnc: text('access_token_enc').notNull(),
    refreshTokenEnc: text('refresh_token_enc'),
    tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }),
    scopes: text('scopes').array().notNull().default([]),
    /** For PKCE (BYOA) Spotify connections - the user's own Spotify app client_id. Null for legacy shared-app connections. */
    providerClientId: text('provider_client_id'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('oauth_accounts_provider_user_idx').on(table.provider, table.providerUserId),
    // Enables O(1) lookup for per-user provider queries (WHERE user_id = $1 AND provider = $2)
    // Used by spotify.service, calendar.service, and integrations.service on every request
    index('oauth_accounts_user_provider_idx').on(table.userId, table.provider),
  ],
);

// ── OAuth States (for CSRF protection) ────────────────────────────────────

export const oauthStates = pgTable('oauth_states', {
  id: uuid('id').primaryKey().defaultRandom(),
  state: text('state').notNull().unique(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(),
  purpose: text('purpose').notNull(), // 'login' | 'link'
  used: boolean('used').notNull().default(false),
  /** For PKCE (BYOA) Spotify flows - the user's own Spotify app client_id. Null for legacy flows. */
  clientId: text('client_id'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── Email Tokens (verification + password reset) ───────────────────────────

export const emailTokens = pgTable(
  'email_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull().unique(),
    /** bcrypt hash of raw token — for constant-time verification. */
    tokenHash: text('token_hash'),
    /** SHA-256 hex of raw token — for O(1) lookup (deterministic). */
    tokenLookup: text('token_lookup'),
    type: text('type').notNull(), // 'verify_email' | 'password_reset'
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('email_tokens_lookup_idx').on(table.tokenLookup),
  ],
);

// ── User Settings ──────────────────────────────────────────────────────────

export const userSettings = pgTable('user_settings', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  data: jsonb('data').notNull().default({}),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── Audit Logs (#232) ──────────────────────────────────────────────────────

/**
 * The fixed list of security events written to audit_logs. Stored as text rather than a
 * Postgres enum so adding an action is a code change, not a type migration.
 */
export const AUDIT_ACTIONS = [
  'account_created',
  'sign_in',
  'sign_in_google',
  'sign_in_failed',
  'sign_out',
  'password_changed',
  'password_reset_requested',
  'password_reset',
  'email_verified',
  'account_deleted',
  'session_revoked',
  'sessions_revoked_others',
  'token_reuse_detected',
  'data_exported',
  'integration_connected_google',
  'integration_connected_spotify',
  'integration_connected_github',
  'integration_disconnected_google',
  'integration_disconnected_spotify',
  'integration_disconnected_github',
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

/**
 * Security log of sensitive account actions. Deliberately minimal: no IP, no raw User-Agent,
 * no email, no token - only who, what, when, which session and a coarse "Browser · OS".
 * Rows cascade with the user (GDPR erasure); account_deleted is written afterwards with a
 * null userId as an anonymous tombstone. Purged after AUDIT_RETENTION_DAYS (audit.service.ts).
 */
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Null for a failed sign-in on an unknown email and for the account_deleted tombstone. */
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    action: text('action').$type<AuditAction>().notNull(),
    /** Refresh session the event concerns, when there is one. No FK, so the row outlives the session. */
    sessionId: uuid('session_id'),
    /** Same coarse "Browser · OS" label as refresh_sessions.device_label. */
    deviceLabel: text('device_label'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('audit_logs_user_created_idx').on(table.userId, table.createdAt),
    index('audit_logs_created_idx').on(table.createdAt),
  ],
);

// ── Relations ──────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  refreshSessions: many(refreshSessions),
  oauthAccounts: many(oauthAccounts),
  oauthStates: many(oauthStates),
  emailTokens: many(emailTokens),
  auditLogs: many(auditLogs),
}));

export const refreshSessionsRelations = relations(refreshSessions, ({ one }) => ({
  user: one(users, { fields: [refreshSessions.userId], references: [users.id] }),
}));

export const oauthAccountsRelations = relations(oauthAccounts, ({ one }) => ({
  user: one(users, { fields: [oauthAccounts.userId], references: [users.id] }),
}));
