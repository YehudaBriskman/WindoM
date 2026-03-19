# Backend Refactor & Test Implementation Plan

## What the Scan Found

### Current Problems

| Problem | Where | Impact |
|---------|-------|--------|
| Business logic inside route handlers | `auth.ts`, `calendar.ts`, `spotify.ts` | Hard to test, hard to reuse |
| No service or controller layer | all routes | Routes own DB queries, token logic, HTTP encoding |
| Duplicate OAuth flow pattern | `auth-google.ts`, `oauth-google.ts`, `oauth-spotify.ts` | State creation, code exchange repeated ~3× |
| Token auto-refresh duplicated | `calendar.ts`, `spotify.ts` | Same pattern, two implementations |
| Global constants not centralized | `auth.ts` (REFRESH_WINDOW_DAYS, MAX_RENEWALS), scattered | Magic numbers risk |
| No tests | entire backend | 0% coverage |
| No lint config | entire backend | No enforcement of code standards |
| No typed error returns | services don't exist yet | Controllers can't distinguish errors |
| `isNull` used with `and()` of 1 arg | `auth.ts` (logout handler) | Unnecessary wrapper |
| No shared `buildApp()` factory | `index.ts` bootstraps everything inline | Can't instantiate app in tests |

---

## Target Architecture

```
src/
├── app.ts                        # NEW — buildApp() factory (testable)
├── index.ts                      # Only: import buildApp, listen
├── config.ts                     # (keep, already good)
├── types/
│   ├── auth.types.ts             # NEW — LoginResult, AuthError, SessionResult, etc.
│   ├── oauth.types.ts            # NEW — OAuthStartResult, OAuthExchangeResult
│   └── constants.ts              # NEW — cross-module constants (MAX_RENEWALS, etc.)
├── routes/
│   ├── auth.routes.ts            # RENAME — thin: register + attach controller
│   ├── auth-google.routes.ts     # RENAME
│   ├── oauth-google.routes.ts    # RENAME
│   ├── oauth-spotify.routes.ts   # RENAME
│   ├── calendar.routes.ts        # RENAME
│   ├── spotify.routes.ts         # RENAME
│   ├── integrations.routes.ts    # RENAME
│   ├── me.routes.ts              # RENAME
│   ├── settings.routes.ts        # RENAME
│   └── health.routes.ts          # RENAME
├── controllers/
│   ├── auth.controller.ts        # NEW — HTTP ↔ service bridge for auth
│   ├── oauth.controller.ts       # NEW — shared OAuth HTTP logic
│   ├── calendar.controller.ts    # NEW
│   ├── spotify.controller.ts     # NEW
│   ├── integrations.controller.ts # NEW
│   ├── me.controller.ts          # NEW
│   └── settings.controller.ts   # NEW
├── services/
│   ├── auth.service.ts           # NEW — register, login, refresh, logout logic
│   ├── session.service.ts        # NEW — createSession, revokeSession, findSession
│   ├── oauth.service.ts          # NEW — shared state create/verify, token exchange
│   ├── calendar.service.ts       # NEW — fetch events, auto-refresh
│   ├── spotify.service.ts        # NEW — now-playing, controls, auto-refresh
│   ├── integrations.service.ts   # NEW — list, unlink
│   └── token-refresh.service.ts  # NEW — shared OAuth token auto-refresh logic
├── lib/
│   ├── crypto.ts                 # (keep, already clean)
│   ├── jwt.ts                    # (keep, already clean)
│   └── password.ts               # (keep, already clean)
├── middleware/
│   └── authenticate.ts           # (keep, already clean)
├── plugins/
│   ├── cors.ts                   # (keep)
│   └── rate-limit.ts             # (keep)
└── db/
    ├── schema.ts                 # (keep, already good)
    ├── client.ts                 # (keep)
    └── migrate.ts                # (keep)
```

---

## Implementation Phases

---

### Phase 1 — Tooling Setup

**Goal:** Get lint and test infrastructure in place before touching any source.

#### 1.1 ESLint
- Install: `typescript-eslint`, `eslint-plugin-prettier`, `prettier`
- Create `eslint.config.ts` with strict TypeScript rules (see `docs/code-style.md`)
- Create `.prettierrc`
- Add `npm run lint` and `npm run lint:fix` to `package.json`

#### 1.2 Vitest
- Install: `vitest`, `@vitest/coverage-v8`
- Create `vitest.config.ts`:
  - `environment: 'node'`
  - `coverage.provider: 'v8'`
  - `coverage.thresholds: { lines: 100, branches: 100, functions: 100 }`
  - `include: ['src/**/*.test.ts']`
- Add `npm test`, `npm run test:coverage` to `package.json`
- Create `src/test-utils/db.ts` — test DB setup/teardown helpers
- Create `src/test-utils/app.ts` — `buildTestApp()` helper

#### 1.3 App Factory
- Extract `buildApp(): Promise<FastifyInstance>` into `src/app.ts`
- `index.ts` becomes: `const app = await buildApp(); await app.listen(...)`
- This enables `app.inject()` in tests without binding a port

---

### Phase 2 — Types & Constants

**Goal:** Single source of truth for all shared types and global constants.

#### 2.1 `src/types/constants.ts`
```ts
export const REFRESH_WINDOW_DAYS = 7;
export const MAX_RENEWALS = 4;
export const BCRYPT_ROUNDS = 10;
export const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;
export const ACCESS_TOKEN_TTL = '15m';
export const COOKIE_NAME = 'windom_refresh';
```

#### 2.2 `src/types/auth.types.ts`
- `AuthError` union: `'INVALID_CREDENTIALS' | 'EMAIL_TAKEN' | 'SESSION_NOT_FOUND' | ...`
- `LoginResult`, `RegisterResult`, `RefreshResult`
- `SessionRecord` (typed DB row)

#### 2.3 `src/types/oauth.types.ts`
- `OAuthProvider`: `'google' | 'spotify'`
- `OAuthStartResult`, `OAuthExchangeResult`, `OAuthError`

---

### Phase 3 — Services

**Goal:** Extract all business logic from routes into typed, testable services.

#### 3.1 `session.service.ts`
Functions extracted from `auth.ts`:
- `createSession(userId, ip, userAgent, rotatedFromId?, renewalCount?): Promise<string>`
- `findSessionByLookup(rawToken): Promise<SessionRecord | null>`
- `revokeSession(sessionId): Promise<void>`
- `revokeAllUserSessions(userId): Promise<void>`

#### 3.2 `auth.service.ts`
- `register(email, password, name, meta): Promise<RegisterResult | { ok: false, error: AuthError }>`
- `login(email, password, meta): Promise<LoginResult | { ok: false, error: AuthError }>`
- `refresh(rawToken, meta): Promise<RefreshResult | { ok: false, error: AuthError }>`
- `logout(rawToken): Promise<void>`

#### 3.3 `token-refresh.service.ts`
Extracted from `calendar.ts` and `spotify.ts` (duplicated):
- `getDecryptedTokens(userId, provider): Promise<TokenSet | null>`
- `refreshOAuthTokenIfNeeded(userId, provider, refreshUrl, clientId, clientSecret): Promise<string | null>`

#### 3.4 `oauth.service.ts`
Shared logic from `auth-google.ts`, `oauth-google.ts`, `oauth-spotify.ts`:
- `createOAuthState(provider, purpose, userId?): Promise<string>` → state token
- `verifyAndConsumeOAuthState(state, provider, purpose): Promise<OAuthStateRecord | null>`
- `storeOAuthAccount(userId, provider, providerUserId, tokens): Promise<void>`

#### 3.5 `calendar.service.ts`
- `getCalendarEvents(userId, days): Promise<CalendarEvent[]>`
- Internal: fetch calendars, parallel event fetch, deduplicate, sort

#### 3.6 `spotify.service.ts`
- `getNowPlaying(userId): Promise<NowPlayingResult>`
- `getTopTracks(userId, limit, timeRange): Promise<TrackResult[]>`
- `sendPlaybackCommand(userId, command: 'play' | 'pause' | 'next' | 'previous'): Promise<void>`

#### 3.7 `integrations.service.ts`
- `getIntegrations(userId): Promise<IntegrationsResult>`
- `unlinkProvider(userId, provider): Promise<void>`

---

### Phase 4 — Controllers

**Goal:** Thin HTTP adapters that call services and map results to responses.

One controller file per domain. Each exported function:
1. Extracts validated request data
2. Calls service
3. Maps `{ ok: false, error }` → HTTP error response
4. Maps `{ ok: true, data }` → HTTP success response

Controllers own: cookie setting/clearing, response status codes, cookie options.

---

### Phase 5 — Routes (Slim Down)

**Goal:** Routes only register — no logic.

Each route file after refactor:
```ts
export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/register', { config: { rateLimit: REGISTER_RATE } }, registerController);
  app.post('/login',    { config: { rateLimit: LOGIN_RATE } },    loginController);
  app.post('/refresh',  { config: { rateLimit: REFRESH_RATE } },  refreshController);
  app.post('/logout',                                              logoutController);
}
```

---

### Phase 6 — Tests

**Goal:** 100% coverage across all layers.

#### 6.1 Lib tests (`src/lib/__tests__/`)
- `crypto.test.ts` — encrypt/decrypt roundtrip, tampered ciphertext, wrong key
- `jwt.test.ts` — sign/verify, expired token, wrong secret, malformed token
- `password.test.ts` — hash/verify, wrong password, timing safety

#### 6.2 Service unit tests (`src/services/__tests__/`)
- `session.service.test.ts` — createSession, findSession (found/not found/expired/revoked), revoke
- `auth.service.test.ts` — register (happy/duplicate email), login (happy/wrong password/not found), refresh (happy/expired/reuse/cap), logout
- `oauth.service.test.ts` — createState, verifyAndConsume (valid/expired/used/wrong purpose)
- `token-refresh.service.test.ts` — fresh token (no refresh needed), expired (refresh succeeds/fails)
- `calendar.service.test.ts` — events returned, token refresh triggered, empty calendars
- `spotify.service.test.ts` — now-playing (playing/paused/no device), controls, top tracks
- `integrations.service.test.ts` — list both/one/none, unlink valid/invalid provider

#### 6.3 Route integration tests (`src/routes/__tests__/`)
- `auth.routes.test.ts` — all 4 endpoints, full request cycle, cookie behavior
- `auth-google.routes.test.ts` — start (valid redirectUri), exchange (valid/invalid state/code)
- `oauth-google.routes.test.ts` — same pattern (requires auth)
- `oauth-spotify.routes.test.ts` — same pattern (requires auth)
- `calendar.routes.test.ts` — valid range, missing auth, invalid days param
- `spotify.routes.test.ts` — now-playing, controls (auth required)
- `integrations.routes.test.ts` — list, delete valid/invalid provider
- `me.routes.test.ts` — authenticated/unauthenticated
- `settings.routes.test.ts` — GET (default), PUT (valid/invalid body)

---

## Execution Order

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6
Tooling → Types → Services → Controllers → Routes → Tests
```

Each phase is a separate commit. Services are written test-first where possible (write the test, then the service function).

---

## Files to Keep Unchanged

- `src/lib/crypto.ts` — already clean, just needs tests
- `src/lib/jwt.ts` — already clean, just needs tests
- `src/lib/password.ts` — already clean, just needs tests
- `src/middleware/authenticate.ts` — clean, needs tests
- `src/db/schema.ts` — already correct
- `src/db/client.ts` — keep
- `src/config.ts` — keep (already Zod-validated)
- `src/plugins/cors.ts` — keep
- `src/plugins/rate-limit.ts` — keep

---

## Estimated New Files

| Category | Count |
|----------|-------|
| Types files | 3 |
| Service files | 7 |
| Controller files | 7 |
| Refactored route files | 10 |
| Test files | ~20 |
| Config files (eslint, vitest, prettier) | 3 |
| Test utilities | 2 |
| **Total new/changed files** | **~52** |
