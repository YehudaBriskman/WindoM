# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**WindoM** - A Chrome extension new tab dashboard built with React 19, TypeScript, Vite 8, hand-written CSS, and lucide-react icons.

Features: clock, greeting, background images (Unsplash/local), weather widget, quick links + dock bar, daily quotes, focus mode with timer, todo list, calendar events, Gmail inbox, Spotify, a finance dashboard, GitHub pull requests and issues, tab history, and a full settings panel.

## Tech Stack

- **React 19** - Functional components + hooks
- **TypeScript** - Strict mode
- **Vite 8** + `@crxjs/vite-plugin` - Chrome extension builds with HMR
- **Plain CSS** - no framework. `src/styles/globals.css` (~4900 lines) holds layout and components; `src/styles/glass.css` holds the glass material. Design tokens are CSS custom properties in the `:root` block at the top of globals.css: radius (`--r-pill`, `--r-card`, `--r-control`, `--r-inner`, `--r-xs`), spacing (`--space-1`..`6`), control heights and panel sizes. Use them rather than literals.
- **lucide-react** - SVG icon library

## Development Commands

```bash
npm run dev      # Start Vite dev server with HMR (load dist/ as unpacked extension)
npm run build    # tsc + vite build → dist/ folder
npm run preview  # Preview production build locally
```

### Loading the Extension

- **Dev (HMR)**: Run `npm run dev`, then load the project root as unpacked at `chrome://extensions/`
- **Production**: Run `npm run build`, then load the `dist/` folder as unpacked

## Project Structure

```
web/                               (repo root for the extension)
├── manifest.json                  (CRXJS reads this directly - Manifest V3)
├── newtab.html                    (Vite entry: <div id="root">)
├── vite.config.ts
├── tsconfig.json / tsconfig.node.json
├── package.json
├── icons/                         (extension icons: 16, 48, 128)
├── public/data/quotes.json        (local quotes data)
└── src/
    ├── main.tsx                   (ReactDOM.createRoot)
    ├── App.tsx                    (root component + layout, provider tree)
    ├── types/                     (Settings, WeatherData, Quote, CalendarEvent, TodoItem)
    ├── lib/chrome-storage.ts      (typed wrappers for chrome.storage.sync/local)
    ├── contexts/
    │   ├── SettingsContext.tsx    (settings state + cross-tab sync)
    │   ├── BackgroundContext.tsx  (background image state)
    │   └── FocusTimerContext.tsx  (focus timer + overlay state)
    ├── hooks/                     (one hook per feature: useClock, useWeather, useLinks, useTodos, useCalendar, etc.)
    ├── components/
    │   ├── layout/                (TopBar, CenterContent, BottomSection, RightSidebar)
    │   ├── background/            (BackgroundOverlay, PhotographerCredit)
    │   ├── clock/                 (Clock, Greeting, EditableName)
    │   ├── weather/               (WeatherWidget, WeatherIcon)
    │   ├── links/                 (QuickLinks, LinkItem, DockBar, DockItem)
    │   ├── focus/                 (FocusInput, FocusPresets, SearchBar, FocusOverlay)
    │   ├── quotes/                (QuoteDisplay)
    │   ├── sidebar/               (TodoSection, TodoItem, CalendarSection, EventItem)
    │   ├── settings/              (SettingsButton, SettingsPanel, SettingsNav, SettingsMessage)
    │   │   └── sections/          (GeneralSettings, BackgroundSettings, WeatherSettings, QuotesSettings, LinksSettings)
    │   └── ui/                    (GlassPanel, GlassButton, GlassInput)
    ├── utils/                     (weather-icons, temperature, time, url, hash)
    └── styles/globals.css         (:root design tokens, layout, components)
    └── styles/glass.css           (the liquid glass material)
```

## Architecture

- **State**: React Context wraps the entire app in order: `SettingsProvider → BackgroundProvider → FocusTimerProvider`. Settings sync with `chrome.storage.sync` and propagate across tabs via `chrome.storage.onChanged`.
- **One hook per feature**: Each module (weather, quotes, links, etc.) has a dedicated custom hook encapsulating all logic, API calls, and caching.
- **Liquid glass**: plain classes (`glass-panel`, `glass-sidebar`, `glass-dock`, ...) in `glass.css`. Each pane blurs its backdrop lightly and refracts the wallpaper through a generated displacement field along its rim - `src/lib/liquid-glass.ts` computes the optics, `useLiquidGlass` measures panes and drives the light. The refraction is applied with `filter:` to a copy of the wallpaper, *not* `backdrop-filter`, which silently erases the backdrop when given a displacement map.
- **Chrome APIs**: Typed wrappers in `src/lib/chrome-storage.ts` for async get/set/onChange on both sync and local storage.
- **Manifest V3**: Extension uses `chrome.storage` (not `localStorage`) and `host_permissions` for external APIs (Unsplash, Open-Meteo, Quotable, Yahoo Finance, CoinGecko, GitHub).

## Key Patterns

- Settings changes trigger re-renders through `SettingsContext` - no manual DOM manipulation
- Cross-tab sync happens automatically via `chrome.storage.onChanged` listener in `SettingsContext`
- Weather/background data cached in `chrome.storage.local` (larger quota) rather than sync storage
- Focus timer uses `body.focus-active` CSS class to hide all UI except the overlay
- `SettingsContext` exposes `get()`, `update()`, `updateMultiple()`, and `reset()` methods

## Publishing

The `.github/workflows/publish-chrome.yml` workflow auto-publishes to Chrome Web Store when a git tag matching `v*` is pushed. Required secrets: `CHROME_EXTENSION_ID`, `CHROME_PUBLISHER_ID`, `CHROME_CLIENT_ID`, `CHROME_CLIENT_SECRET`, `CHROME_REFRESH_TOKEN`, and `VITE_BACKEND_URL`. The workflow also accepts a manual `workflow_dispatch` with a tag, for re-publishing an existing release.

## Content Script Match Scope (Issue #203 — Resolved as By Design)

The content script declared in `manifest.json` uses `"matches": ["http://*/*", "https://*/*"]`. This is the minimum required scope and cannot be narrowed without breaking the core feature.

The content script renders a full-page shadow DOM overlay (the tab sidebar) that must be present on every web page the user visits. There is no URL pattern more restrictive than `<all_urls>` that would preserve this behavior. Issue #203 is resolved as "by design" — the broad match is a functional requirement, not an oversight.
