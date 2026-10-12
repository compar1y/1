import { useEffect, useState } from 'react';

// Roteador mínimo (history API): o app tem poucas telas e não precisa de dependência.
const listeners = new Set<() => void>();

export function navigate(to: string, opts: { replace?: boolean } = {}) {
  if (to === location.pathname + location.search) return;
  history[opts.replace ? 'replaceState' : 'pushState'](null, '', to);
  window.scrollTo(0, 0);
  listeners.forEach((l) => l());
}

export function useLocation() {
  const [loc, setLoc] = useState(() => ({ path: location.pathname, search: location.search }));
  useEffect(() => {
    const update = () => setLoc({ path: location.pathname, search: location.search });
    listeners.add(update);
    window.addEventListener('popstate', update);
    return () => { listeners.delete(update); window.removeEventListener('popstate', update); };
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
