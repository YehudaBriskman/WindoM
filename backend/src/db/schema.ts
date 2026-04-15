import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  inet,
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
    /** SHA-256 hex of the raw token — uniquely indexed for O(1) session lookup. */
    tokenLookup: text('token_lookup'),
    rotatedFromId: uuid('rotated_from_id'),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    userAgent: text('user_agent').notNull().default(''),
    ip: inet('ip').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    renewalCount: integer('renewal_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('refresh_sessions_token_lookup_idx').on(table.tokenLookup)],
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
    /** For PKCE (BYOA) Spotify connections — the user's own Spotify app client_id. Null for legacy shared-app connections. */
    providerClientId: text('provider_client_id'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('oauth_accounts_provider_user_idx').on(table.provider, table.providerUserId)],
);

// ── OAuth States (for CSRF protection) ────────────────────────────────────

export const oauthStates = pgTable('oauth_states', {
  id: uuid('id').primaryKey().defaultRandom(),
  state: text('state').notNull().unique(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(),
  purpose: text('purpose').notNull(), // 'login' | 'link'
  used: boolean('used').notNull().default(false),
  /** For PKCE (BYOA) Spotify flows — the user's own Spotify app client_id. Null for legacy flows. */
  clientId: text('client_id'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── Email Tokens (verification + password reset) ───────────────────────────

export const emailTokens = pgTable('email_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  type: text('type').notNull(), // 'verify_email' | 'password_reset'
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── User Settings ──────────────────────────────────────────────────────────

export const userSettings = pgTable('user_settings', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  data: jsonb('data').notNull().default({}),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── Relations ──────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  refreshSessions: many(refreshSessions),
  oauthAccounts: many(oauthAccounts),
  oauthStates: many(oauthStates),
  emailTokens: many(emailTokens),
}));

export const refreshSessionsRelations = relations(refreshSessions, ({ one }) => ({
  user: one(users, { fields: [refreshSessions.userId], references: [users.id] }),
}));

export const oauthAccountsRelations = relations(oauthAccounts, ({ one }) => ({
  user: one(users, { fields: [oauthAccounts.userId], references: [users.id] }),
}));
