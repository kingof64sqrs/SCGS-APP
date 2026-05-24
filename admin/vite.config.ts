import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Served by the backend at /admin, built into backend/public/admin.
export default defineConfig({
  base: '/admin/',
  plugins: [react()],
  build: {
    outDir: path.resolve(__dirname, '../backend/public/admin'),
    emptyOutDir: true,
  },
  server: {
    // Dev convenience: proxy API calls to the local backend.
    proxy: { '/api': 'http://localhost:8000' },
  },
});
