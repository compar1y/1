// Métricas do painel: LTV, receita de front × back-end e desempenho de cada oferta por posição.
import fs from 'node:fs';
import path from 'node:path';
import { db } from './db.js';
import { isPlaceholderUrl, validateCatalog } from './offers.js';
import { emailConfigured } from './email.js';

const round = (n) => Math.round((n || 0) * 100) / 100;

export function overview(cat, { days = 30, now = Date.now(), contentDir }) {
  const since = now - days * 86400e3;
  const front = new Set(Object.entries(cat.products).filter(([, p]) => p.frontEnd).map(([id]) => id));
  const isFront = (pid) => front.has(pid);

  const purchases = db.prepare("SELECT customer_id, product_id, value, offer_id, placement, created_at FROM purchases WHERE status='approved' ORDER BY created_at").all();

  // LTV por cliente e porta de entrada (primeiro produto de front-end comprado)
  const byCustomer = new Map();
  for (const p of purchases) {
    let c = byCustomer.get(p.customer_id);
    if (!c) byCustomer.set(p.customer_id, c = { total: 0, back: 0, entry: null });
    c.total += p.value;
    if (isFront(p.product_id)) { if (!c.entry) c.entry = p.product_id; } else c.back += p.value;
  }
  const buyers = [...byCustomer.values()];
  const entries = {};
  for (const c of buyers) {
    const k = c.entry || 'outro';
    const e = entries[k] ||= { entry: k, name: cat.products[k]?.name || 'Sem produto de entrada', customers: 0, revenue: 0, backBuyers: 0, backRevenue: 0 };
    e.customers++; e.revenue += c.total; e.backRevenue += c.back; if (c.back > 0) e.backBuyers++;
  }

  const inPeriod = purchases.filter((p) => p.created_at >= since);
  const frontRev = inPeriod.filter((p) => isFront(p.product_id)).reduce((s, p) => s + p.value, 0);
  const backRev = inPeriod.filter((p) => !isFront(p.product_id)).reduce((s, p) => s + p.value, 0);
  const totalRev = purchases.reduce((s, p) => s + p.value, 0);

  // Ofertas × posição
  const ev = db.prepare(`SELECT offer_id, placement, type, COUNT(*) n, COUNT(DISTINCT customer_id) u
    FROM offer_events WHERE ts>=? GROUP BY offer_id, placement, type`).all(since);
  const sales = db.prepare(`SELECT offer_id, placement, COUNT(*) n, SUM(value) v FROM purchases
    WHERE status='approved' AND created_at>=? AND offer_id IS NOT NULL GROUP BY offer_id, placement`).all(since);
  const productSales = db.prepare(`SELECT product_id, COUNT(*) n, SUM(value) v FROM purchases
    WHERE status='approved' AND created_at>=? GROUP BY product_id`).all(since);

  const offers = Object.entries(cat.offers).map(([id, o]) => {
    const rows = {};
    const row = (pl) => rows[pl || '—'] ||= { placement: pl || '—', impressions: 0, viewers: 0, opens: 0, clicks: 0, clickers: 0, sales: 0, revenue: 0 };
    for (const e of ev.filter((e) => e.offer_id === id)) {
      const r = row(e.placement);
      if (e.type === 'impression') { r.impressions += e.n; r.viewers += e.u; }
      if (e.type === 'open') r.opens += e.n;
      if (e.type === 'click') { r.clicks += e.n; r.clickers += e.u; }
    }
    for (const s of sales.filter((s) => s.offer_id === id)) { const r = row(s.placement); r.sales += s.n; r.revenue += s.v || 0; }
    const placements = Object.values(rows).map((r) => ({ ...r, revenue: round(r.revenue), ctr: r.viewers ? r.clickers / r.viewers : null, takeRate: r.viewers ? r.sales / r.viewers : null }));
    const sum = (k) => placements.reduce((s, r) => s + r[k], 0);
    const ps = productSales.find((p) => p.product_id === o.product);
    const viewers = db.prepare("SELECT COUNT(DISTINCT customer_id) u FROM offer_events WHERE offer_id=? AND type='impression' AND ts>=?").get(id, since).u;
    const clickers = db.prepare("SELECT COUNT(DISTINCT customer_id) u FROM offer_events WHERE offer_id=? AND type='click' AND ts>=?").get(id, since).u;
    return {
      id, title: o.title, product: o.product, price: o.price,
      active: o.active !== false, startsAt: o.startsAt || null, endsAt: o.endsAt || null,
      placeholderCheckout: isPlaceholderUrl(o.checkoutUrl),
      viewers, clickers, sales: sum('sales'), revenue: round(sum('revenue')),
      ctr: viewers ? clickers / viewers : null, takeRate: viewers ? sum('sales') / viewers : null,
      productSales: ps?.n || 0, productRevenue: round(ps?.v || 0),
      placements: placements.sort((a, b) => b.viewers - a.viewers),
    };
  }).sort((a, b) => b.revenue - a.revenue || b.viewers - a.viewers);

  // Receita diária (front × back) no período
  const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' });
  const series = [];
  for (let t = since; t <= now + 1; t += 86400e3) series.push({ day: dayFmt.format(new Date(t)), front: 0, back: 0 });
  const idx = new Map(series.map((s, i) => [s.day, i]));
  for (const p of inPeriod) {
    const s = series[idx.get(dayFmt.format(new Date(p.created_at)))];
    if (s) s[isFront(p.product_id) ? 'front' : 'back'] += p.value;
  }
  const dedup = [...new Map(series.map((s) => [s.day, s])).values()].map((s) => ({ ...s, front: round(s.front), back: round(s.back) }));

  const customers = db.prepare('SELECT COUNT(*) n FROM customers').get().n;
  const newCustomers = db.prepare('SELECT COUNT(*) n FROM customers WHERE created_at>=?').get(since).n;
  const activeCustomers = db.prepare('SELECT COUNT(*) n FROM customers WHERE last_seen>=?').get(since).n;
  const backBuyers = buyers.filter((c) => c.back > 0).length;

  return {
    days,
    kpis: {
      customers, newCustomers, activeCustomers,
      buyers: buyers.length,
      ltv: buyers.length ? round(totalRev / buyers.length) : 0,
      totalRevenue: round(totalRev),
      frontRevenue: round(frontRev), backRevenue: round(backRev),
      backShare: frontRev + backRev ? backRev / (frontRev + backRev) : 0,
      backTakeRate: buyers.length ? backBuyers / buyers.length : 0,
    },
    entries: Object.values(entries).map((e) => ({ ...e, revenue: round(e.revenue), backRevenue: round(e.backRevenue), ltv: round(e.revenue / e.customers), backTakeRate: e.backBuyers / e.customers }))
      .sort((a, b) => b.customers - a.customers),
    offers,
    series: dedup,
    warnings: warnings(cat, contentDir),
  };
}

export function warnings(cat, contentDir) {
  const w = validateCatalog(cat).map((m) => ({ level: 'error', text: 'Catálogo: ' + m }));
  if (!emailConfigured()) w.push({ level: process.env.NODE_ENV === 'production' ? 'error' : 'info', text: 'E-mail não configurado (RESEND_API_KEY): os links de acesso só aparecem no terminal. Em produção, ninguém consegue entrar.' });
  for (const [id, o] of Object.entries(cat.offers)) if (isPlaceholderUrl(o.checkoutUrl)) w.push({ level: 'warn', text: `Oferta "${o.title}" com link de checkout provisório (${id}).` });
  for (const [id, p] of Object.entries(cat.products)) if (!p.match?.length || p.match.every((m) => /TROCAR/.test(m))) w.push({ level: 'warn', text: `Produto "${p.name}" sem código da Wiapy em "match": compras dele não serão reconhecidas (${id}).` });
  const files = [];
  for (const d of Object.values(cat.deliverables)) {
    if (d.file) files.push(d.file);
    for (const it of d.items || []) if (it.file) files.push(it.file);
    if (d.type === 'link' && isPlaceholderUrl(d.url)) w.push({ level: 'warn', text: `Entregável "${d.title}" com link provisório.` });
  }
  const missing = files.filter((f) => !fs.existsSync(path.join(contentDir, f)));
  if (missing.length) w.push({ level: 'info', text: `${missing.length} de ${files.length} PDFs ainda não estão na pasta content/ (o app mostra um PDF provisório): ${missing.join(', ')}` });
  return w;
}

export function searchCustomers(cat, q) {
  const rows = q
    ? db.prepare('SELECT * FROM customers WHERE email LIKE ? OR name LIKE ? ORDER BY created_at DESC LIMIT 50').all(`%${q}%`, `%${q}%`)
    : db.prepare('SELECT * FROM customers ORDER BY created_at DESC LIMIT 50').all();
  const qp = db.prepare('SELECT id, product_id, status, value, source, offer_id, placement, created_at FROM purchases WHERE customer_id=? ORDER BY created_at');
  return rows.map((c) => {
    const purchases = qp.all(c.id).map((p) => ({ ...p, productName: cat.products[p.product_id]?.name || p.product_id }));
    return { ...c, purchases, ltv: round(purchases.filter((p) => p.status === 'approved').reduce((s, p) => s + p.value, 0)) };
  });
}
