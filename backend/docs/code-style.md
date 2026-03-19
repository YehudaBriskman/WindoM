# Code Style & Linting

## Linting Stack

- **ESLint** with `typescript-eslint` (strict mode)
- **Prettier** for formatting (integrated via `eslint-plugin-prettier`)
- Run on every file save (IDE) and enforced in CI

```bash
npm run lint          # check
npm run lint:fix      # auto-fix
```

---

## Naming Conventions

| Thing                          | Convention           | Example                          |
|--------------------------------|----------------------|----------------------------------|
| Global/module constants        | `UPPER_SNAKE_CASE`   | `MAX_RENEWALS`, `COOKIE_NAME`    |
| Functions                      | `camelCase`, verb-first | `createSession`, `findUserByEmail` |
| Variables                      | `camelCase`          | `rawToken`, `matchedSession`     |
| Types & Interfaces             | `PascalCase`         | `LoginResult`, `AuthError`       |
| Enums                          | `PascalCase` members | `ErrorCode.InvalidCredentials`   |
| Files                          | `kebab-case`         | `auth.service.ts`                |
| Test files                     | `<name>.test.ts`     | `auth.service.test.ts`           |
| DB column → TS field           | `camelCase` (Drizzle maps) | `tokenHash`, `renewalCount` |

---

## Function Rules

- **Name with a verb**: `getUser`, `hashPassword`, `issueTokenPair`
- **One responsibility**: if you need "and" to describe it, split it
- **Explicit return type** on all exported functions
- **Max ~30 lines** per function body — extract helpers if longer
- **No default exports** (use named exports only — better refactor tooling)

```ts
// Good
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

// Bad — implicit return type, default export, magic number
export default async (p) => bcrypt.hash(p, 12);
```

---

## Comments

- **Comment the WHY, not the WHAT** — the code shows what; explain why
- Only add comments where the logic is non-obvious
- Section dividers allowed for long files: `// ── Section Name ─────`
- JSDoc (`/** */`) on exported public API functions only

```ts
// Good — explains a non-obvious security decision
// Constant-time rejection prevents timing attacks revealing whether email exists
const dummyHash = '$2b$12$invalidhashpadding000000000000000000000000000000000000';

// Bad — restates the code
// Hash the password
const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
```

---

## Code Order Within a File

1. Imports (node → external → internal → types)
2. Module-level constants (`UPPER_SNAKE_CASE`)
3. Type definitions local to this module
4. Private helper functions (prefixed `_` or kept unexported)
5. Exported functions / classes
6. Default export (if necessary — prefer named)

---

## TypeScript Rules

- `strict: true` in `tsconfig.json` — no exceptions
- No `any` — use `unknown` + type narrowing instead
- No non-null assertions (`!`) without a comment explaining why it's safe
- Prefer `interface` over `type` for object shapes; `type` for unions and aliases
- `readonly` on function parameters that shouldn't mutate
- Explicit `Promise<T>` return types on all async functions

---

## ESLint Rule Highlights

```js
// eslint.config.ts (key rules)
{
  '@typescript-eslint/no-explicit-any': 'error',
  '@typescript-eslint/explicit-function-return-type': 'error',
  '@typescript-eslint/no-floating-promises': 'error',
  '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  '@typescript-eslint/consistent-type-imports': 'error',
  'no-console': ['warn', { allow: ['warn', 'error'] }],
  'prefer-const': 'error',
  'no-var': 'error',
  'eqeqeq': ['error', 'always'],
}
```

---

## What NOT to Do

- No `console.log` in production code (use Fastify's `req.log`)
- No magic numbers — always a named constant
- No `Promise.all` without handling individual rejections when partial failure matters
- No catching errors and swallowing them silently without at least logging
- No `as any` to bypass type errors — fix the type
