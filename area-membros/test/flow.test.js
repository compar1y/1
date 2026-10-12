// Fluxo completo pela API: venda → login por link → biblioteca com oferta → clique → compra no app → conteúdo liberado → reembolso.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// O e-mail (sem RESEND_API_KEY) é impresso no stdout, que o test runner também usa: silenciar evita mensagens corrompidas.
console.log = () => {};

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'am-test-'));
const contentDir = fs.mkdtempSync(path.join(os.tmpdir(), 'am-content-'));
process.env.DATA_DIR = dir;
process.env.CONTENT_DIR = contentDir;
process.env.NO_LISTEN = '1';
process.env.CATALOG_PATH = path.join(import.meta.dirname, 'fixtures', 'catalog-exemplo.js');
process.env.WEBHOOK_TOKEN = 'tok_test_123';
process.env.ADMIN_PASSWORD = 'admin-teste';
delete process.env.RESEND_API_KEY;
delete process.env.NODE_ENV;

let base, server;
const jar = {};
async function call(p, { body, cookie, redirect = 'follow', headers = {} } = {}) {
  const res = await fetch(base + p, {
    method: body === undefined ? 'GET' : 'POST', redirect,
    headers: { ...(body !== undefined && { 'Content-Type': 'application/json' }), ...(cookie && { Cookie: cookie }), ...headers },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
  const set = res.headers.get('set-cookie');
  if (set) { const [kv] = set.split(';'); const i = kv.indexOf('='); jar[kv.slice(0, i)] = kv.slice(i + 1); }
  return res;
}
const webhook = (payload) => call('/webhook/tok_test_123', { body: payload });
const sale = (tx, email, code, extra = {}) => webhook({ status: 'approved', transaction_id: tx, customer: { email }, product: { code }, ...extra });

before(async () => {
  ({ server } = await import('../server/index.js'));
  await new Promise((r) => server.listen(0, r));
  base = `http://localhost:${server.address().port}`;
});
after(() => {
  server.close();
  fs.rmSync(dir, { recursive: true, force: true });
  fs.rmSync(contentDir, { recursive: true, force: true });
});

test('fluxo completo', async () => {
  // 1. Compra do Pacote Básico na página de vendas
  let r = await webhook({ event: 'order.approved', data: { id: 'T1', status: 'approved', total: 10, customer: { name: 'maria souza', email: 'maria@teste.com' }, checkout: { code: 'eiu2dIDEi_2N' } } });
  assert.deepEqual((await r.json()).unlocked, ['basico']);
  assert.equal((await call('/webhook/errado', { body: '{}' })).status, 404);

  // 2. Login por link mágico (sem e-mail configurado, o link volta na resposta)
  r = await call('/api/auth/request', { body: { email: 'MARIA@teste.com ' } });
  const { devLink } = await r.json();
  assert.ok(devLink);
  const token = new URL(devLink).searchParams.get('t');
  assert.equal((await call('/api/auth/verify', { body: { token } })).status, 200);
  const cookie = `am_session=${jar.am_session}`;
  assert.equal((await call('/api/auth/verify', { body: { token } })).status, 400, 'link é de uso único');
  assert.deepEqual(await (await call('/api/auth/request', { body: { email: 'ninguem@teste.com' } })).json(), { ok: true });

  // 3. Biblioteca: 100 projetos liberados, bônus bloqueados com o upgrade
  let me = await (await call('/api/me', { cookie })).json();
  assert.equal(me.customer.firstName, 'Maria');
  const lib = me.library.deliverables;
  assert.ok(lib.find((d) => d.id === 'projetos-100').owned);
  assert.equal(lib.find((d) => d.id === 'fornecedores').locked, true);
  assert.equal(lib.find((d) => d.id === 'projetos-100').offer.id, 'upgrade-completo');

  // PDFs: liberado abre (provisório), bloqueado dá 403, sem login 401
  r = await call('/api/files/projetos-100/jardim', { cookie });
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('content-type'), 'application/pdf');
  assert.equal((await call('/api/files/fornecedores', { cookie })).status, 403);
  assert.equal((await call('/api/files/projetos-100/jardim')).status, 401);

  // Progresso
  await call('/api/progress', { cookie, body: { ref: 'projetos-100/jardim', page: 2, pages: 3 } });
  me = await (await call('/api/me', { cookie })).json();
  assert.equal(me.progress[0].last_page, 2);
  assert.equal((await call('/api/progress', { cookie, body: { ref: '../../etc', page: 1 } })).status, 400);

  // 4. Impressão e clique na oferta anexada
  await call('/api/events', { cookie, body: { events: [{ type: 'impression', offerId: 'upgrade-completo', placement: 'inline', ref: 'projetos-100' }] } });
  r = await call('/go/upgrade-completo?p=inline&r=projetos-100', { cookie, redirect: 'manual' });
  assert.equal(r.status, 302);
  assert.match(r.headers.get('location'), /checkout-pendente/); // checkout ainda provisório no catálogo de exemplo

  // 5. Compra do upgrade (sem id de clique no payload: atribui pelo último clique do cliente)
  r = await sale('T2', 'maria@teste.com', 'TROCAR_CODIGO_UPGRADE', { total: 17.9 });
  assert.deepEqual((await r.json()).unlocked, ['upgrade-completo']);
  me = await (await call('/api/me', { cookie })).json();
  assert.ok(me.library.deliverables.find((d) => d.id === 'fornecedores').owned);
  assert.equal(me.library.deliverables.filter((d) => d.locked).length, 0);
  assert.ok(!me.library.store.some((o) => o.id === 'upgrade-completo'));
  assert.equal((await call('/api/files/fornecedores', { cookie })).status, 200);
  await sale('T2', 'maria@teste.com', 'TROCAR_CODIGO_UPGRADE', { total: 17.9 }); // repetido não duplica

  // 6. Painel: a venda aparece atribuída à oferta e à posição
  assert.equal((await call('/api/admin/overview')).status, 401);
  assert.equal((await call('/api/admin/login', { body: { password: 'errada' } })).status, 401);
  await call('/api/admin/login', { body: { password: 'admin-teste' } });
  const ov = await (await call('/api/admin/overview', { cookie: `am_admin=${jar.am_admin}` })).json();
  const up = ov.offers.find((o) => o.id === 'upgrade-completo');
  assert.equal(up.sales, 1);
  assert.equal(up.revenue, 17.9);
  assert.equal(up.placements.find((p) => p.placement === 'inline').sales, 1);
  assert.equal(ov.kpis.ltv, 27.9);
  assert.equal(ov.kpis.backRevenue, 17.9);

  // 7. Reembolso revoga o acesso
  await webhook({ status: 'refunded', transaction_id: 'T2', customer: { email: 'maria@teste.com' }, product: { code: 'TROCAR_CODIGO_UPGRADE' } });
  me = await (await call('/api/me', { cookie })).json();
  assert.equal(me.library.deliverables.find((d) => d.id === 'fornecedores').locked, true);
  assert.equal((await call('/api/files/fornecedores', { cookie })).status, 403);

  // 8. Sair
  await call('/api/auth/logout', { cookie, body: {} });
  assert.equal((await call('/api/me', { cookie })).status, 401);
});

test('PDF real é servido com suporte a Range (abre por partes no celular)', async () => {
  fs.writeFileSync(path.join(contentDir, 'bonus-01-lista-de-fornecedores.pdf'), '%PDF-1.4 ' + 'x'.repeat(1000));
  await sale('T3', 'joao@teste.com', 'VIB5O5IAEWDa');
  await call('/api/admin/login', { body: { password: 'admin-teste' } });
  const { link } = await (await call('/api/admin/login-link', { cookie: `am_admin=${jar.am_admin}`, body: { email: 'joao@teste.com' } })).json();
  await call('/api/auth/verify', { body: { token: new URL(link).searchParams.get('t') } });
  const res = await call('/api/files/fornecedores', { cookie: `am_session=${jar.am_session}`, headers: { Range: 'bytes=0-99' } });
  assert.equal(res.status, 206);
  assert.equal((await res.arrayBuffer()).byteLength, 100);
});
