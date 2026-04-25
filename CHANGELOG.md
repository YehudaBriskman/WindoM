# Changelog

All notable changes to WindoM will be documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versions follow [Semantic Versioning](https://semver.org/).

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
