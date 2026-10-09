import { db } from './db.js';
import { stats } from './stats.js';

// Webhook universal de vendas (Hotmart, Kiwify, Wiapy, Eduzz, Braip, Ticto, Perfect Pay, Cakto...).
// Em vez de um parser por plataforma, varre o JSON procurando:
//  - o ID de sessão do Retina (rt_xxxxxxxxxxxxxxxx), que o tracker anexou ao link do checkout (sck/src/utm_id/rsid)
//  - valor, status, id da transação e produto pelos nomes de campo mais comuns
const SID_FIND = /rt_[a-z0-9]{16}/;

function walk(obj, fn, path = '') {
  if (obj == null) return;
  if (typeof obj !== 'object') { fn(path, obj); return; }
  if (Array.isArray(obj)) { obj.forEach((v, i) => walk(v, fn, path + '[' + i + ']')); return; }
  for (const [k, v] of Object.entries(obj)) walk(v, fn, path ? path + '.' + k : k);
}

const APPROVED = /approv|aprovad|paid|pago|complete|conclu|PURCHASE_APPROVED|PURCHASE_COMPLETE|order_approved|venda_realizada|captured|succeeded|success/i;
const REFUND = /refund|reembols|chargeback|estorn|cancel|dispute|protest/i;
const PENDING = /pending|pendente|waiting|aguardando|billet_printed|pix_generated|created|abandon|refused|recusad|expired|expirad/i;

export function parseSale(payload) {
  let sid = null;
  const amounts = [];
  const statuses = [];
  let tx = null, product = null, currency = null;

  walk(payload, (p, v) => {
    const key = p.toLowerCase();
    if (typeof v === 'string') {
      const m = v.match(SID_FIND);
      if (m && !sid) sid = m[0];
    }
    const last = key.split('.').pop().replace(/\[\d+\]$/, '');
    if (/(^|_)(status|event|event_type|webhook_event_type|order_status|sale_status|trans_status|type)$/.test(last) && typeof v === 'string') statuses.push(v);
    if (!tx && /^(transaction|transaction_id|order_id|order_ref|sale_id|trans_cod|code|id)$/.test(last) && (typeof v === 'string' || typeof v === 'number') && /purchase|order|sale|transaction|^id$|^code$/.test(key.split('.').slice(-2).join('.')))
      tx = String(v).slice(0, 120);
    if (!product && /product.*name|^product_name$|offer.*name|plan_name/.test(key) && typeof v === 'string') product = v.slice(0, 160);
    if (!currency && /currency/.test(last) && typeof v === 'string' && v.length <= 4) currency = v.toUpperCase();
    if (/(price|value|amount|total|valor)/.test(last) && (last === 'charge_amount' || !/(original|base|fee|tax|commission|discount|installment)/.test(key))) {
      let n = typeof v === 'number' ? v : typeof v === 'string' && /^\d+([.,]\d+)?$/.test(v.trim()) ? Number(v.replace(',', '.')) : null;
      if (n == null || !isFinite(n) || n <= 0) return;
      if (/cents|centavos|charge_amount/.test(key)) n = n / 100;
      const pri = /purchase\.price\.value|full_price|charge_amount|total|amount/.test(key) ? 2 : 1;
      amounts.push({ n, pri, key });
    }
  });

  amounts.sort((a, b) => b.pri - a.pri);
  const statusText = statuses.join(' ');
  let status = 'approved';
  if (REFUND.test(statusText)) status = 'refunded';
  else if (statuses.length && !APPROVED.test(statusText) && PENDING.test(statusText)) status = 'pending';
  return { sid, value: amounts[0]?.n || 0, status, tx, product, currency: currency || 'BRL' };
}

const upsertConv = db.prepare(`INSERT INTO conversions (site_id, session_id, tx_id, value, currency, status, product, source, raw, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(site_id, tx_id) WHERE tx_id IS NOT NULL DO UPDATE SET status=excluded.status, value=CASE WHEN excluded.value > 0 THEN excluded.value ELSE value END,
    session_id=COALESCE(excluded.session_id, session_id), raw=excluded.raw`);
const refreshSession = db.prepare(`UPDATE sessions SET
  revenue=(SELECT COALESCE(SUM(value),0) FROM conversions WHERE session_id=sessions.id AND status='approved'),
  converted=(SELECT COUNT(*)>0 FROM conversions WHERE session_id=sessions.id AND status='approved') WHERE id=?`);

export function handleWebhook(site, body, source) {
  let payload;
  try { payload = JSON.parse(body); } catch {
    try { payload = Object.fromEntries(new URLSearchParams(body)); } catch { stats.webhookErrors++; return { ok: false, error: 'payload inválido' }; }
  }
  const sale = parseSale(payload);
  const tx = sale.tx || (sale.sid ? 'sid-' + sale.sid + '-' + sale.value : null);
  upsertConv.run(site.id, sale.sid, tx, sale.value, sale.currency, sale.status, sale.product, source || 'webhook', String(body).slice(0, 20000), Date.now());
  if (sale.sid) refreshSession.run(sale.sid);
  stats.webhooks++;
  stats.lastWebhook = { at: Date.now(), site: site.id, ...sale };
  return { ok: true, matched_session: !!sale.sid, ...sale };
}
