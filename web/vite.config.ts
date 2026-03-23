import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';
import fs from 'fs';
import path from 'path';

const IMAGE_EXTS = /\.(jpe?g|png|webp|gif|avif|svg)$/i;
const VIRTUAL_ID = 'virtual:bundled-images';
const RESOLVED_ID = '\0' + VIRTUAL_ID;

function bundledImagesPlugin(): Plugin {
  const imagesDir = path.resolve(__dirname, 'public/images');

  function scan(): string[] {
    try {
      return fs.readdirSync(imagesDir)
        .filter(f => IMAGE_EXTS.test(f))
        .sort()
        .map(f => `images/${f}`);
    } catch {
      return [];
    }
  }

  return {
    name: 'bundled-images',
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID;
    },
    load(id) {
      if (id === RESOLVED_ID) {
        return `export default ${JSON.stringify(scan())};`;
      }
    },
    configureServer(server) {
      // Invalidate the virtual module when files are added/removed in public/images/
      server.watcher.add(imagesDir);
      server.watcher.on('add', revalidate);
      server.watcher.on('unlink', revalidate);

      function revalidate(file: string) {
        if (file.startsWith(imagesDir) && IMAGE_EXTS.test(file)) {
          const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
          if (mod) server.moduleGraph.invalidateModule(mod);
          server.ws.send({ type: 'full-reload' });
        }
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // process.env takes priority (set by CI via GitHub secret); loadEnv reads .env.production for local builds
  const BACKEND_URL = process.env.VITE_BACKEND_URL ?? env.VITE_BACKEND_URL ?? 'http://localhost:8080';

  return {
  plugins: [
    bundledImagesPlugin(),
    react(),
    crx({ manifest }),
  ],
  define: {
    __BACKEND_URL__: JSON.stringify(BACKEND_URL),
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  };
});
