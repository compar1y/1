export type Offer = {
  id: string;
  product: string;
  title: string;
  hook: string | null;
  subtitle: string | null;
  bullets: string[];
  image: string | null;
  icon: string | null;
  badge: string | null;
  price: number;
  priceFrom: number | null;
  cta: string;
  endsAt: string | null;
};

export type Item = {
  id: string;
  title: string;
  subtitle: string | null;
  image: string | null;
  icon: string | null;
  highlights: string[];
  hasFile: boolean;
  page: number | null;
  offer: Offer | null;
  endOffer: Offer | null;
};

export type Deliverable = {
  id: string;
  type: 'library' | 'pdf' | 'link';
  title: string;
  subtitle: string | null;
  description: string | null;
  image: string | null;
  icon: string | null;
  owned: boolean;
  locked: boolean;
  lockedOffer: Offer | null;
  url: string | null;
  hasFile: boolean;
  offer: Offer | null;
  endOffer: Offer | null;
  items: Item[];
  itemLabel: string | null;
  itemsTitle: string | null;
};

export type Progress = { ref: string; opened_at: number | null; last_page: number | null; pages: number | null; done_at: number | null; updated_at: number };

export type Brand = {
  appName: string;
  shortName: string;
  supportEmail: string | null;
  loginImage: string | null;
  loginIcon: string | null;
  /** Só no modo demonstração: perfis para entrar com um toque */
  demo?: { profiles: { product: string; name: string; email: string }[]; adminPassword: string | null } | null;
  icon: string;
  colors: Record<'primary' | 'primaryDark' | 'dark' | 'mid' | 'bg' | 'paper' | 'line' | 'ink' | 'success', string>;
  texts: Record<'homeSubtitle' | 'lockedSection' | 'lockedHint' | 'lockedIntro' | 'lockedNotice' | 'storeIntro' | 'installHint' | 'welcomeEmail' | 'loginSubtitle' | 'itemsTitle' | 'itemLabel', string>;
};

export type Me = {
  customer: { email: string; name: string | null; firstName: string };
  products: string[];
  library: { deliverables: Deliverable[]; home: Offer[]; store: Offer[] };
  progress: Progress[];
  recent: { product: string; titles: string[] }[];
  settings: Brand & { demo: boolean };
};

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

/** Build de arquivo único (npm run build:static): sem servidor, a API roda no navegador. */
export const STATIC = import.meta.env.VITE_STATIC === '1';

export async function api<T = any>(path: string, body?: unknown): Promise<T> {
  if (STATIC) {
    const mock = await import('../static/mock');
    try { return (await mock.handle(path, body)) as T; } catch (e: any) { throw new ApiError(e.status || 500, e.message); }
  }
  const res = await fetch(path, body === undefined
    ? { credentials: 'same-origin' }
    : { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  let data: any = null;
  try { data = await res.json(); } catch { /* sem corpo */ }
  if (!res.ok) throw new ApiError(res.status, data?.error || 'Não foi possível conectar. Tente de novo.');
  return data as T;
}

/** Abre o PDF no leitor: URL do servidor, ou os bytes gerados no navegador na versão sem servidor. */
export async function pdfSource(ref: string): Promise<{ url: string } | { data: Uint8Array }> {
  if (STATIC) return { data: (await import('../static/mock')).pdfBytes(ref) };
  return { url: fileUrl(ref) };
}

/** Baixar o PDF (na versão sem servidor, gera o arquivo aqui). Devolve true se tratou o clique. */
export async function downloadStatic(ref: string) {
  if (!STATIC) return false;
  const bytes = (await import('../static/mock')).pdfBytes(ref);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' }));
  a.download = ref.replace(/\//g, '-') + '.pdf';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  return true;
}

export const fileUrl = (ref: string, download = false) => `/api/files/${ref}${download ? '?download=1' : ''}`;
export const goUrl = (offerId: string, placement: string, ref?: string) =>
  `/go/${offerId}?p=${placement}${ref ? `&r=${encodeURIComponent(ref)}` : ''}`;
