import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { db, bootstrap, getSetting, createSite, token } from './db.js';
import { collect, siteById, clearSiteCache, SID_RE } from './collect.js';
import { handleWebhook } from './webhook.js';
import { stats, hit } from './stats.js';
import * as A from './analytics.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const PORT = Number(process.env.PORT || 3000);
const DEMO_PORT = Number(process.env.DEMO_PORT || 4000);
const DEMO_DIR = process.env.RETINA_DEMO_DIR || path.resolve(ROOT, '..', 'pagina-madeira', 'dist');
const RETENTION_DAYS = Number(process.env.RETINA_RETENTION_DAYS || 180);
const MAX_BODY = 256 * 1024;

bootstrap();
const SECRET = getSetting('secret');
const password = () => process.env.RETINA_PASSWORD || getSetting('password');

// ---------------- helpers ----------------
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.csv': 'text/csv; charset=utf-8' };

function send(req, res, status, body, type = 'application/json; charset=utf-8', extra = {}) {
  let buf = Buffer.isBuffer(body) ? body : Buffer.from(typeof body === 'string' ? body : JSON.stringify(body));
  const headers = { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff', ...extra };
  if (buf.length > 1024 && /\bgzip\b/.test(req.headers['accept-encoding'] || '') && /json|javascript|css|html|svg|csv|text/.test(type)) {
    buf = zlib.gzipSync(buf); headers['Content-Encoding'] = 'gzip'; headers['Vary'] = 'Accept-Encoding';
  }
  headers['Content-Length'] = buf.length;
  res.writeHead(status, headers);
  res.end(req.method === 'HEAD' ? undefined : buf);
}
const json = (req, res, data, status = 200) => send(req, res, status, data);

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => { size += c.length; if (size > MAX_BODY) { reject(new Error('too large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function serveFile(req, res, file, cache = 'no-cache') {
  fs.readFile(file, (err, data) => {
    if (err) return send(req, res, 404, 'Not found', 'text/plain');
    send(req, res, 200, data, MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', { 'Cache-Control': cache });
  });
}
function safeJoin(base, p) {
  const full = path.resolve(base, '.' + decodeURIComponent(p));
  return full.startsWith(base) ? full : null;
}

// ---------------- autenticação do painel ----------------
function sign(exp) { return crypto.createHmac('sha256', SECRET).update('retina:' + exp).digest('base64url'); }
function makeCookie() { const exp = Date.now() + 30 * 86400000; return `${exp}.${sign(exp)}`; }
function authed(req) {
  const m = (req.headers.cookie || '').match(/(?:^|;\s*)retina_auth=([^;]+)/);
  if (!m) return false;
  const [exp, sig] = m[1].split('.');
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const a = Buffer.from(sig), b = Buffer.from(sign(exp));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
const loginAttempts = new Map();

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400' };
const GIF = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

// ---------------- rotas ----------------
async function route(req, res) {
  const url = new URL(req.url, 'http://x');
  const p = url.pathname;
  const qs = url.searchParams;
  stats.requests++; hit('req');

  // ---- público: tracker, coleta, webhooks ----
  if (p === '/r.js' || p === '/retina.js') return serveFile(req, res, path.join(ROOT, 'public', 'r.js'), 'public, max-age=3600');
  if (p === '/c') {
    if (req.method === 'OPTIONS') { res.writeHead(204, CORS); return res.end(); }
    if (req.method !== 'POST') return send(req, res, 405, '', 'text/plain', CORS);
    let body; try { body = await readBody(req); } catch { return send(req, res, 413, '', 'text/plain', CORS); }
    const status = collect(body, req);
    if (status === 204) hit('col');
    res.writeHead(status, CORS); return res.end();
  }
  if (p === '/cv') { // pixel de conversão para a página de obrigado: /cv?site=..&sid=..&value=..&tx=..
    const site = siteById(qs.get('site') || '');
    const sid = qs.get('sid') || '';
    if (site && SID_RE.test(sid)) handleWebhook(site, JSON.stringify({ retina_sid: sid, value: Number(qs.get('value')) || 0, transaction: qs.get('tx') || undefined, status: 'approved' }), 'pixel');
    return send(req, res, 200, GIF, 'image/gif', { 'Cache-Control': 'no-store', ...CORS });
  }
  const wh = p.match(/^\/webhook\/([^/]+)\/([^/]+)\/?$/);
  if (wh) {
    const site = siteById(decodeURIComponent(wh[1]));
    if (!site || site.webhook_token !== wh[2]) { stats.webhookErrors++; return json(req, res, { ok: false, error: 'site ou token inválido' }, 401); }
    if (req.method === 'GET') return json(req, res, { ok: true, message: 'Webhook do Retina ativo. Envie as vendas via POST.' });
    let body; try { body = await readBody(req); } catch { return json(req, res, { ok: false }, 413); }
    return json(req, res, handleWebhook(site, body, qs.get('platform') || 'webhook'));
  }
  if (p === '/health') return json(req, res, { ok: true, uptime: Date.now() - stats.startedAt });

  // ---- painel ----
  if (p === '/api/login' && req.method === 'POST') {
    const ip = req.socket.remoteAddress;
    const att = loginAttempts.get(ip) || { n: 0, t: Date.now() };
    if (Date.now() - att.t > 15 * 60000) { att.n = 0; att.t = Date.now(); }
    if (att.n >= 10) return json(req, res, { ok: false, error: 'Muitas tentativas. Aguarde 15 minutos.' }, 429);
    let body = {}; try { body = JSON.parse(await readBody(req)); } catch {}
    const pw = String(body.password || '');
    const ok = pw.length && crypto.createHash('sha256').update(pw).digest().equals(crypto.createHash('sha256').update(password()).digest());
    if (!ok) { att.n++; loginAttempts.set(ip, att); return json(req, res, { ok: false, error: 'Senha incorreta' }, 401); }
    loginAttempts.delete(ip);
    const secure = (req.headers['x-forwarded-proto'] || '') === 'https' ? '; Secure' : '';
    return send(req, res, 200, { ok: true }, 'application/json', { 'Set-Cookie': `retina_auth=${makeCookie()}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000${secure}` });
  }
  if (p === '/api/logout') return send(req, res, 200, { ok: true }, 'application/json', { 'Set-Cookie': 'retina_auth=; Path=/; Max-Age=0' });

  if (p.startsWith('/api/')) {
    if (!authed(req)) return json(req, res, { error: 'unauthorized' }, 401);
    return api(req, res, p, qs);
  }

  // estáticos do dashboard
  if (p === '/' || p === '/index.html') return serveFile(req, res, path.join(ROOT, 'dashboard', 'index.html'));
  if (p.startsWith('/ui/')) {
    const f = safeJoin(path.join(ROOT, 'dashboard'), p.slice(3));
    if (f) return serveFile(req, res, f);
  }
  if (p === '/favicon.ico' || p === '/favicon.svg') return serveFile(req, res, path.join(ROOT, 'dashboard', 'favicon.svg'), 'public, max-age=86400');
  return send(req, res, 404, 'Not found', 'text/plain');
}

async function api(req, res, p, qs) {
  const f = A.parseFilters(qs);
  switch (p) {
    case '/api/me': return json(req, res, { ok: true, defaultPassword: !process.env.RETINA_PASSWORD });
    case '/api/overview': return json(req, res, A.overview(f));
    case '/api/retention': return json(req, res, A.retention(f));
    case '/api/heatmap': return json(req, res, A.heatmap(f));
    case '/api/clicks': return json(req, res, A.clicks(f));
    case '/api/compare': return json(req, res, A.compare(f, qs.get('by') || 'converted'));
    case '/api/sources': return json(req, res, A.sources(f, qs.get('dim') || 'source'));
    case '/api/sessions': return json(req, res, A.sessions(f, qs));
    case '/api/live': return json(req, res, A.live(f.site));
    case '/api/conversions': return json(req, res, A.conversions(f));
    case '/api/system': return json(req, res, A.system());
    case '/api/filters': {
      const d = (col) => db.prepare(`SELECT ${col} AS v, COUNT(*) AS n FROM sessions WHERE site_id = ? AND ${col} IS NOT NULL AND started_at >= ? GROUP BY ${col} ORDER BY n DESC LIMIT 50`).all(f.site, f.from).map((r) => r.v);
      return json(req, res, { source: d('utm_source'), campaign: d('utm_campaign'), content: d('utm_content'), medium: d('utm_medium'), browser: d('browser') });
    }
    case '/api/sites': {
      if (req.method === 'POST') {
        let b = {}; try { b = JSON.parse(await readBody(req)); } catch {}
        if (!b.name) return json(req, res, { error: 'nome obrigatório' }, 400);
        clearSiteCache();
        return json(req, res, createSite(String(b.name).slice(0, 80), b.url ? String(b.url).slice(0, 500) : null));
      }
      return json(req, res, db.prepare('SELECT * FROM sites ORDER BY created_at').all());
    }
    case '/api/export.csv': {
      const all = db.prepare(`SELECT id, started_at, device, os, browser, utm_source, utm_medium, utm_campaign, utm_content, utm_term, ref_host, country, duration_ms, engaged_ms, max_scroll, cur_section, clicks, rage_clicks, dead_clicks, cta_clicks, checkout_clicks, converted, revenue
        FROM sessions WHERE site_id = ? AND started_at >= ? AND started_at < ? AND is_bot = 0 ORDER BY started_at DESC`).all(f.site, f.from, f.to);
      const cols = all.length ? Object.keys(all[0]) : ['id'];
      const esc = (v) => (v == null ? '' : /[",\n;]/.test(String(v)) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v));
      const csv = [cols.join(','), ...all.map((r) => cols.map((c) => esc(c === 'started_at' ? new Date(r[c]).toISOString() : r[c])).join(','))].join('\n');
      return send(req, res, 200, '﻿' + csv, MIME['.csv'], { 'Content-Disposition': `attachment; filename="retina-${f.site}.csv"` });
    }
  }
  let m;
  if ((m = p.match(/^\/api\/session\/(rt_[a-z0-9]{16})$/))) {
    const s = A.session(m[1]);
    return s ? json(req, res, s) : json(req, res, { error: 'not found' }, 404);
  }
  if ((m = p.match(/^\/api\/sites\/([^/]+)(\/rotate|\/data)?$/))) {
    const id = decodeURIComponent(m[1]);
    const site = db.prepare('SELECT * FROM sites WHERE id = ?').get(id);
    if (!site) return json(req, res, { error: 'not found' }, 404);
    clearSiteCache();
    if (m[2] === '/rotate' && req.method === 'POST') { db.prepare('UPDATE sites SET webhook_token = ? WHERE id = ?').run(token(18), id); return json(req, res, db.prepare('SELECT * FROM sites WHERE id = ?').get(id)); }
    if (m[2] === '/data' && req.method === 'DELETE') { wipe(id); return json(req, res, { ok: true }); }
    if (req.method === 'PATCH') {
      let b = {}; try { b = JSON.parse(await readBody(req)); } catch {}
      db.prepare('UPDATE sites SET name = COALESCE(?, name), url = COALESCE(?, url) WHERE id = ?').run(b.name ? String(b.name).slice(0, 80) : null, b.url != null ? String(b.url).slice(0, 500) : null, id);
      return json(req, res, db.prepare('SELECT * FROM sites WHERE id = ?').get(id));
    }
    if (req.method === 'DELETE') { wipe(id); db.prepare('DELETE FROM sites WHERE id = ?').run(id); return json(req, res, { ok: true }); }
    return json(req, res, site);
  }
  return json(req, res, { error: 'not found' }, 404);
}

function wipe(siteId) {
  db.exec('BEGIN');
  try {
    db.prepare('DELETE FROM traces WHERE session_id IN (SELECT id FROM sessions WHERE site_id = ?)').run(siteId);
    for (const t of ['events', 'session_sections', 'conversions', 'sessions']) db.prepare(`DELETE FROM ${t} WHERE site_id = ?`).run(siteId);
    db.exec('COMMIT');
  } catch (e) { db.exec('ROLLBACK'); throw e; }
}

// ---------------- manutenção ----------------
function maintenance() {
  const now = Date.now();
  db.prepare('UPDATE sessions SET finished = 1 WHERE finished = 0 AND last_seen < ?').run(now - 10 * 60000);
  const cutoff = now - RETENTION_DAYS * 86400000;
  const old = db.prepare('SELECT COUNT(*) AS n FROM sessions WHERE started_at < ?').get(cutoff).n;
  if (old) {
    db.prepare('DELETE FROM traces WHERE session_id IN (SELECT id FROM sessions WHERE started_at < ?)').run(cutoff);
    db.prepare('DELETE FROM session_sections WHERE session_id IN (SELECT id FROM sessions WHERE started_at < ?)').run(cutoff);
    db.prepare('DELETE FROM events WHERE ts < ?').run(cutoff);
    db.prepare('DELETE FROM sessions WHERE started_at < ?').run(cutoff);
  }
}
setInterval(maintenance, 60000).unref();
maintenance();

// ---------------- start ----------------
const server = http.createServer((req, res) => {
  route(req, res).catch((err) => {
    console.error('[erro]', req.method, req.url, err);
    if (!res.headersSent) json(req, res, { error: 'internal' }, 500);
  });
});
server.keepAliveTimeout = 65000;
server.listen(PORT, () => {
  console.log(`\n  ◉ Retina rodando em http://localhost:${PORT}`);
  console.log(`    Painel:  http://localhost:${PORT}/`);
  console.log(`    Tracker: http://localhost:${PORT}/r.js`);
  if (!process.env.RETINA_PASSWORD) console.log(`    Senha do painel: ${password()}   (defina RETINA_PASSWORD para trocar)`);
});

// servidor da página de demonstração (outro domínio/porta, como seria em produção)
if (DEMO_PORT && fs.existsSync(DEMO_DIR)) {
  http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    let f = safeJoin(DEMO_DIR, u.pathname === '/' ? '/index.html' : u.pathname);
    if (!f || !fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(DEMO_DIR, 'index.html');
    serveFile(req, res, f, f.includes(`${path.sep}assets${path.sep}`) ? 'public, max-age=3600' : 'no-cache');
  }).listen(DEMO_PORT, () => console.log(`    Página demo: http://localhost:${DEMO_PORT}/\n`));
}

for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { server.close(); try { db.close(); } catch {} process.exit(0); });
