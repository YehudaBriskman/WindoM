import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

/**
 * Multi-page build, one HTML entry per public URL.
 *
 * These filenames are load-bearing and must not change. `guide.html` is compiled
 * into the published extension (web/src/components/onboarding/GuidePanel.tsx), and
 * `privacy.html` / `terms.html` are registered against the Chrome Web Store listing.
 * Renaming any of them would need a store release to repair, and GitHub Pages offers
 * no redirect mechanism to soften it. The release gate asserts all five exist.
 */
export const PAGES = [
  'index',
  'guide',
  'privacy',
  'terms',
  'local-setup',
  'support',
  'contact',
  // Hebrew guide on its own URL. The previous site shipped both languages in
  // every response and hid one with CSS, so Hebrew was never indexable.
  'he/guide',
  'he/privacy',
  'he/terms',
  'he/support',
  'he/contact',
  'he/local-setup',
] as const;

export default defineConfig({
  plugins: [react()],
  build: {
    // Matches the heaviest asset we ship, so the warning stays meaningful.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      input: Object.fromEntries(
        PAGES.map((page) => [page, resolve(import.meta.dirname, `${page}.html`)]),
      ),
      output: {
        // React is identical across all five pages; splitting it out means it is
        // fetched and cached once rather than re-downloaded per page.
        manualChunks(id) {
          if (id.includes('node_modules/react')) return 'react';
          return undefined;
        },
      },
    },
  },
});
