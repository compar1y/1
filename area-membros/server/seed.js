// Dados de exemplo: clientes, compras de front-end, impressões, cliques e compras de back-end.
// Usado pelo "npm run simulate" e pelo modo demonstração (que recria tudo a cada início).
import { db, randomId, tx } from './db.js';
import { getOrCreateCustomer, recordPurchase, logOfferEvent } from './store.js';
import { buildLibrary } from './offers.js';

const DAY = 86400e3;
const names = ['Ana', 'Bruna', 'Carla', 'Daniela', 'Elaine', 'Fernanda', 'Gisele', 'Helena', 'Isabel', 'Juliana', 'Karina', 'Luana', 'Marina', 'Natália', 'Olívia', 'Patrícia', 'Rafaela', 'Sandra', 'Tânia', 'Vanessa'];
const ctr = { inline: 0.16, end: 0.22, home: 0.08, store: 0.12, locked: 0.25 };

export const frontProducts = (cat) => Object.keys(cat.products).filter((id) => cat.products[id].frontEnd);

export function seedHistory(cat, { customers: N = 400, days = 30, now = Date.now() } = {}) {
  const rnd = (a, b) => a + Math.random() * (b - a);
  const chance = (p) => Math.random() < p;
  const front = frontProducts(cat);
  if (!front.length) throw new Error('Marque pelo menos um produto com frontEnd: true no catalog.js.');
  const conv = Object.fromEntries(Object.keys(cat.offers).map((id) => [id, rnd(0.1, 0.4)]));
  let purchases = 0, back = 0;

  tx(() => {
    for (let i = 0; i < N; i++) {
      const t0 = now - rnd(0, days) * DAY;
      const c = getOrCreateCustomer(`teste${i + 1}@exemplo.com`, `${names[i % names.length]} Teste`, t0);
      const entry = front[chance(0.58) ? 0 : front.length - 1];
      recordPurchase(cat, { customerId: c.id, productId: entry, txId: `sim-${i}-${entry}`, status: chance(0.03) ? 'refunded' : 'approved', value: cat.products[entry].price, source: 'simulate', now: t0 });
      purchases++;
      if (!chance(0.72)) continue; // nem todo mundo abre o app
      db.prepare('UPDATE customers SET last_seen=?, last_login=? WHERE id=?').run(Math.min(now, t0 + rnd(0, 6) * DAY), t0 + 600e3, c.id);

      const visits = Math.ceil(rnd(0.5, 5));
      for (let v = 0; v < visits; v++) {
        const ts = Math.min(now - 60e3, t0 + v * rnd(0.3, 3) * DAY + rnd(0, 3600e3));
        const products = db.prepare("SELECT DISTINCT product_id FROM purchases WHERE customer_id=? AND status='approved'").all(c.id).map((r) => r.product_id);
        if (!products.length) break;
        const lib = buildLibrary(cat, { customerId: c.id, products, now: ts });
        const shown = [];
        for (const o of lib.home) shown.push([o.id, 'home', null]);
        if (chance(0.3)) for (const o of lib.store) shown.push([o.id, 'store', null]);
        for (const d of lib.deliverables) {
          if (d.locked && d.lockedOffer && chance(0.5)) shown.push([d.lockedOffer.id, 'locked', d.id]);
          if (d.owned && d.offer && chance(0.6)) shown.push([d.offer.id, 'inline', d.id]);
          if (d.owned && d.endOffer && chance(0.25)) shown.push([d.endOffer.id, 'end', d.id]);
          for (const it of d.items) if (it.endOffer && chance(0.12)) shown.push([it.endOffer.id, 'end', `${d.id}/${it.id}`]);
        }
        for (const [offerId, placement, ref] of shown) {
          logOfferEvent({ customerId: c.id, offerId, placement, ref, type: 'impression', now: ts });
          if (!chance(ctr[placement])) continue;
          logOfferEvent({ customerId: c.id, offerId, placement, ref, type: 'open', now: ts + 5e3 });
          if (!chance(0.55)) continue;
          const clickId = 'am_' + randomId(9);
          logOfferEvent({ customerId: c.id, offerId, placement, ref, type: 'click', clickId, now: ts + 15e3 });
          if (!chance(conv[offerId])) continue;
          const pid = cat.offers[offerId].product;
          const r = recordPurchase(cat, { customerId: c.id, productId: pid, txId: `sim-${i}-${pid}`, status: 'approved', value: cat.offers[offerId].price, source: 'simulate', clickId, now: ts + 240e3 });
          if (r.created) { purchases++; back++; }
        }
      }
    }
  });
  return { customers: N, purchases, back };
}

/** Clientes de demonstração: um por produto de front-end (ex.: essencial@demo.app só com o Kit Essencial). */
export const demoEmail = (productId) => `${productId}@demo.app`;
export function ensureDemoCustomers(cat) {
  return frontProducts(cat).map((id) => {
    const c = getOrCreateCustomer(demoEmail(id), `Cliente ${cat.products[id].name}`);
    recordPurchase(cat, { customerId: c.id, productId: id, txId: `demo-${id}`, status: 'approved', value: cat.products[id].price, source: 'simulate' });
    return { product: id, name: cat.products[id].name, email: c.email, customerId: c.id };
  });
}

/** Volta o cliente de demonstração ao estado inicial (só o produto de entrada, sem progresso). */
export function resetDemoCustomer(cat, customerId, productId) {
  tx(() => {
    db.prepare("DELETE FROM purchases WHERE customer_id=? AND product_id<>?").run(customerId, productId);
    db.prepare('DELETE FROM progress WHERE customer_id=?').run(customerId);
  });
}
