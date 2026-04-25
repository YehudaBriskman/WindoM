/** Centralised timing constants — no magic numbers scattered across the codebase. */

// SearchOverlay
export const OVERLAY_OPEN_FOCUS_DELAY_MS = 30;
export const OVERLAY_CLOSE_RESET_DELAY_MS = 300;
export const SUGGESTIONS_DEBOUNCE_MS = 180;
export const SEARCH_API_TIMEOUT_MS = 2000;

// Quotes
export const QUOTE_FADE_DURATION_MS = 300;

// Spotify
export const SPOTIFY_CONTROL_REFETCH_DELAY_MS = 400;
export const SPOTIFY_TICKER_INTERVAL_MS = 1000;

// Clock / Greeting
export const CLOCK_UPDATE_INTERVAL_MS = 1000;
export const GREETING_UPDATE_INTERVAL_MS = 60_000;

// Settings UI confirmations
export const COPY_CONFIRM_DURATION_MS = 2000;
export const NAME_SAVE_MSG_DURATION_MS = 2000;
export const PW_SAVE_MSG_DURATION_MS = 3000;

// App loader
export const LOADER_FADE_DURATION_MS = 600;

// Calendar fetch debounce
export const CALENDAR_FETCH_DEBOUNCE_MS = 500;

// Gmail poll interval (45s matches server-side cache TTL)
export const GMAIL_POLL_INTERVAL_MS = 45_000;
