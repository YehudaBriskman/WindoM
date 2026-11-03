#!/usr/bin/env node
/**
 * Horizontal-overflow audit of the built site, measured all the way down each
 * page rather than once at the top. Run from site/ after `npm run build`.
 *
 *   node scripts/overflow-audit.mjs                 every route, default widths
 *   WIDTHS=375,560 node scripts/overflow-audit.mjs  just those widths
 *   ROUTES=/,/guide node scripts/overflow-audit.mjs just those routes
 *   DIST=/some/other/build node scripts/overflow-audit.mjs
 *
 * Why it walks the page: half the site's layout moves with scroll. The day
 * stage pins and its front layer comes toward the reader as the day passes;
 * the beat glows scale up from 0.75 as their section arrives. A check that
 * measured only at scroll zero saw none of that - the beat glow widened the
 * page at ten scroll positions and zero at the top, and shipped twice (#414);
 * the day stage's narrative ran off both sides of a phone and nobody saw it
 * (#412). So the page is walked top to bottom in half-viewport steps and
 * every position is measured.
 *
 * Why it measures elements and not `document.scrollWidth`: `html` is
 * `overflow-x: clip`, which masks the document width entirely - that is what
 * hid the original hero bleed. Every rendered box is measured against the
 * viewport instead, and an overhanging box passes only when something
 * genuinely contains it:
 *
 *   - an `auto`/`scroll` ancestor - the overhang is scrollable content, fine;
 *   - a `hidden`/`clip` ancestor that itself ends inside the viewport - the
 *     overhang is cut off on screen, fine.
 *
 * A clipping ancestor that reaches the viewport edge (the pinned stage,
 * `html` itself) does not count: it is hiding the defect, not fixing it, and
 * what the visitor sees is copy cut off at the edge of their screen.
 *
 * Deliberately full-bleed decorative layers are exempt by name, below. Add to
 * that list only for something that is meant to run past the edge.
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';

const DIST = process.env.DIST ?? new URL('../dist/', import.meta.url).pathname;

/** The phone, the width #412 broke at, a tablet, a small and a common laptop. */
const WIDTHS = (process.env.WIDTHS ?? '375,560,768,1024,1280').split(',').map(Number);
const HEIGHT = 800;
/**
 * Half a viewport per step. The issue that motivated this asked for
 * viewport-sized steps; half is still fast and samples a pinned animation's
 * travel twice as finely, which is where the overhangs live.
 */
const STEP = HEIGHT / 2;
/** Sub-pixel rounding is not an overflow. */
const TOLERANCE = 1;

/**
 * Meant to run past the edge. Matched against the element and its ancestors,
 * so a layer's children are exempt with it.
 */
const FULL_BLEED = [
  // The wallpaper is scaled up behind the stage so its edges never show
  // during the recede; the tint and scrim are washes over it.
  '.stage-wallpapers',
  // The ambient orbs and traces overshoot their viewBox so neither end of a
  // trace is ever in frame. Fixed to the viewport, behind everything.
  '.ambient-svg',
  // A blurred bloom behind the hero product shot, offset past the edge.
  '.hero-glow',
];

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
};

async function isFile(p) {
  try {
    return (await stat(p)).isFile();
  } catch {
    return false;
  }
}

/**
 * Serves dist/ the way Pages does: `/x` is `x` or `x.html`, and `/x/` is
 * `x/index.html`. A bare `/x` that only exists as a directory gets a 301 to `/x/`,
 * exactly as on Pages - this used to fall back to `x/index.html` silently, which
 * hid a page missing its flat file until the live check after deploy.
 */
function serve() {
  const server = createServer(async (req, res) => {
    const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (path.includes('..')) return res.writeHead(400).end();
    const base = join(DIST, path);
    if (!path.endsWith('/') && !(await isFile(base)) && !(await isFile(`${base}.html`)) &&
        (await isFile(join(base, 'index.html')))) {
      res.writeHead(301, { location: `${path}/` });
      return res.end();
    }
    const candidates = [base, `${base}.html`, join(base, 'index.html')];
    for (const file of candidates) {
      if (await isFile(file)) {
        res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
        return res.end(await readFile(file));
      }
    }
    res.writeHead(404, { 'content-type': TYPES['.html'] });
    res.end(await readFile(join(DIST, '404.html')).catch(() => 'not found'));
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

/** Every route the sitemap publishes, so a new page is audited without asking. */
async function routes() {
  if (process.env.ROUTES) return process.env.ROUTES.split(',');
  const xml = await readFile(join(DIST, 'sitemap.xml'), 'utf8');
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
}

/**
 * Runs in the page. Returns every box that overhangs the viewport without a
 * container that legitimately holds it.
 */
function measure({ fullBleed, tolerance }) {
  const vw = document.documentElement.clientWidth;
  const exempt = fullBleed.join(',');
  const label = (el) =>
    el.tagName.toLowerCase() +
    (el.id ? `#${el.id}` : '') +
    [...el.classList].slice(0, 2).map((c) => `.${c}`).join('');

  const found = [];
  for (const el of document.body.querySelectorAll('*')) {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    const past = Math.max(rect.right - vw, -rect.left);
    if (past <= tolerance) continue;
    if (exempt && el.closest(exempt)) continue;
    // Below the fold boxes are measured on the step that reaches them.
    if (rect.bottom < 0 || rect.top > window.innerHeight) continue;

    let held = false;
    let clippedBy = null;
    for (let a = el.parentElement; a; a = a.parentElement) {
      const ox = getComputedStyle(a).overflowX;
      if (ox === 'auto' || ox === 'scroll') {
        held = true;
        break;
      }
      if (ox === 'hidden' || ox === 'clip') {
        // Held only if the clip lands inside the viewport on every side the
        // box overhangs. A clip exactly at the edge is the edge.
        const r = a.getBoundingClientRect();
        const rightOk = rect.right <= vw + tolerance || r.right < vw - tolerance;
        const leftOk = rect.left >= -tolerance || r.left > tolerance;
        if (rightOk && leftOk) {
          held = true;
          break;
        }
        clippedBy ??= label(a);
      }
    }
    if (held) continue;
    found.push({
      el: label(el),
      left: Math.round(rect.left),
      right: Math.round(rect.right),
      past: Math.round(past),
      clippedBy,
    });
  }

  return found;
}

/**
 * Scroll-driven animations are sampled from the scroll offset on the style
 * recalc the measurement forces, so they need no rendered frame - which
 * matters on a headless Chromium with no display, where frames may not come
 * at all (`page.screenshot()` and rAF polling hang there). The pause is only
 * for the page's own rAF-coalesced scroll handlers (the day stage's text).
 */
async function settle(page) {
  await page.waitForTimeout(50);
}

async function auditPage(browser, origin, route, width) {
  // A fresh page per width, so nothing carries over between runs - the
  // scroll position, or a day stage already advanced to night.
  const page = await browser.newPage({ viewport: { width, height: HEIGHT }, reducedMotion: 'no-preference' });
  await page.goto(origin + route, { waitUntil: 'load' });
  // Entrance animations (the stage assembling, copy fading in) finish first;
  // the audit is about where things come to rest at each scroll position.
  await page.evaluate(() => Promise.all(document.getAnimations()
    .filter((a) => !a.timeline || a.timeline instanceof DocumentTimeline)
    .filter((a) => a.effect?.getComputedTiming().endTime !== Infinity)
    .map((a) => a.finished.catch(() => {}))));

  const hits = new Map();
  let height = 0;
  for (let y = 0; ; y += STEP) {
    // The document's length is re-read every step: content that loads late
    // (the updates feed) can change it mid-walk.
    const { at, reached, max } = await page.evaluate((want) => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const at = Math.min(want, Math.max(max, 0));
      // `instant`: the site sets `scroll-behavior: smooth`, and a smooth
      // scroll has not moved yet when the measurement runs.
      window.scrollTo({ top: at, behavior: 'instant' });
      return { at, reached: window.scrollY, max };
    }, y);
    height = max + HEIGHT;
    // A walk that cannot scroll measures the top of the page over and over
    // and passes - the exact blind spot this exists to close.
    if (Math.abs(reached - at) > 1) throw new Error(`${route} @${width}px: asked for y=${at}, got ${reached}`);
    await settle(page);
    for (const f of await page.evaluate(measure, { fullBleed: FULL_BLEED, tolerance: TOLERANCE })) {
      const prev = hits.get(f.el);
      if (!prev || f.past > prev.past) hits.set(f.el, { ...f, y: at, positions: (prev?.positions ?? 0) + 1 });
      else prev.positions += 1;
    }
    if (at >= max) break;
  }
  await page.close();
  return { height, hits: [...hits.values()] };
}

const server = await serve();
const origin = `http://127.0.0.1:${server.address().port}`;
// Without these, a headless Chromium on a machine with no usable GPU (WSL,
// some containers) may produce no animation frames at all, so the page's own
// rAF-driven scroll handlers never run. Measured: 0 rAF callbacks in 2s by
// default, 120 with both flags. Harmless where frames already work.
const browser = await chromium.launch({ args: ['--disable-gpu', '--disable-software-rasterizer'] });
let failures = 0;

try {
  for (const route of await routes()) {
    for (const width of WIDTHS) {
      const { height, hits } = await auditPage(browser, origin, route, width);
      if (hits.length === 0) {
        console.log(`  ok     ${width}px  ${route}  (${height}px tall)`);
        continue;
      }
      failures += 1;
      console.log(`  FAIL   ${width}px  ${route}  (${height}px tall)`);
      for (const h of hits.sort((a, b) => b.past - a.past)) {
        console.log(
          `           ${h.el}  past=+${h.past}  left=${h.left} right=${h.right}` +
            `  worst at y=${h.y}, ${h.positions} position(s)` +
            (h.clippedBy ? `  clipped at the viewport edge by ${h.clippedBy}` : ''),
        );
      }
    }
  }
} finally {
  await browser.close();
  server.close();
}

if (failures) {
  console.log(`::error::horizontal overflow on ${failures} page/width combination(s) - see above.`);
  process.exit(1);
}
console.log('overflow audit: no horizontal overflow at any scroll position.');
