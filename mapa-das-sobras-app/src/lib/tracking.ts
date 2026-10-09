/**
 * Rastreamento (Meta Pixel opcional) e montagem de links de checkout.
 */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID as string | undefined;

export function initTracking() {
  if (!PIXEL_ID || window.fbq) return;
  /* eslint-disable */
  (function (f: any, b: Document, e: string, v: string) {
    if (f.fbq) return;
    const n: any = (f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    });
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];
    const t = b.createElement(e) as HTMLScriptElement;
    t.async = true;
    t.src = v;
    const s = b.getElementsByTagName(e)[0];
    s.parentNode!.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */
  window.fbq!('init', PIXEL_ID);
  window.fbq!('track', 'PageView');
}

export function track(event: string, params: Record<string, unknown> = {}) {
  try {
    if (window.fbq) {
      const standard = ['ViewContent', 'InitiateCheckout', 'AddToCart', 'Lead', 'Purchase'];
      window.fbq(standard.includes(event) ? 'track' : 'trackCustom', event, params);
    }
  } catch {
    /* rastreamento nunca deve quebrar o app */
  }
}

const PASSTHROUGH = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'src', 'sck'];
const UTM_KEY = 'mds_utms';

/** Guarda as UTMs da primeira visita para repassar nos checkouts internos. */
export function captureUtms() {
  try {
    const params = new URLSearchParams(window.location.search);
    const found: Record<string, string> = {};
    PASSTHROUGH.forEach((k) => {
      const v = params.get(k);
      if (v) found[k] = v;
    });
    if (Object.keys(found).length) localStorage.setItem(UTM_KEY, JSON.stringify(found));
  } catch {
    /* ignore */
  }
}

export function buildCheckoutUrl(base: string, opts: { email?: string; name?: string; src: string }) {
  try {
    const url = new URL(base);
    let utms: Record<string, string> = {};
    try {
      utms = JSON.parse(localStorage.getItem(UTM_KEY) || '{}');
    } catch {
      /* ignore */
    }
    Object.entries(utms).forEach(([k, v]) => !url.searchParams.has(k) && url.searchParams.set(k, v));
    // Identifica que a venda veio de dentro do app (LTV), por posição da oferta.
    url.searchParams.set('utm_source', 'app');
    url.searchParams.set('utm_medium', 'upsell');
    url.searchParams.set('utm_content', opts.src);
    // Pré-preenche o checkout (Kiwify, Hotmart e Eduzz aceitam email/name).
    if (opts.email) url.searchParams.set('email', opts.email);
    if (opts.name) url.searchParams.set('name', opts.name);
    return url.toString();
  } catch {
    return '';
  }
}
