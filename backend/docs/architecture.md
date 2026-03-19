# Architecture Principles

## Layer Responsibilities

```
src/
├── routes/          # HTTP layer only — register routes, parse input, call controller
├── controllers/     # Orchestration — calls services, formats HTTP response
├── services/        # Business logic — pure functions, no HTTP, no framework coupling
├── lib/             # Pure utilities — crypto, jwt, password, token helpers
├── middleware/      # Cross-cutting concerns — authentication, logging
├── plugins/         # Fastify plugins — cors, rate-limit
├── db/              # Database — schema, client, migrations
├── config.ts        # Zod-validated env (single source of truth)
└── types/           # Shared TypeScript types across layers
```

## Layer Rules

### Routes (`routes/*.ts`)
- **Only** register routes with Fastify, attach schemas and middleware
- Delegate immediately to controller — zero business logic
- Owns: HTTP method, path, rate limit config, preHandler list
- Never: touch the DB, compute tokens, call external APIs

```ts
// Good
app.post('/login', { config: { rateLimit: ... }, preHandler: [] }, loginController);

// Bad — business logic in route handler
app.post('/login', async (req, reply) => {
  const user = await db.select()...
});
```

### Controllers (`controllers/*.ts`)
- Extract and validate request data
- Call one or more services
- Map service result to HTTP response (status code, body, cookies)
- Never: contain business logic or DB queries

```ts
// Good
export async function loginController(req: FastifyRequest, reply: FastifyReply) {
  const { email, password } = req.body as LoginBody;
  const result = await authService.login(email, password, req);
  reply.setCookie(COOKIE_NAME, result.refreshToken, cookieOpts);
  return reply.send({ accessToken: result.accessToken });
}
```

### Services (`services/*.ts`)
- Pure TypeScript — no Fastify types, no `req`, no `reply`
- Return typed result objects, never throw HTTP errors
- Use typed error returns: `{ ok: true, data } | { ok: false, error: ErrorCode }`
- May call DB and other services; never call external HTTP directly — delegate to lib/

```ts
// Good
export async function login(email: string, password: string): Promise<LoginResult> {
  const user = await findUserByEmail(email);
  if (!user) return { ok: false, error: 'INVALID_CREDENTIALS' };
  ...
  return { ok: true, data: { accessToken, refreshToken } };
}
```

### Lib (`lib/*.ts`)
- Pure functions with no side effects where possible
- No DB access, no config import (receive values as arguments)
- Fully unit-testable in isolation

### Types (`types/*.ts`)
- All shared interfaces and type aliases live here
- No logic — only `interface`, `type`, `enum`, `const` enums

---

## Global Constants

- Defined at the **top of the module** that owns them, `UPPER_SNAKE_CASE`
- If used across multiple modules → move to `types/constants.ts`
- Never inline magic numbers

```ts
// Good
const REFRESH_WINDOW_DAYS = 7;
const MAX_RENEWALS = 4;

// Bad
expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
```

---

## Error Handling

- Services return discriminated unions: `{ ok: true, data: T } | { ok: false, error: ErrorCode }`
- Controllers map `ErrorCode` → HTTP status + message
- No uncaught promise rejections — all async calls wrapped
- Typed error codes as string literal unions, not magic strings

```ts
export type AuthError =
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_TAKEN'
  | 'SESSION_NOT_FOUND'
  | 'SESSION_EXPIRED'
  | 'SESSION_LIMIT_REACHED'
  | 'TOKEN_REUSE_DETECTED';
```

---

## File Naming

| Layer       | Pattern                           | Example                    |
|-------------|-----------------------------------|----------------------------|
| Routes      | `routes/<feature>.routes.ts`      | `auth.routes.ts`           |
| Controllers | `controllers/<feature>.controller.ts` | `auth.controller.ts`   |
| Services    | `services/<feature>.service.ts`   | `auth.service.ts`          |
| Lib         | `lib/<purpose>.ts`                | `lib/jwt.ts`               |
| Types       | `types/<feature>.types.ts`        | `types/auth.types.ts`      |
| Tests       | Co-located `__tests__/<file>.test.ts` | `services/__tests__/auth.service.test.ts` |

---

## Import Order

1. Node built-ins (`node:crypto`, `node:fs`)
2. External packages (`fastify`, `drizzle-orm`, `zod`)
3. Internal absolute (`../db/schema`, `../lib/jwt`)
4. Types last (`import type { ... }`)

Blank line between each group.
