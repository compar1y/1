import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const api = `http://localhost:${process.env.API_PORT || 3100}`;

export default defineConfig({
  root: import.meta.dirname,
  plugins: [react(), tailwindcss()],
  build: { outDir: 'dist', emptyOutDir: true, target: 'es2019', chunkSizeWarningLimit: 1500 },
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: { '/api': api, '/go': api, '/webhook': api, '/health': api },
  },
});
