import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { searchIndexDevPlugin } from './scripts/search-index.mjs';
import { FEED_SIZE, parseChangelog } from './src/lib/changelog.ts';

/**
 * `virtual:release-feed` - the newest releases from the repository's
 * CHANGELOG.md, parsed at build time (#374).
 *
 * A virtual module rather than a generated file, so there is nothing to forget
 * to regenerate and nothing to commit: dev, the client build and the SSR
 * prerender build all read the changelog as it stands. An empty parse fails
 * the build - an empty feed is exactly the fault this exists to remove, and
 * the way it would come back is a heading format change nobody noticed.
 */
function releaseFeedPlugin(): Plugin {
  const id = 'virtual:release-feed';
  const resolved = `\0${id}`;
  const changelog = fileURLToPath(new URL('../CHANGELOG.md', import.meta.url));
  return {
    name: 'windom-release-feed',
    resolveId(source) {
      return source === id ? resolved : undefined;
    },
    load(moduleId) {
      if (moduleId !== resolved) return undefined;
      this.addWatchFile(changelog);
      const releases = parseChangelog(readFileSync(changelog, 'utf8'));
      if (!releases.length) {
        this.error(`release feed: no "## [x.y.z] - YYYY-MM-DD" headings in ${changelog}`);
      }
      return `export default ${JSON.stringify(releases.slice(0, FEED_SIZE))};`;
    },
  };
}

/**
 * One HTML entry.
 *
 * This file used to list thirteen, one per page, each with a hand-maintained
 * head and its own entry module. The route table in src/routes.tsx describes
 * the site now, and scripts/prerender.mjs writes a file per route from the
 * single shell this builds.
 */
export default defineConfig({
  // The search index is a build artefact, so the dev server has to be told how
  // to produce one - otherwise documentation search is permanently unavailable
  // in development. The plugin is `apply: 'serve'` and adds nothing to a build.
  plugins: [react(), searchIndexDevPlugin(), releaseFeedPlugin()],
  build: {
    // Matches the heaviest asset we ship, so the warning stays meaningful.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // React and the router change far less often than the site does, so
        // keeping them in their own chunk means a copy edit invalidates the
        // 95 KB of app code and not the 95 KB of framework underneath it.
        manualChunks(id) {
          if (id.includes('node_modules/react')) return 'react';
          return undefined;
        },
      },
    },
  },
});
