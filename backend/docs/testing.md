# Testing Principles

## Stack

- **Vitest** — ESM-native, TypeScript-first, fast (no transpile overhead)
- **@vitest/coverage-v8** — V8-based coverage (accurate for ESM)
- **fastify** test mode — `app.inject()` for route integration tests without a real server
- **Real test DB** — a dedicated Postgres DB spun up in Docker for integration tests (no mocking the DB)

---

## Coverage Target

**100% line + branch coverage** on:
- All service files (`services/`)
- All lib files (`lib/`)
- All controller files (`controllers/`)
- All route files (`routes/`)

Coverage is enforced in CI — the build fails if below threshold.

---

## Test Types

### Unit Tests — Services & Lib

- Test **one function at a time** in isolation
- Mock all external dependencies (DB, other services) via `vi.mock()`
- Fast, no I/O, no network
- Located at: `src/services/__tests__/<name>.service.test.ts`
- Located at: `src/lib/__tests__/<name>.test.ts`

```ts
// Example: lib/jwt.test.ts
import { describe, it, expect } from 'vitest';
import { signAccessToken, verifyAccessToken } from '../jwt';

describe('signAccessToken', () => {
  it('produces a verifiable token with correct payload', async () => {
    const token = await signAccessToken({ sub: 'user-1', email: 'a@b.com', name: 'Alice' });
    const payload = await verifyAccessToken(token);
    expect(payload.sub).toBe('user-1');
    expect(payload.email).toBe('a@b.com');
  });
});
```

### Integration Tests — Routes

- Test the full request → response cycle using `app.inject()`
- Use a real test database (isolated from dev DB, reset between test suites)
- No mocking of DB or HTTP layers — test the real integration
- Located at: `src/routes/__tests__/<name>.routes.test.ts`

```ts
// Example: routes/__tests__/auth.routes.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../app';

describe('POST /auth/login', () => {
  it('returns 401 for wrong password', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      body: { email: 'x@x.com', password: 'wrong' },
    });
    expect(res.statusCode).toBe(401);
  });
});
```

---

## Test Structure Rules

- **Arrange / Act / Assert** — always three clear phases, separated by blank lines
- One logical assertion group per `it()` block — test one thing
- Descriptive names: `it('returns 401 when refresh token is revoked')`
- Use `beforeAll` / `afterAll` for DB setup/teardown at suite level
- Use `beforeEach` to reset mutable state between tests

---

## Mocking Rules

- **Never** mock the database in integration tests
- **Always** mock in unit tests using `vi.mock('../db/client')`
- External APIs (Google, Spotify) are always mocked — never make real HTTP calls in tests
- Time-sensitive tests (`expiresAt`, JWT TTL) use `vi.useFakeTimers()`

---

## Database Test Isolation

- Test DB URL: `DATABASE_URL_TEST` env variable
- Run `drizzle migrate` against test DB before test suite
- Truncate all tables in `beforeEach` for integration tests
- Never share state between test files

---

## Test File Checklist

Each new feature must include:
- [ ] Unit tests for every service function (happy path + all error branches)
- [ ] Unit tests for any new lib utility
- [ ] Integration test for each route (success + validation error + auth error)
- [ ] Edge cases: empty input, boundary values, expired tokens, concurrent calls

---

## Running Tests

```bash
npm test              # run all tests once
npm run test:watch    # watch mode
npm run test:coverage # with coverage report
npm run test:ui       # Vitest UI (browser)
```

Coverage report: `coverage/index.html`
