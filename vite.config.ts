import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';

const BACKEND_URL = process.env.VITE_BACKEND_URL ?? 'http://localhost:8080';

export default defineConfig({
  plugins: [
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
});
