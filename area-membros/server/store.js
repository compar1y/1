import { db, randomId, tx } from './db.js';

const ATTRIBUTION_WINDOW = 14 * 86400e3;

export const normEmail = (e) => String(e || '').trim().toLowerCase();
export const isEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
export const firstName = (name) => (String(name || '').trim().split(/\s+/)[0] || '').replace(/^./, (c) => c.toUpperCase());

const qByEmail = db.prepare('SELECT * FROM customers WHERE email=?');
const qById = db.prepare('SELECT * FROM customers WHERE id=?');
const qInsert = db.prepare('INSERT INTO customers (id, email, name, created_at) VALUES (?, ?, ?, ?)');
const qSetName = db.prepare("UPDATE customers SET name=? WHERE id=? AND (name IS NULL OR name='')");

export const customerByEmail = (email) => qByEmail.get(normEmail(email)) || null;
export const customerById = (id) => qById.get(id) || null;

export function getOrCreateCustomer(email, name, now = Date.now()) {
  email = normEmail(email);
  let c = qByEmail.get(email);
  if (!c) {
    const id = 'c_' + randomId(9);
    qInsert.run(id, email, name || null, now);
    c = qById.get(id);
  } else if (name && !c.name) {
    qSetName.run(name, c.id);
    c = qById.get(c.id);
  }
  return c;
}

const qOwned = db.prepare("SELECT DISTINCT product_id FROM purchases WHERE customer_id=? AND status='approved'");
export const ownedProducts = (customerId) => qOwned.all(customerId).map((r) => r.product_id);

const qFindPurchase = db.prepare('SELECT * FROM purchases WHERE customer_id=? AND tx_id=? AND product_id=?');
const qFindByCustomer = db.prepare('SELECT * FROM purchases WHERE customer_id=? AND product_id=? ORDER BY id DESC LIMIT 1');
const qInsertPurchase = db.prepare(`INSERT INTO purchases
  (customer_id, product_id, tx_id, status, value, source, click_id, offer_id, placement, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
const qUpdatePurchase = db.prepare('UPDATE purchases SET status=?, value=CASE WHEN ? > 0 THEN ? ELSE value END, updated_at=? WHERE id=?');
const qClick = db.prepare("SELECT * FROM offer_events WHERE click_id=? AND type='click'");
const qLastClick = db.prepare(`SELECT * FROM offer_events WHERE customer_id=? AND type='click' AND ts>=? AND offer_id IN
  (SELECT value FROM json_each(?)) ORDER BY ts DESC LIMIT 1`);

/**
 * Registra (ou atualiza) uma compra. Idempotente por (tx_id, produto): o mesmo webhook
 * repetido não duplica, e um reembolso posterior troca o status.
 * Devolve { purchase, created, becameApproved }.
 */
export function recordPurchase(cat, { customerId, productId, txId, status, value, source, clickId, now = Date.now() }) {
  return tx(() => {
    // Sem id de transação no webhook, a compra é identificada por cliente + produto.
    const existing = txId ? qFindPurchase.get(customerId, txId, productId) : qFindByCustomer.get(customerId, productId);
    if (existing) {
      qUpdatePurchase.run(status, value || 0, value || 0, now, existing.id);
      return { purchase: { ...existing, status }, created: false, becameApproved: existing.status !== 'approved' && status === 'approved' };
    }
    // Atribuição: o clique que veio de volta no webhook; senão, o último clique do cliente
    // numa oferta deste produto nos últimos 14 dias.
    let click = clickId ? qClick.get(clickId) : null;
    if (click && cat.offers[click.offer_id]?.product !== productId) click = null;
    if (!click) {
      const offerIds = Object.entries(cat.offers).filter(([, o]) => o.product === productId).map(([id]) => id);
      if (offerIds.length) click = qLastClick.get(customerId, now - ATTRIBUTION_WINDOW, JSON.stringify(offerIds)) || null;
    }
    const r = qInsertPurchase.run(customerId, productId, txId || null, status, value || 0, source || 'webhook',
      click?.click_id || null, click?.offer_id || null, click?.placement || null, now, now);
    return { purchase: { id: Number(r.lastInsertRowid), product_id: productId, status }, created: true, becameApproved: status === 'approved' };
  });
}

const qProgress = db.prepare('SELECT ref, opened_at, last_page, pages, done_at, updated_at FROM progress WHERE customer_id=?');
export const progressOf = (customerId) => qProgress.all(customerId);

const qUpsertProgress = db.prepare(`INSERT INTO progress (customer_id, ref, opened_at, last_page, pages, done_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(customer_id, ref) DO UPDATE SET
    opened_at=COALESCE(progress.opened_at, excluded.opened_at),
    last_page=COALESCE(excluded.last_page, progress.last_page),
    pages=COALESCE(excluded.pages, progress.pages),
    done_at=CASE WHEN ? = 1 THEN excluded.done_at WHEN ? = 0 THEN NULL ELSE progress.done_at END,
    updated_at=excluded.updated_at`);

export function saveProgress(customerId, { ref, page, pages, done }, now = Date.now()) {
  const doneFlag = done === true ? 1 : done === false ? 0 : -1;
  qUpsertProgress.run(customerId, ref, now, page ?? null, pages ?? null, done === true ? now : null, now, doneFlag, doneFlag);
}

const qEvent = db.prepare('INSERT INTO offer_events (customer_id, offer_id, placement, ref, type, click_id, value, ts) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
export function logOfferEvent({ customerId, offerId, placement, ref, type, clickId, value, now = Date.now() }) {
  qEvent.run(customerId || null, offerId, placement || null, ref || null, type, clickId || null, value ?? null, now);
}
