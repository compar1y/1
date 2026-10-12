import { useEffect, useRef } from 'react';

// Impressões e aberturas de oferta, em lote. O clique é medido no servidor (/go).
type Ev = { type: 'impression' | 'open'; offerId: string; placement: string; ref?: string };
let queue: Ev[] = [];
const seen = new Set<string>();
let timer: number | undefined;

function flush() {
  timer = undefined;
  if (!queue.length) return;
  const events = queue.splice(0, 50);
  fetch('/api/events', { method: 'POST', keepalive: true, credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ events }) }).catch(() => {});
}
addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });

export function trackOffer(ev: Ev) {
  if (ev.type === 'impression') {
    const key = `${ev.offerId}|${ev.placement}|${ev.ref || ''}`;
    if (seen.has(key)) return; // uma impressão por oferta/posição a cada abertura do app
    seen.add(key);
  }
  queue.push(ev);
  if (!timer) timer = window.setTimeout(flush, 2500);
}

/** Registra a impressão quando pelo menos metade do card aparece na tela por 1 segundo. */
export function useImpression<T extends HTMLElement>(offerId: string | undefined, placement: string, ref?: string) {
  const el = useRef<T>(null);
  useEffect(() => {
    const node = el.current;
    if (!node || !offerId) return;
    let t: number | undefined;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) t = window.setTimeout(() => { trackOffer({ type: 'impression', offerId, placement, ref }); io.disconnect(); }, 1000);
      else clearTimeout(t);
    }, { threshold: 0.5 });
    io.observe(node);
    return () => { clearTimeout(t); io.disconnect(); };
  }, [offerId, placement, ref]);
  return el;
}
