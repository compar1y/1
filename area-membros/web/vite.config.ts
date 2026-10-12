import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import cat from '../catalog.js';
import { brand, iconSvg } from '../server/brand.js';

const api = `http://localhost:${process.env.API_PORT || 3100}`;
// npm run build:static → um único HTML com tudo dentro (app, catálogo, dados de exemplo), sem servidor
const STATIC = process.env.VITE_STATIC === '1';

/** No arquivo único: nome do app no título, ícone embutido e sem manifest (não há servidor para servi-lo). */
function staticHtml(): Plugin {
  const b = brand(cat);
  const icon = 'data:image/svg+xml,' + encodeURIComponent(iconSvg(cat));
  return {
    name: 'static-html',
    transformIndexHtml: (html) => html
      .replace(/<link rel="manifest"[^>]*>\s*/, '')
      .replace(/<link rel="apple-touch-icon"[^>]*>\s*/, '')
      .replace(/<link rel="icon"[^>]*>/, `<link rel="icon" href="${icon}" />`)
      .replace(/<title>[^<]*<\/title>/, `<title>${b.appName}</title>`)
      .replace(/<meta name="theme-color" content="[^"]*"/, `<meta name="theme-color" content="${b.colors.dark}"`),
  };
}

export default defineConfig({
  root: import.meta.dirname,
  plugins: [react(), tailwindcss(), ...(STATIC ? [viteSingleFile(), staticHtml()] : [])],
  publicDir: STATIC ? false : 'public',
  build: STATIC
    ? { outDir: 'dist-static', emptyOutDir: true, target: 'es2019', chunkSizeWarningLimit: 5000, assetsInlineLimit: 100_000_000 }
    : { outDir: 'dist', emptyOutDir: true, target: 'es2019', chunkSizeWarningLimit: 1500 },
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: { '/api': api, '/go': api, '/webhook': api, '/health': api, '/manifest.webmanifest': api, '/icon.svg': api },
  },
});
