// Simulador.
//
//   npm run simulate
//     Gera 30 dias de dados de teste (clientes, compras de front-end, impressões, cliques e
//     compras de back-end) para ver o painel funcionando. Mostra links de acesso de clientes de teste.
//
//   npm run simulate -- --compra maria@teste.com natal-15
//     Manda para o servidor que está rodando um webhook de compra aprovada (como a Wiapy faria).
//     Use para ver o fluxo completo: abrir o app → tocar na oferta → "comprar" → conteúdo liberado.
//     Opções: --url http://localhost:3100   --reembolso (manda um reembolso em vez de compra)
import crypto from 'node:crypto';
import { db, setting, sha256, randomId } from '../server/db.js';
import { getOrCreateCustomer, recordPurchase, logOfferEvent } from '../server/store.js';
import { buildLibrary } from '../server/offers.js';
import cat from '../catalog.js';

const args = process.argv.slice(2);
const flag = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };

if (args.includes('--compra')) {
  const i = args.indexOf('--compra');
  const email = args[i + 1];
  const productId = args[i + 2];
  const product = cat.products[productId];
  if (!email || !product) {
    console.error(`Uso: npm run simulate -- --compra <email> <produto>\nProdutos: ${Object.keys(cat.products).join(', ')}`);
    process.exit(1);
  }
  const base = (flag('--url') || `http://localhost:${process.env.PORT || 3100}`).replace(/\/$/, '');
  const token = process.env.WEBHOOK_TOKEN || setting('webhook_token');
  if (!token) { console.error('Suba o servidor uma vez antes (npm run dev ou npm start).'); process.exit(1); }
  // Último clique deste e-mail numa oferta deste produto: volta no webhook como a Wiapy devolve o "src"
  const click = db.prepare(`SELECT e.click_id FROM offer_events e JOIN customers c ON c.id=e.customer_id
    WHERE c.email=? AND e.type='click' ORDER BY e.ts DESC LIMIT 1`).get(email.toLowerCase());
  const refund = args.includes('--reembolso');
  const payload = {
    event: refund ? 'order.refunded' : 'order.approved',
    data: {
      id: `sim-${productId}-${crypto.createHash('md5').update(email).digest('hex').slice(0, 8)}`,
      status: refund ? 'refunded' : 'approved',
      total: product.price,
      customer: { name: email.split('@')[0], email },
      product: { code: product.match[0], name: product.name },
      tracking: { src: click?.click_id || null, utm_source: 'area-membros' },
    },
  };
  const res = await fetch(`${base}/webhook/${token}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  console.log(res.status, await res.text());
  process.exit(0);
}

// ---------- histórico de teste ----------
const DAY = 86400e3;
const now = Date.now();
const rnd = (a, b) => a + Math.random() * (b - a);
const chance = (p) => Math.random() < p;
const names = ['Ana', 'Bruno', 'Carla', 'Diego', 'Elaine', 'Fábio', 'Gisele', 'Hugo', 'Isabel', 'João', 'Karina', 'Lucas', 'Marina', 'Nelson', 'Olívia', 'Paulo', 'Rafaela', 'Sérgio', 'Tânia', 'Vitor'];
// Chance de compra depois do clique: aleatória por oferta (só para o painel ter números diferentes)
const conv = Object.fromEntries(Object.keys(cat.offers).map((id) => [id, rnd(0.1, 0.4)]));
const front = Object.keys(cat.products).filter((id) => cat.products[id].frontEnd);
if (!front.length) { console.error('Marque pelo menos um produto com frontEnd: true no catalog.js.'); process.exit(1); }
const ctr = { inline: 0.16, end: 0.22, home: 0.08, store: 0.12, locked: 0.25 };

const N = Number(flag('--clientes')) || 400;
let purchases = 0, back = 0;

for (let i = 0; i < N; i++) {
  const email = `teste${i + 1}@exemplo.com`;
  const t0 = now - rnd(0, 30) * DAY;
  const c = getOrCreateCustomer(email, `${names[i % names.length]} Teste`, t0);
  const entry = front[chance(0.58) ? 0 : front.length - 1];
  recordPurchase(cat, { customerId: c.id, productId: entry, txId: `sim-${i}-${entry}`, status: chance(0.03) ? 'refunded' : 'approved', value: cat.products[entry].price, source: 'simulate', now: t0 });
  purchases++;
  if (!chance(0.72)) continue; // nem todo mundo abre o app
  db.prepare('UPDATE customers SET last_seen=?, last_login=? WHERE id=?').run(Math.min(now, t0 + rnd(0, 6) * DAY), t0 + 600e3, c.id);

  // Algumas visitas ao app; em cada uma, a pessoa vê as ofertas da sua biblioteca
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
      if (!chance(conv[offerId] ?? 0.15)) continue;
      const pid = cat.offers[offerId].product;
      const r = recordPurchase(cat, { customerId: c.id, productId: pid, txId: `sim-${i}-${pid}`, status: 'approved', value: cat.offers[offerId].price, source: 'simulate', clickId, now: ts + 240e3 });
      if (r.created) { purchases++; back++; }
    }
  }
}


// Clientes de teste com acesso direto (links valem 7 dias)
const demo = (email, name, products) => {
  const c = getOrCreateCustomer(email, name);
  for (const p of products) recordPurchase(cat, { customerId: c.id, productId: p, txId: `demo-${email}-${p}`, status: 'approved', value: cat.products[p].price, source: 'simulate' });
  const token = randomId(24);
  db.prepare('INSERT INTO login_tokens (hash, customer_id, expires_at) VALUES (?, ?, ?)').run(sha256(token), c.id, now + 7 * DAY);
  return token;
};
const base = (process.env.PUBLIC_URL || 'http://localhost:5173').replace(/\/$/, '');
const demos = front.map((id) => [id, demo(`${id}@teste.com`, `Cliente ${cat.products[id].name}`, [id])]);

console.log(`✓ ${N} clientes, ${purchases} compras (${back} no back-end) nos últimos 30 dias.\n`);
console.log('Entrar como cliente de teste (cada link funciona uma vez):');
for (const [id, t] of demos) console.log(`  ${cat.products[id].name.padEnd(16)} ${base}/entrar?t=${t}   (${id}@teste.com)`);
console.log('\nSimular uma compra feita dentro do app (com o servidor rodando):');
const firstBack = Object.values(cat.offers).find((o) => o.audience?.requires?.includes(front[0]))?.product || Object.values(cat.offers)[0]?.product;
console.log(`  npm run simulate -- --compra ${front[0]}@teste.com ${firstBack}`);
