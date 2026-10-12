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
import { getOrCreateCustomer, recordPurchase } from '../server/store.js';
import { seedHistory, frontProducts } from '../server/seed.js';
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
const r = seedHistory(cat, { customers: Number(flag('--clientes')) || 400 });
const front = frontProducts(cat);

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

console.log(`✓ ${r.customers} clientes, ${r.purchases} compras (${r.back} no back-end) nos últimos 30 dias.\n`);
console.log('Entrar como cliente de teste (cada link funciona uma vez):');
for (const [id, t] of demos) console.log(`  ${cat.products[id].name.padEnd(16)} ${base}/entrar?t=${t}   (${id}@teste.com)`);
console.log('\nSimular uma compra feita dentro do app (com o servidor rodando):');
const firstBack = Object.values(cat.offers).find((o) => o.audience?.requires?.includes(front[0]))?.product || Object.values(cat.offers)[0]?.product;
console.log(`  npm run simulate -- --compra ${front[0]}@teste.com ${firstBack}`);
