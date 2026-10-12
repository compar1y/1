// Modo demonstração, chamado pela função da Vercel (api/index.js) do mesmo jeito que as rewrites do vercel.json chamam.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'am-demo-'));
process.env.DATA_DIR = dir;
delete process.env.ADMIN_PASSWORD;
delete process.env.CATALOG_PATH;

let base, srv;
before(async () => {
  const { default: vercelHandler } = await import('../api/index.js');
  // Emula as rewrites: /api/me → /api/index?__p=/api/me
  srv = http.createServer((req, res) => {
    const [p, q] = req.url.split('?');
    req.url = `/api/index?__p=${p}${q ? '&' + q : ''}`;
    vercelHandler(req, res);
  });
  await new Promise((r) => srv.listen(0, r));
  base = `http://localhost:${srv.address().port}`;
});
after(() => { srv.close(); fs.rmSync(dir, { recursive: true, force: true }); });

const jar = {};
async function call(p, { body, redirect = 'follow' } = {}) {
  const res = await fetch(base + p, {
    method: body === undefined ? 'GET' : 'POST', redirect,
    headers: { ...(body !== undefined && { 'Content-Type': 'application/json' }), Cookie: Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; ') },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const set = res.headers.get('set-cookie');
  if (set) { const [kv] = set.split(';'); const i = kv.indexOf('='); jar[kv.slice(0, i)] = kv.slice(i + 1); }
  return res;
}

test('demonstração: entra com um toque, compra pela oferta e recomeça', async () => {
  const pub = await (await call('/api/public')).json();
  assert.deepEqual(pub.demo.profiles.map((p) => p.product), ['essencial', 'completo']);
  assert.equal(pub.demo.adminPassword, 'demo');

  await call('/api/demo/login', { body: { product: 'essencial' } });
  let me = await (await call('/api/me')).json();
  assert.equal(me.settings.demo, true);
  assert.equal(me.library.deliverables.filter((d) => d.locked).length, 7);

  // Tocar na oferta "compra" na hora e volta para o app
  const r = await call('/go/upgrade-completo?p=locked&r=guia-embalagem', { redirect: 'manual' });
  assert.equal(r.status, 302);
  assert.equal(r.headers.get('location'), '/?comprou=1');
  me = await (await call('/api/me')).json();
  assert.equal(me.library.deliverables.filter((d) => d.locked).length, 0);

  // Recomeçar volta ao Kit Essencial
  await call('/api/demo/reset', { body: {} });
  me = await (await call('/api/me')).json();
  assert.deepEqual(me.products, ['essencial']);

  // Painel com a senha da demonstração, já com o histórico de exemplo
  assert.equal((await call('/api/admin/login', { body: { password: 'demo' } })).status, 200);
  const ov = await (await call('/api/admin/overview')).json();
  assert.ok(ov.kpis.buyers > 100);
  const up = ov.offers.find((o) => o.id === 'upgrade-completo');
  assert.ok(up.placements.some((p) => p.placement === 'locked' && p.sales >= 1));

  // Cookie forjado não entra
  jar.am_session = 'd.' + Buffer.from('completo@demo.app').toString('base64url') + '.assinatura-falsa';
  assert.equal((await call('/api/me')).status, 401);
});
