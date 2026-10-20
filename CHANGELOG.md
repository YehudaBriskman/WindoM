# Changelog

All notable changes to WindoM will be documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versions follow [Semantic Versioning](https://semver.org/).

---

## [1.5.0] - 2026-10-20

This release is dominated by security hardening and release-reliability work following a production outage; see Security and Fixed below before upgrading a production deployment.

### Security
- Refresh tokens are now delivered in HttpOnly cookies instead of the response body, and refresh session rotation (revoke old + create new) is now transactional so a crash or race can no longer leave a session half-rotated.
- Password-reset and email-verification tokens are now stored as bcrypt hashes with a SHA-256 lookup index instead of plaintext, so a database dump alone can no longer be used to take over an account with a pending token.
- Extension hardening: the background service worker now validates `chrome.runtime.onMessage` sender IDs and message shapes before acting on them, OAuth callbacks validate the `state` parameter, and the API client validates token expiry with an extended refresh lock to prevent concurrent refresh races.
- Quick links and the dock bar now reject non-http(s) destinations (and oversized URLs) before they're persisted.
- Backend request baseline hardened: a `Permissions-Policy` header denying geolocation/microphone/camera, a 30s `requestTimeout`, an assertion that `SameSite=None` cookies are always `Secure`, and request IDs added to structured logs for correlation.
- All external API calls (Calendar, Gmail, GitHub, Spotify, OAuth token exchange) now carry timeouts so a slow upstream can no longer hang a request indefinitely.
- CI/CD hardening: hardcoded test JWT/encryption secrets moved out of workflow files into GitHub Actions secrets, the `flyctl` deploy action pinned to an immutable commit instead of a floating tag, and `npm` (and its lockfile) removed from the backend's runtime container image to drop two unreachable HIGH-severity CVEs from the image scan.

### Added
- Active session management: `GET /me/sessions` and `DELETE /me/sessions/:id` let a user list and revoke their own refresh sessions, surfaced through a new Active Sessions panel in Account settings.
- GitHub integration: a PAT-based widget and settings panel showing notifications, review requests, and assigned issues, with the token verified and stored encrypted server-side.
- A database-aware `/health` endpoint plus a new `/health/ready` readiness probe, so monitoring and deploy gates can tell a reachable-but-read-only database apart from a genuinely healthy one.
- A shared, reusable release-gate workflow (lint, typecheck, dependency audit, full test suite, container image scan, infra preflight) that every tag-triggered workflow — backend deploy and Chrome Web Store publish alike — must now pass before anything ships; it can also be dry-run manually ahead of tagging.
- A scheduled workflow that detects deploy drift: an old release still running in production, or `main` moving far ahead of what's actually deployed.
- Trivy container image scanning and a high-severity `npm audit` gate added to CI; Dependabot configured with grouped dependency updates for both workspaces.
- Terms of Use page, and an updated Privacy Policy covering the Gmail and Finance integrations, the Open-Meteo weather switch, and a full browser-permissions table.

### Changed
- Large dependency upgrade sweep across both workspaces, most notably `lucide-react` 0.468 → 1.56 and `jose` 5 → 6, plus coordinated React/ESLint major-version bumps and routine `fastify`, `pg`, `pino`, and GitHub Actions updates.
- Production Fly.io VM memory declaration reconciled with what's actually running, and `max_machines_running` capped to bound worst-case scaling cost.

### Fixed
- A read-only database (Postgres forces itself read-only at 90% disk) no longer crash-loops the API: migrations now run once per deploy via `release_command` ahead of the app starting, instead of as a hard precondition for server startup — the proximate cause of a prior production outage.
- Calendar events were missing their `date` field end-to-end because the Fastify response schema didn't match the service's actual shape, so the "upcoming events" filter silently matched nothing.
- Keyboard accessibility: the GlassSelect dropdown and several clickable widgets (focus input, quote display, search overlay, photo grid) now respond to keyboard input and carry proper ARIA roles/labels.
- Assorted test fixes following the token-hashing change and other hardening work (updated e2e assertions, removed now-unnecessary type assertions).

---

## [1.4.0] - 2026-04-25

### Added
- Gmail integration: an inbox widget showing unread count and recent messages, with an expanded OAuth consent flow covering both Calendar and Gmail scopes together.
- Finance dashboard: separate scrollable Stocks and Crypto cards on the main screen, backed by Yahoo Finance (stocks, free, no API key) and CoinGecko (crypto), with ticker autocomplete search and per-category show/hide toggles.
- Apps Hub: a single icon-grid entry point for every integration (Calendar, Spotify, Finance, Tasks, History), replacing one settings tab per integration, with Calendar's connect/disconnect flow moved out of Account settings and into its own Apps Hub panel.
- Settings templates gallery with six curated starting layouts (Minimal, Productivity, Inspiration, and three more), each patching only the sections it defines.
- First-run onboarding walkthrough, a one-time Spotify-connect banner for existing users, and a persistent in-app Help & Guide panel; the authoritative guide was later moved to windom.app/guide with full Spotify BYOA, Calendar, Focus, Background, Weather, and Account coverage and a Hebrew/English toggle.
- OpenAPI docs served at `/docs` in development via `@fastify/swagger` and `@fastify/swagger-ui`.
- Pre-deploy Postgres backup and a post-deploy `/health` poll in the deploy workflow, so a bad deploy or failed backup now blocks and surfaces instead of shipping silently.
- Pagination (`limit`/`offset`) added to the calendar events endpoint.

### Changed
- Settings schema reworked from a flat structure into sections (general, calendar, finance, etc.), with the backend deep-merging incoming sections into stored data on save instead of overwriting the whole document, and the extension migrating existing flat settings automatically.
- Focus-timer state moved out of synced storage into `chrome.storage.local` since it's inherently device-local.
- Weather widget redesigned into a collapsed circle (temperature only) that expands on hover to reveal the icon, city, and condition.
- Backend hardening: Postgres connection pool size reduced, CORS narrowed to a configured extension ID, the `/auth/refresh` rate limit cut from 30 to 5 per 15 minutes, 4xx error messages genericized in production, OAuth provider responses validated with Zod instead of unsafe casts, session IP/user-agent stored as SHA-256 hashes instead of plaintext, and session-token bcrypt rounds reduced from 10 to 6 to cut hot-path latency (session tokens have enough entropy that this doesn't weaken them).
- Google host permission in the manifest narrowed to only the favicon service actually used, removing a broad `google.com/*` grant.
- Docker image now runs as a non-root user; Docker Compose credentials moved to `.env`-driven variables.

### Fixed
- Finance pricing repeatedly broke against upstream outages and header/encoding quirks (Yahoo Finance's crumb requirement, Stooq's multi-value `Content-Disposition` header, caret-in-symbol encoding) — resolved by settling on Yahoo Finance's v7/chart endpoints with correct per-symbol encoding.
- Settings loaded from sync storage could silently drop newly-added fields (e.g. toggles); loading now deep-merges each section against its defaults.
- Calendar events stopped loading when the `calendarConnected` flag drifted out of sync with an otherwise-valid backend token.
- A Fastify shared-schema registration bug was breaking every integration test at startup; a missing `hasPassword` field was being silently stripped from `GET /me` responses.
- Two Drizzle migrations (OAuth/session indexes, IP column type change) were missing from the migration journal and had never actually run in CI.
- Double-submit race in settings forms, a service-worker-suspend race in tab-change broadcasting, and a `MutationObserver` leak on page unload.
- Accessibility: icon-only interactive elements converted to semantic buttons with ARIA labels, and a focus trap added to the search overlay.

---

## [1.3.5] - 2026-04-19

### Added
- Scroll-driven corner images to hero section of landing page
- Responsive sizing for corner images

### Changed
- Sectioned `Settings` types replacing flat structure; `LegacySettings` kept for migration
- Migration function from flat `LegacySettings` to sectioned shape
- All settings consumers migrated to the new sectioned API
- Updated README and landing page branding with banner image and slogans

### Fixed
- Settings sync conflict resolved with per-key timestamps (last-write-wins eliminated)
- Navigation links normalised to root path for consistency

---

## [1.3.3] - 2026-04-16

### Added
- Email verification and password reset backend (token-based)
- Profile management and email verification UI in extension
- Google Workspace SMTP email service (replaces Resend)
- Redesigned email templates and auth browser pages
- Inline validation on auth login form
- Spotify BYOA (Bring Your Own App) three-state UI
- PKCE support for Spotify OAuth (code verifier, challenge, exchange)
- PKCE columns in OAuth database schema
- PKCE params wired into Spotify OAuth controller
- Spotify token refresh routed by provider client ID
- Wheel scroll control on multi-row dock bar
- **Weather switched to Open-Meteo - no API key required**
- PKCE support added to Google OAuth flows
- Comprehensive end-to-end journey tests (10 groups, 50 assertions)
- Trigger backend deploy on version tag push
- `CNAME` file for custom domain on docs site
- Scroll-driven animations and SVG icons across all docs pages

### Fixed
- Anchor Spotify player to right of dock, preventing layout shift
- Prevent favicon 404 for invalid dock link URLs
- Validate and cap local background image in settings
- Tighten rate limits on brute-force endpoints
- Handle DB pool exhaustion with 503 response
- Remove origin from CORS rejection error message
- Replace non-null assertions with safe type narrowing in OAuth service
- HTML-escape tokens in password reset HTML form
- Add missing return in auth middleware catch block
- Register `@fastify/formbody` for reset-password form submission
- Allow `APP_URL` origin in CORS for reset-password redirect
- Spotify optimistic pause/play state; surface errors in widget and dock
- Lock redirect URI to configured extension ID
- Always set `Secure` flag on refresh token cookie
- Add issuer and audience validation to JWT sign/verify
- Add missing indexes on `oauth_accounts` and `refresh_sessions`
- Replace `console.*` with Fastify structured logger
- Replace unsafe Spotify type cast with Zod-parsed data
- Add ESLint and strict `tsconfig` to extension; lint wired into CI

### Performance
- Cache-Control headers added to stable API endpoints
- Spotify now-playing poll interval increased to 60 s

---

## [1.2.2] - 2026-04-12

### Added
- Danger zone UI for account deletion in settings
- `DELETE /me` account deletion endpoint
- `hasPassword` flag exposed on user record
- `loginWithTokens` helper and improved token persistence

### Fixed
- Filter null items before processing Google Calendar response
- Push only changed setting keys to avoid overwriting unrelated values
- Log integration sync and disconnect errors properly
- Return clear error when no Spotify device is active
- Stop Spotify ticker when track ends naturally
- Register background service worker and content script in manifest
- Quick-link dot visibility and same-tab navigation
- Replace single wait with polling in refresh token lock
- Pin `chrome-extension-upload` action to a stable version

---

## [1.1.0] - 2026-04-04

### Added
- Backend settings sync - extension preferences persisted to user account
- Rolling session window with renewal cap
- Automated Docker migrations on container startup
- Spotify dock widget placed beside the quick-links bar
- Liquid spring expansion animations for all UI elements
- Lazy loading: app loader, code splitting, lazy image loading
- TypeScript types for calendar events, todos, photos, quotes, settings, weather
- Circle upload button and local photo delete
- `GlassSelect` component replacing all native `<select>` elements
- Bundled images support and enhanced clock styles with liquid glass effect
- Command palette mode in search overlay with command suggestions
- Tab management commands via MV3 content scripts
- Auto-populate username from authenticated account name
- TTL cache with concurrency cap for Google Calendar service
- TTL cache for Spotify now-playing service
- Auth loading state and session-limit UX feedback
- Landing page with preview screenshot and feature cards
- Privacy policy page for Chrome Web Store listing
- Full backend: ESLint/Prettier, Vitest, types, services, controllers, routes, tests (phases 1–6)
- O(1) session lookup via SHA-256 index on `refresh_sessions`

### Fixed
- Prevent cross-user Spotify OAuth account hijacking
- Inject production backend URL into extension build
- Persist refresh token reliably across browser restarts
- Dispatch login event on silent auth restore
- Prevent users being randomly disconnected from account
- Harden OAuth cookie and redirect URI security
- Prevent local settings loss on sign-in
- Backend settings always win on sign-in (conflict resolution)
- Isolate local background image per user account
- Preserve user name on Google account merge
- Invalidate service caches on provider disconnect
- Filter unknown keys on backend settings merge
- Validate and sanitize settings `PUT` request body
- Rate limit Google OAuth callback
- OAuth and network error UX improved in extension
- Validate redirect URI early with readable error messages
- Remove broad host permissions and unused manifest entries
- Overhaul all GitHub Actions workflows
- Fix CI PostgreSQL port mismatch
- Strip CRLF from entrypoint.sh; enforce LF via `.gitattributes`

---

## [1.0.0] - 2026-03-19

### Added
- New tab dashboard with glassmorphism design
- Clock and personalized greeting
- Real-time weather widget (OpenWeatherMap)
- Dynamic backgrounds from Unsplash or local images
- Todo list with local persistence
- Calendar section with Google Calendar sync (optional)
- Spotify now-playing widget (optional)
- Quick links and dock bar
- Daily quotes
- Focus mode with countdown timer
- Search bar (Google / DuckDuckGo)
- Full settings panel with per-section controls
- Optional account system with JWT auth and refresh token rotation
- Google Sign-in support
- OAuth token encryption at rest (AES-GCM)
- Backend deployed on Fly.io with PostgreSQL
- GitHub Actions for auto-deploy (backend) and auto-publish (extension)
