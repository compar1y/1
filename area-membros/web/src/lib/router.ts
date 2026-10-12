import { useEffect, useState } from 'react';
import { STATIC } from './api';

// Na versão de arquivo único as rotas ficam depois do # (funciona em qualquer hospedagem e até abrindo o arquivo direto).
function current() {
  if (!STATIC) return { path: location.pathname, search: location.search };
  const h = location.hash.replace(/^#/, '') || '/';
  const i = h.indexOf('?');
  return { path: i >= 0 ? h.slice(0, i) : h, search: i >= 0 ? h.slice(i) : '' };
}
export const hrefFor = (to: string) => (STATIC ? '#' + to : to);

/** Troca o endereço sem navegar (ex.: tirar o ?comprou=1). */
export function replaceUrl(to: string) {
  history.replaceState(null, '', STATIC ? location.pathname + location.search + '#' + to : to);
}

// Roteador mínimo (history API): o app tem poucas telas e não precisa de dependência.
const listeners = new Set<() => void>();

export function navigate(to: string, opts: { replace?: boolean } = {}) {
  const cur = current();
  if (to === cur.path + cur.search) return;
  history[opts.replace ? 'replaceState' : 'pushState'](null, '', hrefFor(to));
  window.scrollTo(0, 0);
  listeners.forEach((l) => l());
}

export function useLocation() {
  const [loc, setLoc] = useState(current);
  useEffect(() => {
    const update = () => setLoc(current());
    listeners.add(update);
    window.addEventListener('popstate', update);
    window.addEventListener('hashchange', update);
    return () => { listeners.delete(update); window.removeEventListener('popstate', update); window.removeEventListener('hashchange', update); };
  }, []);
  return loc;
}

export function match(pattern: string, path: string): Record<string, string> | null {
  const p = pattern.split('/').filter(Boolean);
  const s = path.split('/').filter(Boolean);
  const out: Record<string, string> = {};
  for (let i = 0; i < Math.max(p.length, s.length); i++) {
    const seg = p[i];
    if (seg === undefined) return null;
    const optional = seg.endsWith('?');
    const name = seg.replace(/^:|\?$/g, '');
    if (s[i] === undefined) { if (optional) continue; return null; }
    if (seg.startsWith(':')) out[name] = decodeURIComponent(s[i]);
    else if (seg !== s[i]) return null;
  }
  return out;
}
