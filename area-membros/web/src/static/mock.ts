// Versão sem servidor (arquivo HTML único): as rotas da API rodam aqui, no próprio navegador,
// com o MESMO catálogo e o MESMO motor de ofertas do servidor. Os dados ficam no localStorage
// deste navegador. Serve para demonstração: ninguém além de você vê as compras simuladas.
import cat from '../../../catalog.js';
import { buildLibrary, validateCatalog, isPlaceholderUrl } from '../../../server/offers.js';
import { brand as serverBrand, iconSvg } from '../../../server/brand.js';
import { placeholderPdfString } from '../../../server/pdf.js';

type Customer = { id: string; email: string; name: string; created_at: number; last_seen: number | null };
type Purchase = { id: number; customer_id: string; product_id: string; tx_id: string | null; status: string; value: number; source: string; click_id: string | null; offer_id: string | null; placement: string | null; created_at: number; updated_at: number };
type Ev = { customer_id: string; offer_id: string; placement: string | null; ref: string | null; type: string; click_id: string | null; ts: number };
type Prog = { customer_id: string; ref: string; opened_at: number | null; last_page: number | null; pages: number | null; done_at: number | null; updated_at: number };
type State = { v: number; customers: Customer[]; purchases: Purchase[]; events: Ev[]; progress: Prog[]; session: string | null; admin: boolean; seq: number };

const KEY = 'am_static_v1';
const DAY = 86400e3;
const C: any = cat;
const products: Record<string, any> = C.products;
const offers: Record<string, any> = C.offers;
const front = Object.keys(products).filter((id) => products[id].frontEnd);
const demoEmail = (p: string) => `${p}@demo.app`;
const rid = () => Math.random().toString(36).slice(2, 11) + Math.random().toString(36).slice(2, 6);
// Sem servidor não existe /icon.svg: o ícone vai embutido
const brand = (c: any) => ({ ...serverBrand(c), icon: 'data:image/svg+xml,' + encodeURIComponent(iconSvg(c)) });
const firstName = (n: string | null) => (String(n || '').trim().split(/\s+/)[0] || '').replace(/^./, (c) => c.toUpperCase());

let S: State = null!; // carregado no fim do arquivo, depois que todas as funções existem
function load(): State {
  try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s?.v === 1) return s; } catch { /* sem localStorage */ }
  return seed();
}
let saveTimer: number | undefined;
function save() {
  clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* cheio ou bloqueado */ } }, 300);
}

// ---------- "banco" ----------
function customer(email: string, name: string, now = Date.now()) {
  let c = S.customers.find((x) => x.email === email);
  if (!c) { c = { id: 'c_' + rid(), email, name, created_at: now, last_seen: null }; S.customers.push(c); }
  return c;
}
const owned = (cid: string) => [...new Set(S.purchases.filter((p) => p.customer_id === cid && p.status === 'approved').map((p) => p.product_id))];

function recordPurchase(cid: string, productId: string, txId: string, status: string, value: number, source: string, clickId: string | null, now = Date.now()) {
  const existing = S.purchases.find((p) => p.customer_id === cid && p.tx_id === txId && p.product_id === productId);
  if (existing) { existing.status = status; existing.updated_at = now; return false; }
  let click = clickId ? S.events.find((e) => e.type === 'click' && e.click_id === clickId) : undefined;
  if (!click) {
    const ids = Object.keys(offers).filter((id) => offers[id].product === productId);
    click = S.events.filter((e) => e.customer_id === cid && e.type === 'click' && ids.includes(e.offer_id) && e.ts >= now - 14 * DAY).sort((a, b) => b.ts - a.ts)[0];
  }
  S.purchases.push({ id: ++S.seq, customer_id: cid, product_id: productId, tx_id: txId, status, value, source, click_id: click?.click_id || null, offer_id: click?.offer_id || null, placement: click?.placement || null, created_at: now, updated_at: now });
  return true;
}
const logEvent = (e: Omit<Ev, 'click_id'> & { click_id?: string | null }) => S.events.push({ click_id: null, ...e });

// ---------- dados de exemplo (mesma lógica do server/seed.js) ----------
function seed(): State {
  S = { v: 1, customers: [], purchases: [], events: [], progress: [], session: null, admin: false, seq: 0 };
  const now = Date.now();
  const rnd = (a: number, b: number) => a + Math.random() * (b - a);
  const chance = (p: number) => Math.random() < p;
  const names = ['Ana', 'Bruna', 'Carla', 'Daniela', 'Elaine', 'Fernanda', 'Gisele', 'Helena', 'Isabel', 'Juliana', 'Karina', 'Luana', 'Marina', 'Natália', 'Olívia', 'Patrícia'];
  const ctr: Record<string, number> = { inline: 0.16, end: 0.22, home: 0.08, store: 0.12, locked: 0.25 };
  const conv = Object.fromEntries(Object.keys(offers).map((id) => [id, rnd(0.1, 0.4)]));
  for (let i = 0; i < 150; i++) {
    const t0 = now - rnd(0, 30) * DAY;
    const c = customer(`teste${i + 1}@exemplo.com`, `${names[i % names.length]} Teste`, t0);
    const entry = front[chance(0.58) ? 0 : front.length - 1];
    recordPurchase(c.id, entry, `sim-${i}-${entry}`, chance(0.03) ? 'refunded' : 'approved', products[entry].price, 'simulate', null, t0);
    if (!chance(0.72)) continue;
    c.last_seen = Math.min(now, t0 + rnd(0, 6) * DAY);
    const visits = Math.ceil(rnd(0.5, 5));
    for (let v = 0; v < visits; v++) {
      const ts = Math.min(now - 60e3, t0 + v * rnd(0.3, 3) * DAY + rnd(0, 3600e3));
      const prods = owned(c.id);
      if (!prods.length) break;
      const lib: any = buildLibrary(C, { customerId: c.id, firstName: '', products: prods, now: ts });
      const shown: [string, string, string | null][] = [];
      for (const o of lib.home) shown.push([o.id, 'home', null]);
      if (chance(0.3)) for (const o of lib.store) shown.push([o.id, 'store', null]);
      for (const d of lib.deliverables) {
        if (d.locked && d.lockedOffer && chance(0.5)) shown.push([d.lockedOffer.id, 'locked', d.id]);
        if (d.owned && d.offer && chance(0.6)) shown.push([d.offer.id, 'inline', d.id]);
        if (d.owned && d.endOffer && chance(0.25)) shown.push([d.endOffer.id, 'end', d.id]);
      }
      for (const [offerId, placement, ref] of shown) {
        logEvent({ customer_id: c.id, offer_id: offerId, placement, ref, type: 'impression', ts });
        if (!chance(ctr[placement])) continue;
        logEvent({ customer_id: c.id, offer_id: offerId, placement, ref, type: 'open', ts: ts + 5e3 });
        if (!chance(0.55)) continue;
        const click_id = 'am_' + rid();
        logEvent({ customer_id: c.id, offer_id: offerId, placement, ref, type: 'click', click_id, ts: ts + 15e3 });
        if (chance(conv[offerId])) recordPurchase(c.id, offers[offerId].product, `sim-${i}-${offers[offerId].product}`, 'approved', offers[offerId].price, 'simulate', click_id, ts + 240e3);
      }
    }
  }
  for (const id of front) {
    const c = customer(demoEmail(id), `Cliente ${products[id].name}`);
    recordPurchase(c.id, id, `demo-${id}`, 'approved', products[id].price, 'simulate', null, now - DAY);
  }
  return S;
}

// ---------- telas ----------
const me = (c: Customer) => {
  const prods = owned(c.id);
  const recent = S.purchases.filter((p) => p.customer_id === c.id && p.status === 'approved' && p.updated_at > Date.now() - 15 * 60e3)
    .sort((a, b) => b.updated_at - a.updated_at || b.id - a.id).slice(0, 1)
    .map((p) => ({ product: p.product_id, titles: (products[p.product_id]?.grants || []).map((g: string) => C.deliverables[g]?.title).filter(Boolean) }));
  return {
    customer: { email: c.email, name: c.name, firstName: firstName(c.name) },
    products: prods,
    library: buildLibrary(C, { customerId: c.id, firstName: firstName(c.name), products: prods }),
    progress: S.progress.filter((p) => p.customer_id === c.id),
    recent,
    settings: { ...brand(C), demo: true },
  };
};

const round = (n: number) => Math.round((n || 0) * 100) / 100;
function overview(days: number) {
  const now = Date.now();
  const since = now - days * DAY;
  const isFront = (pid: string) => !!products[pid]?.frontEnd;
  const approved = S.purchases.filter((p) => p.status === 'approved').sort((a, b) => a.created_at - b.created_at);
  const byC = new Map<string, { total: number; back: number; entry: string | null }>();
  for (const p of approved) {
    const c = byC.get(p.customer_id) || { total: 0, back: 0, entry: null };
    byC.set(p.customer_id, c);
    c.total += p.value;
    if (isFront(p.product_id)) c.entry ||= p.product_id; else c.back += p.value;
  }
  const buyers = [...byC.values()];
  const entries: Record<string, any> = {};
  for (const c of buyers) {
    const k = c.entry || 'outro';
    const e = entries[k] ||= { entry: k, name: products[k]?.name || 'Sem produto de entrada', customers: 0, revenue: 0, backBuyers: 0, backRevenue: 0 };
    e.customers++; e.revenue += c.total; e.backRevenue += c.back; if (c.back > 0) e.backBuyers++;
  }
  const inPeriod = approved.filter((p) => p.created_at >= since);
  const frontRev = inPeriod.filter((p) => isFront(p.product_id)).reduce((s, p) => s + p.value, 0);
  const backRev = inPeriod.filter((p) => !isFront(p.product_id)).reduce((s, p) => s + p.value, 0);
  const totalRev = approved.reduce((s, p) => s + p.value, 0);
  const evs = S.events.filter((e) => e.ts >= since);
  const uniq = (arr: Ev[]) => new Set(arr.map((e) => e.customer_id)).size;

  const offerRows = Object.entries(offers).map(([id, o]) => {
    const mine = evs.filter((e) => e.offer_id === id);
    const sales = inPeriod.filter((p) => p.offer_id === id);
    const pls = [...new Set([...mine.map((e) => e.placement || '—'), ...sales.map((p) => p.placement || '—')])].map((pl) => {
      const e = mine.filter((x) => (x.placement || '—') === pl);
      const imp = e.filter((x) => x.type === 'impression'); const clk = e.filter((x) => x.type === 'click');
      const s = sales.filter((p) => (p.placement || '—') === pl);
      const viewers = uniq(imp), clickers = uniq(clk);
      return { placement: pl, impressions: imp.length, viewers, opens: e.filter((x) => x.type === 'open').length, clicks: clk.length, clickers, sales: s.length, revenue: round(s.reduce((a, p) => a + p.value, 0)), ctr: viewers ? clickers / viewers : null, takeRate: viewers ? s.length / viewers : null };
    }).sort((a, b) => b.viewers - a.viewers);
    const viewers = uniq(mine.filter((e) => e.type === 'impression')), clickers = uniq(mine.filter((e) => e.type === 'click'));
    const ps = inPeriod.filter((p) => p.product_id === o.product);
    return {
      id, title: o.title, product: o.product, price: o.price, active: true, startsAt: o.startsAt || null, endsAt: o.endsAt || null,
      placeholderCheckout: isPlaceholderUrl(o.checkoutUrl), viewers, clickers, sales: sales.length, revenue: round(sales.reduce((a, p) => a + p.value, 0)),
      ctr: viewers ? clickers / viewers : null, takeRate: viewers ? sales.length / viewers : null,
      productSales: ps.length, productRevenue: round(ps.reduce((a, p) => a + p.value, 0)), placements: pls,
    };
  }).sort((a, b) => b.revenue - a.revenue || b.viewers - a.viewers);

  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' });
  const series = new Map<string, { day: string; front: number; back: number }>();
  for (let t = since; t <= now + 1; t += DAY) { const d = fmt.format(new Date(t)); series.set(d, { day: d, front: 0, back: 0 }); }
  for (const p of inPeriod) { const s = series.get(fmt.format(new Date(p.created_at))); if (s) s[isFront(p.product_id) ? 'front' : 'back'] += p.value; }

  return {
    days,
    kpis: {
      customers: S.customers.length, newCustomers: S.customers.filter((c) => c.created_at >= since).length,
      activeCustomers: S.customers.filter((c) => (c.last_seen || 0) >= since).length, buyers: buyers.length,
      ltv: buyers.length ? round(totalRev / buyers.length) : 0, totalRevenue: round(totalRev),
      frontRevenue: round(frontRev), backRevenue: round(backRev),
      backShare: frontRev + backRev ? backRev / (frontRev + backRev) : 0,
      backTakeRate: buyers.length ? buyers.filter((c) => c.back > 0).length / buyers.length : 0,
    },
    entries: Object.values(entries).map((e: any) => ({ ...e, revenue: round(e.revenue), backRevenue: round(e.backRevenue), ltv: round(e.revenue / e.customers), backTakeRate: e.backBuyers / e.customers })).sort((a: any, b: any) => b.customers - a.customers),
    offers: offerRows,
    series: [...series.values()].map((s) => ({ ...s, front: round(s.front), back: round(s.back) })),
    warnings: [
      { level: 'info', text: 'Demonstração em arquivo único: os dados são de exemplo e ficam só neste navegador.' },
      ...validateCatalog(C).map((m: string) => ({ level: 'error', text: 'Catálogo: ' + m })),
    ],
    webhookUrl: '(só na versão com servidor)',
    products: Object.entries(products).map(([id, p]) => ({ id, name: p.name, price: p.price })),
  };
}

class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }

/** Responde como o servidor responderia (mesmos caminhos e formatos). */
export async function handle(path: string, body?: any): Promise<any> {
  const url = new URL(path, 'http://x');
  const p = url.pathname;
  const cur = () => {
    const c = S.session ? S.customers.find((x) => x.email === S.session) : null;
    if (!c) throw new HttpError(401, 'login');
    return c;
  };
  const adminOnly = () => { if (!S.admin) throw new HttpError(401, 'login'); };
  try {
    switch (p) {
      case '/api/public':
        return { ...brand(C), demo: { profiles: front.map((id) => ({ product: id, name: products[id].name, email: demoEmail(id) })), adminPassword: 'demo' } };
      case '/api/me': { const c = cur(); c.last_seen = Date.now(); save(); return me(c); }
      case '/api/demo/login': {
        if (!front.includes(body?.product)) throw new HttpError(400, 'Perfil inválido.');
        S.session = demoEmail(body.product); save(); return { ok: true };
      }
      case '/api/demo/reset': {
        const c = cur(); const base = front.find((id) => demoEmail(id) === c.email);
        S.purchases = S.purchases.filter((x) => x.customer_id !== c.id || x.product_id === base);
        S.progress = S.progress.filter((x) => x.customer_id !== c.id);
        save(); return { ok: true };
      }
      case '/api/auth/logout': S.session = null; save(); return { ok: true };
      case '/api/auth/request': case '/api/auth/verify':
        throw new HttpError(400, 'Na demonstração, use os botões de entrar.');
      case '/api/progress': {
        const c = cur(); const now = Date.now();
        let r = S.progress.find((x) => x.customer_id === c.id && x.ref === body.ref);
        if (!r) { r = { customer_id: c.id, ref: body.ref, opened_at: now, last_page: null, pages: null, done_at: null, updated_at: now }; S.progress.push(r); }
        if (Number.isInteger(body.page)) r.last_page = body.page;
        if (Number.isInteger(body.pages)) r.pages = body.pages;
        if (body.done === true) r.done_at = now; else if (body.done === false) r.done_at = null;
        r.updated_at = now; save();
        return { ok: true, progress: S.progress.filter((x) => x.customer_id === c.id) };
      }
      case '/api/events': {
        const c = cur();
        for (const e of body.events || []) if (offers[e.offerId] && ['impression', 'open'].includes(e.type)) logEvent({ customer_id: c.id, offer_id: e.offerId, placement: e.placement || null, ref: e.ref || null, type: e.type, ts: Date.now() });
        save(); return { ok: true };
      }
      case '/go': {
        // Clique na oferta: registra o clique e "compra" na hora (atribuída a este clique)
        const c = cur(); const o = offers[body.offerId];
        if (!o) throw new HttpError(404, 'Oferta não encontrada.');
        const click_id = 'am_' + rid();
        logEvent({ customer_id: c.id, offer_id: body.offerId, placement: body.placement || null, ref: body.ref || null, type: 'click', click_id, ts: Date.now() });
        recordPurchase(c.id, o.product, `demo-${click_id}`, 'approved', o.price, 'simulate', click_id);
        save(); return { ok: true };
      }
      case '/api/admin/login':
        if (String(body?.password) !== 'demo') throw new HttpError(401, 'Senha incorreta. Na demonstração, a senha é "demo".');
        S.admin = true; save(); return { ok: true };
      case '/api/admin/logout': S.admin = false; save(); return { ok: true };
      case '/api/admin/overview': adminOnly(); return overview(Math.min(365, Math.max(1, Number(url.searchParams.get('days')) || 30)));
      case '/api/admin/customers': {
        adminOnly();
        const q = (url.searchParams.get('q') || '').toLowerCase();
        return {
          customers: S.customers.filter((c) => !q || c.email.includes(q) || c.name.toLowerCase().includes(q)).sort((a, b) => b.created_at - a.created_at).slice(0, 50).map((c) => {
            const ps = S.purchases.filter((x) => x.customer_id === c.id).map((x) => ({ ...x, productName: products[x.product_id]?.name || x.product_id }));
            return { ...c, purchases: ps, ltv: round(ps.filter((x) => x.status === 'approved').reduce((s, x) => s + x.value, 0)) };
          }),
        };
      }
      case '/api/admin/webhooks': adminOnly(); return { log: [] };
      case '/api/admin/grant': {
        adminOnly();
        if (!products[body.product]) throw new HttpError(400, 'Produto inválido.');
        const c = customer(String(body.email).trim().toLowerCase(), body.name || '');
        recordPurchase(c.id, body.product, 'manual-' + rid(), 'approved', 0, 'manual', null);
        save(); return { ok: true };
      }
      case '/api/admin/revoke': adminOnly(); { const x = S.purchases.find((y) => y.id === Number(body.purchaseId)); if (x) x.status = 'refunded'; } save(); return { ok: true };
      case '/api/admin/login-link': throw new HttpError(400, 'Links de acesso só existem na versão com servidor.');
    }
    throw new HttpError(404, 'não encontrado');
  } catch (e) {
    if (e instanceof HttpError) throw e;
    console.error(e);
    throw new HttpError(500, 'Erro interno.');
  }
}

/** PDF provisório gerado aqui mesmo (os arquivos reais só existem na versão com servidor). */
export function pdfBytes(ref: string) {
  const [did, iid] = ref.split('/');
  const d = C.deliverables[did];
  const it = iid ? d?.items?.find((i: any) => i.id === iid) : null;
  const s = placeholderPdfString({ title: it?.title || d?.title || ref, parent: it ? d.title : brand(C).appName, file: it?.file || d?.file || 'arquivo.pdf' });
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i) & 0xff;
  return out;
}

export const isStaticError = (e: unknown): e is HttpError => e instanceof HttpError;

S = load();
