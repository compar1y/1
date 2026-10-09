/**
 * Utilitário de Rastreamento de Eventos e Propagação de UTMs
 * Preparado para Meta Pixel (fbq), Google Tag Manager (dataLayer) e GA4
 */

declare global {
  interface Window {
    dataLayer?: any[];
    fbq?: (...args: any[]) => void;
  }
}

// Helper para resgatar cookies do navegador (ex: _fbp, _fbc)
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

// Captura todos os parâmetros de URL e UTMs presentes no carregamento
export function getUtmParams(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const urlParams = new URLSearchParams(window.location.search);
  const utms: Record<string, string> = {};
  
  const relevantKeys = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_content',
    'utm_term',
    'src',
    'sck',
    'fbclid',
    'gclid'
  ];

  relevantKeys.forEach((key) => {
    const val = urlParams.get(key);
    if (val) utms[key] = val;
  });

  return utms;
}

// Constrói uma URL de checkout preservando os parâmetros UTM, fbp e fbc da sessão
export function buildCheckoutUrl(baseUrl: string): string {
  if (!baseUrl) return '#';
  try {
    const url = new URL(baseUrl);
    const utms = getUtmParams();
    Object.entries(utms).forEach(([k, v]) => {
      if (!url.searchParams.has(k)) {
        url.searchParams.set(k, v);
      }
    });

    // Encaminha fbp e fbc se disponíveis nos cookies
    const fbp = getCookie('_fbp');
    if (fbp && !url.searchParams.has('fbp')) {
      url.searchParams.set('fbp', fbp);
    }
    const fbc = getCookie('_fbc');
    if (fbc && !url.searchParams.has('fbc')) {
      url.searchParams.set('fbc', fbc);
    }

    return url.toString();
  } catch {
    const utms = getUtmParams();
    const fbp = getCookie('_fbp');
    const fbc = getCookie('_fbc');
    if (fbp && !utms.fbp) utms.fbp = fbp;
    if (fbc && !utms.fbc) utms.fbc = fbc;

    const query = new URLSearchParams(utms).toString();
    if (!query) return baseUrl;
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}${query}`;
  }
}

// Inicializa o rastreamento geral da página
export function initTracking(): void {
  trackPageView();
  trackViewContent('100 Projetos de Madeira Prontos para Construir ou Vender', 'Ebook');
}

// Disparo de evento PageView
export function trackPageView(): void {
  if (typeof window === 'undefined') return;
  
  // GTM / DataLayer
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'page_view',
    page_title: document.title,
    page_location: window.location.href,
    ...getUtmParams()
  });

  // Meta Pixel
  if (typeof window.fbq === 'function') {
    window.fbq('track', 'PageView');
  }
}

// Disparo de evento ViewContent
export function trackViewContent(productName: string, category: string = 'Digital'): void {
  if (typeof window === 'undefined') return;
  
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'view_item',
    item_name: productName,
    item_category: category,
    ...getUtmParams()
  });

  if (typeof window.fbq === 'function') {
    window.fbq('track', 'ViewContent', {
      content_name: productName,
      content_category: category
    });
  }
}

// Disparo de evento Clique no CTA
export function trackCtaClick(ctaId: string, ctaLabel: string, targetSection?: string): void {
  if (typeof window === 'undefined') return;
  
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'cta_click',
    cta_id: ctaId,
    cta_label: ctaLabel,
    target_section: targetSection || 'pricing',
    ...getUtmParams()
  });
}

// Disparo de evento Seleção de Pacote
export function trackPackageSelected(packageName: 'basic' | 'complete', price: number): void {
  if (typeof window === 'undefined') return;
  
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'select_item',
    package_type: packageName,
    value: price,
    currency: 'BRL',
    ...getUtmParams()
  });
}

// Variável de controle para evitar disparos duplicados do InitiateCheckout
let lastCheckoutTrackTime = 0;

// Disparo de evento InitiateCheckout (início real de checkout)
export function trackInitiateCheckout(
  packageName: string,
  price: number,
  checkoutUrl: string
): void {
  if (typeof window === 'undefined') return;

  const now = Date.now();
  if (now - lastCheckoutTrackTime < 1500) {
    return; // Evita duplicações causadas por múltiplos handlers
  }
  lastCheckoutTrackTime = now;
  
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'begin_checkout',
    currency: 'BRL',
    value: price,
    items: [
      {
        item_name: packageName,
        price: price,
        quantity: 1
      }
    ],
    checkout_destination: checkoutUrl,
    ...getUtmParams()
  });

  if (typeof window.fbq === 'function') {
    window.fbq('track', 'InitiateCheckout', {
      content_name: packageName,
      value: price,
      currency: 'BRL'
    });
  }
}
