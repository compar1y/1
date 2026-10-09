import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, type Plugin} from 'vite';

// Injeta o tracker do Retina na página. Configure com RETINA_URL e RETINA_SITE no build:
//   RETINA_URL=https://retina.seudominio.com RETINA_SITE=demo npm run build
function retina(): Plugin {
  const url = (process.env.RETINA_URL || 'https://1-production-ba4e.up.railway.app').replace(/\/$/, '');
  const site = process.env.RETINA_SITE || 'demo';
  return {
    name: 'retina-tracker',
    transformIndexHtml: () => [
      { tag: 'script', attrs: { async: true, src: `${url}/r.js`, 'data-site': site }, injectTo: 'head' },
    ],
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), retina()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
