// Webhook de vendas (Wiapy e qualquer plataforma que mande JSON ou formulário).
// Como no Retina, em vez de um parser por plataforma, varre o payload procurando
// e-mail, nome, status, id da transação, valor, o clique da oferta (am_…) e os
// códigos que identificam cada produto do catálogo (products[x].match).

const CLICK_FIND = /am_[A-Za-z0-9_-]{12}/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const APPROVED = /approv|aprovad|paid|pago|complete|conclu|order_approved|venda_realizada|captured|succeeded|success/i;
const REFUND = /refund|reembols|chargeback|estorn|cancel|dispute|protest/i;
const PENDING = /pending|pendente|waiting|aguardando|billet_printed|pix_generated|created|abandon|refused|recusad|expired|expirad/i;

function walk(obj, fn, path = '') {
  if (obj == null) return;
  if (typeof obj !== 'object') { fn(path, obj); return; }
  if (Array.isArray(obj)) { obj.forEach((v, i) => walk(v, fn, path + '[' + i + ']')); return; }
  for (const [k, v] of Object.entries(obj)) walk(v, fn, path ? path + '.' + k : k);
}

export function parsePayload(body) {
  try { return JSON.parse(body); } catch {}
  try { const o = Object.fromEntries(new URLSearchParams(body)); if (Object.keys(o).length) return o; } catch {}
  return null;
}

export function parseSale(payload, cat) {
  const emails = [];
  const names = [];
  const statuses = [];
  const amounts = [];
  const strings = [];
  let tx = null, clickId = null;

  walk(payload, (p, v) => {
    const key = p.toLowerCase();
    const last = key.split('.').pop().replace(/\[\d+\]$/, '');
    if (typeof v === 'string') {
      strings.push(v);
      if (!clickId) { const m = v.match(CLICK_FIND); if (m) clickId = m[0]; }
      if (EMAIL.test(v.trim())) emails.push({ v: v.trim(), pri: /customer|buyer|client|comprador|cliente|payer|user/.test(key) ? 2 : /email/.test(last) ? 1 : 0 });
      if (/^(name|nome|full_name|fullname|first_name)$/.test(last) && /customer|buyer|client|comprador|cliente|payer/.test(key)) names.push(v.trim());
    }
    if (typeof v === 'number') strings.push(String(v));
    if (/(^|_)(status|event|event_type|webhook_event_type|order_status|sale_status|trans_status|type)$/.test(last) && typeof v === 'string') statuses.push(v);
    // id da transação: campos com nome explícito em qualquer lugar; "id" só na raiz ou dentro de data/order/purchase/sale/transaction/payment
    const parent = key.split('.').slice(-2, -1)[0] || '';
    if (!tx && (typeof v === 'string' || typeof v === 'number') && (/^(transaction|transaction_id|order_id|order_ref|sale_id|trans_cod|purchase_id|payment_id)$/.test(last)
      || (last === 'id' && /^(|data|order|purchase|sale|transaction|payment)$/.test(parent.replace(/\[\d+\]$/, '')))))
      tx = String(v).slice(0, 120);
    if (/(price|value|amount|total|valor)/.test(last) && !/(original|base|fee|tax|commission|discount|installment|item)/.test(key)) {
      let n = typeof v === 'number' ? v : typeof v === 'string' && /^\d+([.,]\d+)?$/.test(v.trim()) ? Number(v.replace(',', '.')) : null;
      if (n == null || !isFinite(n) || n <= 0) return;
      if (/cents|centavos/.test(key)) n = n / 100;
      amounts.push({ n, pri: /total|amount|charge/.test(last) ? 2 : 1 });
    }
  });

  emails.sort((a, b) => b.pri - a.pri);
  amounts.sort((a, b) => b.pri - a.pri);
  const statusText = statuses.join(' ');
  let status = 'approved';
  if (REFUND.test(statusText)) status = 'refunded';
  else if (statuses.length && !APPROVED.test(statusText) && PENDING.test(statusText)) status = 'pending';

  const products = [];
  for (const [id, p] of Object.entries(cat.products)) {
    if ((p.match || []).some((m) => m && strings.some((s) => s === m || (m.length >= 6 && s.includes(m))))) products.push(id);
  }

  return {
    email: emails[0]?.v.toLowerCase() || null,
    name: names[0] || null,
    status, tx, clickId, products,
    value: amounts[0]?.n || 0,
  };
}
