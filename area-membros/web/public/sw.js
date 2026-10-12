// Service worker mínimo: deixa o app instalável e abre rápido.
// Arquivos com hash no nome: cache primeiro. Páginas: rede primeiro (cai no cache se estiver sem internet).
// API, PDFs e checkout nunca passam pelo cache.
const CACHE = 'am-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(
  caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
));
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  if (/^\/(api|go|webhook)\//.test(url.pathname)) return;
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).then((r) => { const c = r.clone(); caches.open(CACHE).then((ca) => ca.put('/', c)); return r; })
      .catch(() => caches.match('/')));
    return;
  }
  if (/-[A-Za-z0-9_-]{8,}\.(js|css|mjs)$/.test(url.pathname) || url.pathname.startsWith('/assets/')) {
    e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((r) => {
      if (r.ok) { const c = r.clone(); caches.open(CACHE).then((ca) => ca.put(e.request, c)); }
      return r;
    })));
  }
});
