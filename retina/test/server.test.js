import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';

const PORT = 3900 + Math.floor(Math.random() * 90);
const BASE = `http://localhost:${PORT}`;
let proc, cookie, token;
const SID = 'rt_testsession00001';

before(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'retina-srv-'));
  proc = spawn(process.execPath, ['--disable-warning=ExperimentalWarning', 'server/index.js'], {
    cwd: path.resolve(import.meta.dirname, '..'), env: { ...process.env, PORT: String(PORT), DEMO_PORT: '0', RETINA_DATA_DIR: dir, RETINA_PASSWORD: 'senha' }, stdio: 'pipe',
  });
  for (let i = 0; i < 50; i++) { try { await fetch(BASE + '/health'); break; } catch { await new Promise((r) => setTimeout(r, 100)); } }
});
after(() => proc.kill());

test('tracker é servido', async () => {
  const r = await fetch(BASE + '/r.js');
  assert.equal(r.status, 200);
  assert.match(await r.text(), /Retina/);
});

test('painel exige login', async () => {
  assert.equal((await fetch(BASE + '/api/overview')).status, 401);
  assert.equal((await fetch(BASE + '/api/login', { method: 'POST', body: '{"password":"errada"}' })).status, 401);
  const r = await fetch(BASE + '/api/login', { method: 'POST', body: '{"password":"senha"}' });
  assert.equal(r.status, 200);
  cookie = r.headers.get('set-cookie').split(';')[0];
});

test('coleta um lote do tracker', async () => {
  const payload = {
    v: 1, site: 'demo', sid: SID, vid: 'vtestvisitor0001', seq: 0,
    meta: { url: 'https://x.com/?utm_source=facebook', utm: { utm_source: 'facebook', utm_content: 'cri-1' }, vw: 390, vh: 800, ref: '' },
    st: { dur: 30000, eng: 25000, max: 0.6, cur: 'Oferta', fin: true, lay: { h: 3000, w: 390, s: [['Topo', 0, 1000], ['Oferta', 1000, 2000]] },
      sec: { Topo: [0, 1, 0, 10000, 6000, 4, 1.2, 0, new Array(20).fill(500)], Oferta: [1, 1, 10000, 15000, 12000, 3, 0.8, 1, new Array(20).fill(750)] } },
    ev: [{ type: 'click', t: 12000, section: 'Oferta', x: 0.5, y: 0.4, label: 'Comprar', tag: 'a', href: 'https://pay.hotmart.com/x', cta: 1, checkout: 1, dead: 0, rage: 0 }],
    tr: [[0, 0, 3000], [120, 1200, 3000]],
  };
  const r = await fetch(BASE + '/c', { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'text/plain', 'User-Agent': 'Mozilla/5.0 (iPhone) Instagram' } });
  assert.equal(r.status, 204);
  assert.equal((await fetch(BASE + '/c', { method: 'POST', body: JSON.stringify({ ...payload, site: 'nao-existe' }) })).status, 404);
  assert.equal((await fetch(BASE + '/c', { method: 'POST', body: 'lixo' })).status, 400);
});

test('webhook liga a venda à sessão', async () => {
  const sites = await (await fetch(BASE + '/api/sites', { headers: { cookie } })).json();
  token = sites.find((s) => s.id === 'demo').webhook_token;
  assert.equal((await fetch(`${BASE}/webhook/demo/errado`, { method: 'POST', body: '{}' })).status, 401);
  const r = await fetch(`${BASE}/webhook/demo/${token}`, { method: 'POST', body: JSON.stringify({ event: 'PURCHASE_APPROVED', data: { purchase: { transaction: 'T1', status: 'APPROVED', price: { value: 47 }, origin: { sck: SID } } } }) });
  const j = await r.json();
  assert.equal(j.matched_session, true);
  const s = await (await fetch(`${BASE}/api/session/${SID}`, { headers: { cookie } })).json();
  assert.equal(s.session.converted, 1);
  assert.equal(s.session.revenue, 47);
  assert.equal(s.session.device, 'mobile');
  assert.equal(s.session.browser, 'Instagram (in-app)');
  assert.equal(s.trace.length, 2);
});

test('relatórios', async () => {
  const q = `site=demo&from=1&to=${Date.now() + 60000}`;
  const o = await (await fetch(`${BASE}/api/overview?${q}`, { headers: { cookie } })).json();
  assert.equal(o.kpis.sessions, 1);
  assert.equal(o.kpis.revenue, 47);
  const ret = await (await fetch(`${BASE}/api/retention?${q}`, { headers: { cookie } })).json();
  assert.deepEqual(ret.sections.map((s) => s.section), ['Topo', 'Oferta']);
  assert.equal(ret.sections[1].rereadRate, 1);
  const cmp = await (await fetch(`${BASE}/api/compare?${q}`, { headers: { cookie } })).json();
  assert.equal(cmp.groups.yes.n, 1);
  for (const ep of ['heatmap', 'clicks', 'sources', 'sessions', 'live', 'conversions', 'system', 'filters']) {
    assert.equal((await fetch(`${BASE}/api/${ep}?${q}`, { headers: { cookie } })).status, 200, ep);
  }
});
