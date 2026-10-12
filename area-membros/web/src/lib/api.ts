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
  icon: string;
  colors: Record<'primary' | 'primaryDark' | 'dark' | 'mid' | 'bg' | 'paper' | 'line' | 'ink' | 'success', string>;
  texts: Record<'homeSubtitle' | 'lockedSection' | 'lockedHint' | 'lockedIntro' | 'lockedNotice' | 'storeIntro' | 'installHint' | 'welcomeEmail' | 'loginSubtitle' | 'itemsTitle' | 'itemLabel', string>;
};

export type Me = {
  customer: { email: string; name: string | null; firstName: string };
  products: string[];
  library: { deliverables: Deliverable[]; home: Offer[]; store: Offer[] };
  progress: Progress[];
  settings: Brand;
};

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function api<T = any>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, body === undefined
    ? { credentials: 'same-origin' }
    : { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  let data: any = null;
  try { data = await res.json(); } catch { /* sem corpo */ }
  if (!res.ok) throw new ApiError(res.status, data?.error || 'Não foi possível conectar. Tente de novo.');
  return data as T;
}

export const fileUrl = (ref: string, download = false) => `/api/files/${ref}${download ? '?download=1' : ''}`;
export const goUrl = (offerId: string, placement: string, ref?: string) =>
  `/go/${offerId}?p=${placement}${ref ? `&r=${encodeURIComponent(ref)}` : ''}`;
