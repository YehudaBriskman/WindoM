import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * One HTML entry.
 *
 * This file used to list thirteen, one per page, each with a hand-maintained
 * head and its own entry module. The route table in src/routes.tsx describes
 * the site now, and scripts/prerender.mjs writes a file per route from the
 * single shell this builds.
 */
export default defineConfig({
  plugins: [react()],
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
