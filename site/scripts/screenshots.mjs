#!/usr/bin/env node
/**
 * Retakes the product screenshots the site shows, from the extension as it is
 * built now. Run from site/ after building the extension:
 *
 *   (cd ../web && npm run build)
 *   xvfb-run -a node scripts/screenshots.mjs        no display (CI, WSL, SSH)
 *   node scripts/screenshots.mjs                    with a display
 *
 *   ONLY=shot-sidebar node scripts/screenshots.mjs  one shot
 *   EXT=/other/dist OUT=/tmp/shots node scripts/screenshots.mjs
 *
 * Why this exists: every screenshot on the site was taken by hand, so when the
 * glass rebuild landed nothing told anyone they were stale, and for weeks the
 * site advertised a UI that no longer shipped (#373). A script that rebuilds
 * them from `web/dist` is the difference between a chore and a re-run.
 *
 * What it does, in order:
 *
 *   - loads `web/dist` unpacked into a throwaway Chromium profile. Extensions
 *     need a real (headed) browser, hence `xvfb-run` where there is no display;
 *   - seeds `chrome.storage` with a fictional person's tab - a first name, a
 *     few dock links, some tasks, a few calendar events - so nothing personal
 *     and no real account is ever in a shot;
 *   - marks onboarding done, so the welcome modal is not in the picture;
 *   - fixes the clock, the timezone and the weather, so a re-run produces the
 *     same picture rather than whatever hour it happens to be. The weather is
 *     answered locally: no request leaves for Open-Meteo;
 *   - denies geolocation outright, so Chrome's permission prompt never appears;
 *   - captures at the size the site lays the image out at, and encodes WebP
 *     with Chromium's own encoder - no image toolchain to install.
 *
 * Favicons for the dock still come from Google's favicon service, as they do
 * in the extension. Everything else is local.
 */
import { mkdtemp, rm, writeFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';

const here = new URL('.', import.meta.url).pathname;
const EXT = resolve(process.env.EXT ?? join(here, '../../web/dist'));
const OUT = resolve(process.env.OUT ?? join(here, '../public/images'));
const ONLY = process.env.ONLY?.split(',');
/** WebP quality. 0.82 keeps the glass edges clean at roughly 50-90 KB a shot. */
const QUALITY = Number(process.env.QUALITY ?? 0.82);

/** Fixed so the shots are reproducible; UTC so the box's own zone is irrelevant. */
const TIMEZONE = 'UTC';
const DAY = '2026-03-24';

/**
 * Each shot: its file, the size it is laid out at on the site (the old shots'
 * exact dimensions, so the page's layout does not move), the time on the
 * clock, the wallpaper, and how to get the tab into the state it shows.
 */
const SHOTS = [
  {
    name: 'shot-sidebar',
    // Laid out at 1200x747 on the site. Captured from a 1500-wide window at
    // 0.8x so the open sidebar has room for its calendar as well as the tasks;
    // at 1200x747 CSS pixels the calendar fell below the fold.
    viewport: { width: 1500, height: 934 },
    scale: 0.8,
    time: `${DAY}T08:20:00Z`,
    // The morning lake, to match the hour on the clock.
    wallpaper: 'images/bundled-bg2.jpg',
    async act(page) {
      await page.locator('.sidebar-container').click();
      await page.locator('.sidebar-container.open').waitFor();
    },
  },
  {
    name: 'shot-settings',
    viewport: { width: 1200, height: 949 },
    scale: 1,
    time: `${DAY}T19:40:00Z`,
    // The extension's default background: what a new install opens on.
    wallpaper: 'images/bundled-bg.jpg',
    async act(page) {
      await page.locator('.settings-container').click();
      await page.locator('.settings-container.open').waitFor();
      await page.locator('.settings-nav-btn', { hasText: 'Clock' }).click();
    },
  },
];

/** A day's worth of a fictional person's tab. Nothing here is anyone's real data. */
function seed(day) {
  const at = (hhmm, plusDays = 0) => {
    const d = new Date(`${day}T${hhmm}:00Z`);
    d.setUTCDate(d.getUTCDate() + plusDays);
    return d.toISOString();
  };

  return {
    sync: {
      isFirstInstall: false,
      general: { userName: 'Maya', showTodo: true, showHistory: false, showGreeting: true },
      clock: { timeFormat: '24h', showDate: true, dateFormat: 'long', weight: 200 },
      weather: { show: true, unit: 'C', location: 'Lisbon' },
      widgets: {
        showLinks: true,
        showFocus: true,
        showQuotes: true,
        quickLinks: [
          { name: 'Calendar', url: 'https://calendar.google.com', icon: '' },
          { name: 'GitHub', url: 'https://github.com', icon: '' },
          { name: 'YouTube', url: 'https://youtube.com', icon: '' },
          { name: 'Wikipedia', url: 'https://wikipedia.org', icon: '' },
        ],
      },
      todos: [
        { id: 'todo_1', text: 'Send the slides to the design group', completed: false },
        { id: 'todo_3', text: 'Renew the library books', completed: true },
        { id: 'todo_4', text: 'Water the balcony plants', completed: false },
      ],
      localEvents: [
        { id: 'evt_1', title: 'Design review', date: at('11:00'), description: '', color: '#7aa2ff' },
        { id: 'evt_2', title: 'Lunch with Sam', date: at('13:00'), description: '', color: '#5fd3a0' },
        { id: 'evt_3', title: 'Climbing', date: at('18:30', 1), description: '', color: '#f2b45c' },
        { id: 'evt_4', title: 'Quarterly planning', date: at('10:00', 3), description: '', color: '#7aa2ff' },
      ],
    },
    local: {
      windom_onboarding: { completed: true, spotifyNoticeDismissed: true },
      windom_focus: { mainFocus: '', completed: false },
    },
  };
}

/** Open-Meteo, answered from here: a clear, mild day in the seeded city. */
async function stubWeather(context) {
  await context.route('https://geocoding-api.open-meteo.com/**', (route) =>
    route.fulfill({
      json: { results: [{ name: 'Lisbon', latitude: 38.72, longitude: -9.14 }] },
    }),
  );
  await context.route('https://api.open-meteo.com/**', (route) =>
    route.fulfill({ json: { current: { temperature_2m: 19, weather_code: 1, is_day: 1 } } }),
  );
  // Never reached with a location set, but a stray lookup must not leak either.
  await context.route('https://ipapi.co/**', (route) => route.abort());
  await context.route('https://nominatim.openstreetmap.org/**', (route) => route.abort());
}

/** PNG in, WebP out, using the browser that is already open. */
async function toWebp(page, png) {
  const b64 = await page.evaluate(
    async ({ src, quality }) => {
      const img = await createImageBitmap(await (await fetch(src)).blob());
      const canvas = new OffscreenCanvas(img.width, img.height);
      canvas.getContext('2d').drawImage(img, 0, 0);
      const blob = await canvas.convertToBlob({ type: 'image/webp', quality });
      if (blob.type !== 'image/webp') throw new Error(`encoder returned ${blob.type}`);
      const bytes = new Uint8Array(await blob.arrayBuffer());
      let s = '';
      for (let i = 0; i < bytes.length; i += 0x8000) {
        s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      }
      return btoa(s);
    },
    { src: `data:image/png;base64,${png.toString('base64')}`, quality: QUALITY },
  );
  return Buffer.from(b64, 'base64');
}

async function main() {
  try {
    await stat(join(EXT, 'manifest.json'));
  } catch {
    throw new Error(`No built extension at ${EXT} - run \`npm run build\` in web/ first.`);
  }

  for (const shot of SHOTS) {
    if (ONLY && !ONLY.includes(shot.name)) continue;

    // A fresh profile per shot: no state carries from one picture to the next.
    const profile = await mkdtemp(join(tmpdir(), 'windom-shots-'));
    const context = await chromium.launchPersistentContext(profile, {
      headless: false,
      viewport: shot.viewport,
      deviceScaleFactor: shot.scale,
      timezoneId: TIMEZONE,
      locale: 'en-US',
      // Nothing granted: geolocation is denied without a prompt.
      permissions: [],
      args: [
        `--disable-extensions-except=${EXT}`,
        `--load-extension=${EXT}`,
        // Without these, Chromium on a machine with no usable GPU (WSL, CI)
        // renders few or no frames. Same flags as overflow-audit.mjs.
        '--disable-gpu',
        '--disable-software-rasterizer',
      ],
    });

    try {
      await stubWeather(context);
      await context.clock.setFixedTime(new Date(shot.time));

      const worker =
        context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker', { timeout: 20_000 }));
      const id = new URL(worker.url()).host;

      const data = seed(DAY);
      await worker.evaluate(
        async ({ data, wallpaper }) => {
          await chrome.storage.sync.clear();
          await chrome.storage.local.clear();
          await chrome.storage.sync.set(data.sync);
          await chrome.storage.local.set({
            ...data.local,
            localBackgroundImage: chrome.runtime.getURL(wallpaper),
          });
        },
        { data, wallpaper: shot.wallpaper },
      );

      const page = await context.newPage();
      await page.goto(`chrome-extension://${id}/newtab.html`);
      // The wallpaper is applied once it has decoded; the weather after its fetch.
      await page.waitForFunction(
        () => getComputedStyle(document.getElementById('bg-zoom-layer')).backgroundImage.includes('bundled-bg'),
        undefined,
        { polling: 250, timeout: 20_000 },
      );
      // Onboarding is seeded as done. If that ever stops being enough, fail
      // loudly rather than publish a welcome modal.
      if (await page.locator('.onboarding-modal').count()) {
        throw new Error('onboarding modal is showing - the seed no longer dismisses it');
      }
      // Dock favicons come over the network; a shot with a hole in the dock is
      // worse than a slow run, so wait for every one to have decoded.
      await page.waitForFunction(
        () => [...document.querySelectorAll('.dock-item img')].every((i) => i.complete && i.naturalWidth > 0),
        undefined,
        { polling: 250, timeout: 20_000 },
      );
      await shot.act(page);
      // Panels open with a glass transition; let it settle completely.
      await page.waitForTimeout(1500);

      const png = await page.screenshot({ type: 'png', animations: 'disabled', caret: 'hide' });
      const webp = await toWebp(page, png);
      const file = join(OUT, `${shot.name}.webp`);
      await writeFile(file, webp);
      const px = (n) => Math.round(n * shot.scale);
      console.log(`${shot.name}.webp  ${px(shot.viewport.width)}x${px(shot.viewport.height)}  ${(webp.length / 1024).toFixed(0)} KB`);
    } finally {
      await context.close();
      await rm(profile, { recursive: true, force: true });
    }
  }
}

await main();
