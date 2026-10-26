# Changelog

All notable changes to WindoM will be documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versions follow [Semantic Versioning](https://semver.org/).

---

## [1.5.1] - 2026-10-26

A fix release. Signing in with Google succeeded and then immediately undid
itself, which also took Spotify and Calendar with it - one fault, several
symptoms.

### Fixed
- **Signing in logged you straight back out.** The sign-in itself always
  worked; what followed did not. Calendar, Spotify and Gmail each return 401
  when their own provider grant is stale, every one of those was treated as
  an expired session and drove a token refresh, and five of them exhausted
  the refresh endpoint's budget of five per fifteen minutes within seconds.
  The resulting 429 was then read as a dead session and logged the user out,
  so the more integrations someone had connected, the faster it happened. A
  401 from a provider route is now that provider's to report, and being
  throttled is no longer mistaken for being signed out.
- **Connecting an app closed the settings panel.** The app centre is drawn
  above the settings panel but lives outside it, so clicking Connect counted
  as a click away from the panel and dismissed it - along with the component
  that was in the middle of talking to Google or Spotify. Escape now closes
  the app centre first rather than the panel underneath it.
- **Spotify ignored the first press of a button.** Play, pause, next and
  previous all took effect at Spotify and then reported the state from
  before the command for up to fifteen seconds, because the cached answer
  was left in place. Next showed the previous track, pause came back
  playing, and the progress bar kept advancing over it - so the control
  looked ignored rather than slow, and pressing again appeared to fix it.
- **Focus mode had one way out, and the guide named two that did not exist.**
  Clicking anywhere and pressing Escape both leave focus mode now, as the
  guide has always said they would. Neither interrupts the exit animation
  once it has started.
- The Gmail widget stopped polling a service the server no longer offers.
  It had been asking once every forty-five seconds, forever, on the strength
  of a setting saved before the widget was withdrawn.

### Changed
- A release now confirms what the Chrome Web Store did with it. The upload
  step reports success without saying anything, which is how 1.5.0 reached
  the store and sat there as an unsubmitted draft while CI showed green. The
  submission is made explicitly and its answer is read, and a release fails
  if the store rejected the package.
- Dependency majors: `@crxjs/vite-plugin` 3, `@fastify/rate-limit` 11,
  `dotenv` 18, `jsdom` 30, and the GitHub Pages actions. The first of those
  closes a real gap - the plugin was a major behind the bundler it hooks
  into.

---

## [1.5.0] - 2026-10-26

The glass is computed optics now rather than a stack of CSS tricks, the Gmail
widget is removed, and the site is rebuilt. The Gmail removal is a licensing
decision rather than a product one: reading mail required a Google scope that
would have cost $500-4,500 a year, every year, to keep publishable.

### Removed
- **The Gmail widget.** It needed `gmail.readonly`, which Google classes as a
  restricted scope: publishing an extension that requests it requires a
  third-party CASA security assessment, priced per tier and recurring annually,
  because the mail passes through our server rather than staying in the browser.
  The consent screen now asks only for Calendar and sign-in, which verify for
  free. Nothing was deleted - the feature is behind `GMAIL_ENABLED`, off by
  default - so it can return if the reading is ever moved into the extension,
  where the assessment requirement may not apply.
- The close buttons on the settings panel and the right sidebar, and the
  full-page dimming behind them. Both panels are anchored to a corner and
  opened by a visible button, so a scrim and an X were saying something the
  panel's own position already said. Dismissal is now click-outside, Escape, or
  the same button that opened it.
- The scrollbar inside the settings panel. A card clipped by the panel edge
  already reads as "more below".

### Added
- **Real refraction.** The rim of every pane bends the wallpaper behind it
  through Snell's law, across a quartic squircle profile, with the direction
  taken from a rounded-rectangle distance field and incidence capped at 65
  degrees - past that, Fresnel reflectance means a real surface reflects rather
  than transmits. Each distinct pane geometry gets its own displacement field,
  generated once and cached.
- **A light source with mass.** The specular highlight tracks the pointer
  through a stiff spring while the material gathers behind it through a softer
  one. A highlight pinned exactly to the cursor reads as a texture painted on
  the surface; one that lags and settles reads as light moving across an object.
- windom.app is a working new tab rather than a page about one: the visitor's
  own clock and greeting, the four bundled wallpapers crossfading through a day
  as you scroll, and each hour foregrounding the part of the product you would
  reach for then
- The site's content is built from the extension's own screenshots and
  wallpapers instead of a feature grid

### Changed
- **The glass is a light material.** Legibility comes from grounds underneath
  the text rather than from dimming the pane: chrome is glass, content is paper.
  Earlier attempts to rescue the look by tinting and darkening were
  compensating for a backdrop that was already being discarded, which is how it
  spent two rounds looking like a brown slab.
- One motion system across every pane, with durations sized by how much
  material is moving and exits quicker than entries
- 25 distinct radius expressions collapsed to 5 tokens - pills for compact
  chrome, squircles for content
- The extension stops offering Gmail when the server does not provide it,
  rather than showing a Connect button that could never finish
- `/integrations` reports which features the server actually offers
- The privacy policy lists exactly the scopes requested and carries the Limited
  Use statement the Google API Services User Data Policy requires

### Fixed
- **The refraction was erasing the backdrop instead of bending it.** A
  `feDisplacementMap` fed by `feImage` returns nothing when referenced from
  `backdrop-filter`, so the pane went flat and everything behind it vanished.
  This one fault explains every symptom the work started from: the blur looked
  wrong because there was no backdrop left to blur, and nothing curved because
  nothing was being displaced. The rim now displaces its own aligned copy of
  the wallpaper with `filter:`, which does work.
- **The effect was missing from every build.** Blink treats
  `-webkit-backdrop-filter` as a true alias, so the minifier kept the prefixed
  copy and discarded the real declaration.
- 519ms of script on every panel open, from rasterising a full displacement
  field on each frame of the opening animation
- Layout thrashing: `getBoundingClientRect` read per pane per frame and
  interleaved with style writes
- Panels animated open but snapped shut, because `transition` is a single
  property and the material stylesheet was replacing the panel's own
- The right sidebar closed itself on the click that opened it
- The weather widget had no glass at all - it renders a different element while
  loading, and the hook had already registered the first one
- Focus mode on the site replaced the clock instead of drawing over it
- The backend test suite and the Docker Compose files run on a clean checkout,
  where before both needed a hand-made `.env` that is not in the repository

---

## [1.4.1] - 2026-10-20

A hardening and reliability release following a production incident where a
read-only database silently crash-looped the API for months. No new
end-user features beyond a GitHub integration; everything else is about
not breaking again.

### Security
- Refresh tokens moved out of response bodies into HttpOnly cookies, and
  refresh-session rotation made transactional to close a race window
- Email-verification and password-reset tokens are now hashed at rest
  (bcrypt + a SHA-256 lookup index) instead of stored as plaintext
- Hardened extension token and OAuth flows: token-expiry validation with
  an extended refresh lock, OAuth callback state validation, quick-link
  URLs validated against an allowlist before being persisted, and
  `chrome.runtime.onMessage` now checks `sender.id` and the message type
  before acting on it
- Backend request baseline hardened across every response: a
  Permissions-Policy header, a request timeout, SameSite/Secure cookie
  assertions, and request correlation IDs for tracing
- All outbound external API calls now time out instead of hanging
  indefinitely
- CI no longer hardcodes JWT/encryption test secrets: every run now derives
  throwaway values of its own, so no real secret is referenced and
  contributor forks can run the full suite. The flyctl deploy action is
  also pinned to a commit rather than tracking `@master`

### Fixed
- A read-only Postgres database can no longer crash-loop the API:
  migrations are decoupled from server startup and run once per deploy via
  `release_command`; a new `/health/ready` readiness endpoint and a
  database-aware `/health` give monitoring a real signal instead of a
  false "healthy"
- Calendar events response schema corrected so every event carries its
  `date` field, fixing events showing as "No upcoming events" despite
  valid backend data
- Keyboard accessibility: restored keyboard navigation on `GlassSelect`,
  and replaced clickable `<div>`s with accessible `<button>` elements

### Changed
- `npm` removed from the production runtime container image, shrinking
  the attack surface and clearing two unreachable CVEs the image scanner
  was blocking on
- Large dependency upgrade sweep across both workspaces, notably
  `lucide-react` 0.468 → 1.56 and `jose` 5 → 6
- Declared Fly VM memory reconciled with the size of the machine actually
  running in production

### Added
- A shared release gate that every tag-triggered workflow (backend
  deploy, Chrome Web Store publish) must pass before anything ships,
  runnable as a manual dry run before tagging; a scheduled job also
  detects when the deployed backend has drifted too far from `main`
- Trivy container-image scanning and `npm audit` gates added to CI, with
  Dependabot configured to group related dependency upgrades
- Active session management: `GET`/`DELETE /me/sessions` endpoints and an
  Account settings UI to list and revoke sessions
- GitHub integration: PAT-based connection, a settings panel, and a
  sidebar widget showing notifications, review requests, and assigned
  issues
- Terms of Use page, and an updated Privacy Policy reflecting the
  extension's current third-party integrations

---

## [1.4.0] - 2026-04-25

### Added
- Gmail inbox widget showing unread count and recent messages, authorized
  through an expanded Calendar+Gmail OAuth consent
- Finance dashboard with separate scrollable Stocks and Crypto cards
  (Yahoo Finance + CoinGecko), ticker autocomplete search, and per-card
  show/hide toggles
- Apps Hub: Calendar, Spotify, Finance, Gmail, History, and Tasks
  consolidated into icon-only cards that open a shared App Center panel
- Settings templates gallery with 6 curated presets for first-time setup
- First-run onboarding walkthrough, a one-time Spotify connect banner for
  existing users, and a persistent in-app Help & Guide panel; the full
  guide is also published at windom.app/guide with a Hebrew/English
  toggle
- OpenAPI docs served at `/docs` in development (Fastify Swagger)
- Pre-deploy Postgres backup and post-deploy health check in the backend
  deploy workflow

### Changed
- Google Calendar connect/disconnect moved from Account settings into its
  own Apps Hub panel
- Weather widget collapses to icon + temperature, expanding to show city
  and condition on hover
- Settings backend updated to the sectioned schema with deep-merge
  upserts on save; device-local focus-timer state moved out of synced
  storage into `chrome.storage.local`
- Magic timeout values and repeated inline styles consolidated into named
  constants and shared CSS utility classes

### Fixed
- Settings deep-merge on load, so schema fields added after a user's last
  save no longer come back `undefined`
- Finance price fetching stabilized after several Yahoo Finance/Stooq
  reliability issues (symbol encoding, session-crumb requirement, retry
  fallback)
- Calendar events no longer dropped when the `calendarConnected` flag
  drifted out of sync with a still-valid backend token
- Missing migrations registered in the Drizzle journal, fixing a Postgres
  type error on registration
- Double-submit race in settings forms; spurious background reloads on
  API-key edits; service-worker crashes on post-suspend tab events; a
  `MutationObserver` leak on page unload
- Accessibility: `aria-label`s added to icon-only buttons, and a focus
  trap added to the search overlay

### Security
- Session IP address and user-agent hashed before storage instead of
  kept as plaintext PII
- Refresh-token bcrypt rounds reduced and the refresh path parallelized;
  OAuth provider responses (Google, Spotify) validated with Zod instead
  of unsafe type casts
- `/auth/refresh` rate limit tightened, CORS restricted to a configured
  extension ID, and generic error messages returned for 4xx responses in
  production
- Narrowed the `google.com` host permission in the manifest to only what
  the extension actually uses

### Performance
- Debounced calendar refetch on settings changes; new
  `useSettingsSection` hook limits component re-renders to the section
  that actually changed
- Reduced database connection pool size with exhaustion logging to catch
  leaks before they cause 503s

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
