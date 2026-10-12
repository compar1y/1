import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { db, setting, randomId, sha256 } from './db.js';
import { buildLibrary, fileFor, ownedDeliverables, validateCatalog, isPlaceholderUrl } from './offers.js';
import {
  customerByEmail, customerById, getOrCreateCustomer, ownedProducts, recordPurchase,
  progressOf, saveProgress, logOfferEvent, normEmail, isEmail, firstName,
} from './store.js';
import { parsePayload, parseSale } from './webhook.js';
import { sendEmail, accessEmail, emailConfigured } from './email.js';
import { placeholderPdf } from './pdf.js';
import { overview, searchCustomers } from './admin.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const PORT = Number(process.env.PORT || 3100);
const PUBLIC_URL = (process.env.PUBLIC_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
const CONTENT_DIR = path.resolve(process.env.CONTENT_DIR || path.join(ROOT, 'content'));
const WEB_DIR = path.join(ROOT, 'web', 'dist');
const PROD = process.env.NODE_ENV === 'production';
const DEV_LINKS = !PROD && !emailConfigured();
const SESSION_DAYS = 90;

const cat = (await import(process.env.CATALOG_PATH ? path.resolve(process.env.CATALOG_PATH) : path.join(ROOT, 'catalog.js'))).default;
const catalogErrors = validateCatalog(cat);
if (catalogErrors.length) {
  console.error('\n⚠️  Problemas no catalog.js:\n  - ' + catalogErrors.join('\n  - ') + '\n');
  if (PROD) process.exit(1);
}

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || setting('admin_password', () => randomId(9));
const WEBHOOK_TOKEN = process.env.WEBHOOK_TOKEN || setting('webhook_token', () => randomId(18));

// ---------- utilidades HTTP ----------
function send(res, status, body, headers = {}) {
  const isBuf = Buffer.isBuffer(body);
  const data = isBuf || typeof body === 'string' ? body : JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': isBuf ? 'application/octet-stream' : typeof body === 'string' ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...headers,
  });
  res.end(data);
}
const json = (res, status, obj, headers) => send(res, status, obj, headers);
const redirect = (res, to, headers = {}) => { res.writeHead(302, { Location: to, 'Cache-Control': 'no-store', ...headers }); res.end(); };

function readBody(req, limit = 1e6) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => { size += c.length; if (size > limit) { reject(new Error('payload grande demais')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}
async function readJson(req) {
  if (!/application\/json/.test(req.headers['content-type'] || '')) throw Object.assign(new Error('envie JSON'), { status: 415 });
  try { return JSON.parse(await readBody(req, 64e3) || '{}'); } catch { throw Object.assign(new Error('JSON inválido'), { status: 400 }); }
}
function cookies(req) {
  const out = {};
  for (const part of (req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}
const secure = (req) => PUBLIC_URL.startsWith('https') || req.headers['x-forwarded-proto'] === 'https';
const cookie = (req, name, value, maxAge) => `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure(req) ? '; Secure' : ''}`;
const clientIp = (req) => String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();

// Limite simples em memória (por chave): evita abuso do envio de e-mail e do login do painel
const hits = new Map();
function limited(key, max, windowMs) {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(key, arr);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
  return arr.length > max;
}

// ---------- sessões ----------
const qSession = db.prepare('SELECT * FROM auth_sessions WHERE hash=? AND expires_at>?');
function createSession(customerId, isAdmin = false) {
  const token = randomId(32);
  const now = Date.now();
  db.prepare('INSERT INTO auth_sessions (hash, customer_id, is_admin, created_at, expires_at) VALUES (?, ?, ?, ?, ?)')
    .run(sha256(token), customerId, isAdmin ? 1 : 0, now, now + SESSION_DAYS * 86400e3);
  return token;
}
const touch = db.prepare('UPDATE customers SET last_seen=? WHERE id=?');
function currentCustomer(req) {
  const t = cookies(req).am_session;
  if (!t) return null;
  const s = qSession.get(sha256(t), Date.now());
  if (!s || !s.customer_id) return null;
  const c = customerById(s.customer_id);
  if (c && (!c.last_seen || Date.now() - c.last_seen > 60e3)) touch.run(Date.now(), c.id);
  return c;
}
function isAdmin(req) {
  const t = cookies(req).am_admin;
  if (!t) return false;
  const s = qSession.get(sha256(t), Date.now());
  return !!s?.is_admin;
}

function createLoginLink(customerId, ttlMs) {
  const token = randomId(24);
  db.prepare('INSERT INTO login_tokens (hash, customer_id, expires_at) VALUES (?, ?, ?)').run(sha256(token), customerId, Date.now() + ttlMs);
  return `${PUBLIC_URL}/entrar?t=${token}`;
}

async function sendAccess(customer, kind, items) {
  const link = createLoginLink(customer.id, kind === 'login' ? 3600e3 : 7 * 86400e3);
  const mail = accessEmail({ appName: cat.settings.appName, name: firstName(customer.name), link, kind, items, supportEmail: cat.settings.supportEmail });
  await sendEmail({ to: customer.email, ...mail });
  return link;
}

// ---------- biblioteca ----------
function me(customer) {
  const products = ownedProducts(customer.id);
  return {
    customer: { email: customer.email, name: customer.name, firstName: firstName(customer.name) },
    products,
    library: buildLibrary(cat, { customerId: customer.id, firstName: firstName(customer.name), products }),
    progress: progressOf(customer.id),
    settings: { appName: cat.settings.appName, supportEmail: cat.settings.supportEmail },
  };
}

function validRef(ref) {
  const [d, item] = String(ref || '').split('/');
  const del = cat.deliverables[d];
  return !!del && (!item || !!del.items?.some((i) => i.id === item));
}

// ---------- arquivos ----------
function serveFile(req, res, filePath, { type, cache, download, name }) {
  let stat;
  try { stat = fs.statSync(filePath); if (!stat.isFile()) throw 0; } catch { return false; }
  const headers = {
    'Content-Type': type, 'Cache-Control': cache, 'Accept-Ranges': 'bytes',
    'Last-Modified': stat.mtime.toUTCString(),
  };
  if (name) headers['Content-Disposition'] = `${download ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(name)}`;
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
  if (range && (range[1] || range[2])) {
    let start = range[1] ? Number(range[1]) : stat.size - Number(range[2]);
    let end = range[1] && range[2] ? Number(range[2]) : stat.size - 1;
    start = Math.max(0, start); end = Math.min(end, stat.size - 1);
    if (start > end) { res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` }); res.end(); return true; }
    res.writeHead(206, { ...headers, 'Content-Range': `bytes ${start}-${end}/${stat.size}`, 'Content-Length': end - start + 1 });
    if (req.method === 'HEAD') return res.end(), true;
    fs.createReadStream(filePath, { start, end }).pipe(res);
    return true;
  }
  res.writeHead(200, { ...headers, 'Content-Length': stat.size });
  if (req.method === 'HEAD') return res.end(), true;
  fs.createReadStream(filePath).pipe(res);
  return true;
}

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.pdf': 'application/pdf',
};

function serveStatic(req, res, pathname) {
  if (!fs.existsSync(WEB_DIR)) return send(res, 503, 'O app ainda não foi compilado. Rode "npm run build" na pasta area-membros.');
  const rel = path.normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '');
  const file = path.join(WEB_DIR, rel);
  if (file.startsWith(WEB_DIR) && pathname !== '/') {
    const ext = path.extname(file);
    const hashed = /-[A-Za-z0-9_-]{8,}\.(js|css|mjs|woff2)$/.test(file);
    const cache = hashed ? 'public, max-age=31536000, immutable' : ext === '.html' || pathname === '/sw.js' ? 'no-cache' : 'public, max-age=86400';
    if (serveFile(req, res, file, { type: MIME[ext] || 'application/octet-stream', cache })) return;
    if (ext) return send(res, 404, 'não encontrado');
  }
  // SPA: qualquer rota sem extensão devolve o index.html
  serveFile(req, res, path.join(WEB_DIR, 'index.html'), { type: MIME['.html'], cache: 'no-cache' });
}

// ---------- rotas ----------
async function handle(req, res) {
  const url = new URL(req.url, 'http://x');
  const p = url.pathname;
  const m = req.method;

  if (p === '/health') return json(res, 200, { ok: true });

  // --- login por link mágico ---
  if (p === '/api/auth/request' && m === 'POST') {
    const { email } = await readJson(req);
    const e = normEmail(email);
    if (!isEmail(e)) return json(res, 400, { error: 'Digite um e-mail válido.' });
    if (limited('mail:' + e, 3, 15 * 60e3) || limited('mailip:' + clientIp(req), 10, 15 * 60e3))
      return json(res, 429, { error: 'Muitas tentativas. Aguarde alguns minutos e tente de novo.' });
    const c = customerByEmail(e);
    let devLink = null;
    if (c && ownedProducts(c.id).length) devLink = await sendAccess(c, 'login');
    // A resposta é a mesma com ou sem compra, para não revelar quem é cliente.
    return json(res, 200, { ok: true, ...(DEV_LINKS && devLink ? { devLink } : {}) });
  }

  if (p === '/api/auth/verify' && m === 'POST') {
    const { token } = await readJson(req);
    if (limited('verify:' + clientIp(req), 30, 15 * 60e3)) return json(res, 429, { error: 'Muitas tentativas. Aguarde alguns minutos.' });
    const row = token && db.prepare('SELECT * FROM login_tokens WHERE hash=?').get(sha256(String(token)));
    if (!row || row.used_at || row.expires_at < Date.now()) return json(res, 400, { error: 'Este link expirou ou já foi usado. Peça um novo abaixo.' });
    db.prepare('UPDATE login_tokens SET used_at=? WHERE hash=?').run(Date.now(), row.hash);
    db.prepare('UPDATE customers SET last_login=? WHERE id=?').run(Date.now(), row.customer_id);
    const session = createSession(row.customer_id);
    return json(res, 200, { ok: true }, { 'Set-Cookie': cookie(req, 'am_session', session, SESSION_DAYS * 86400) });
  }

  if (p === '/api/auth/logout' && m === 'POST') {
    const t = cookies(req).am_session;
    if (t) db.prepare('DELETE FROM auth_sessions WHERE hash=?').run(sha256(t));
    return json(res, 200, { ok: true }, { 'Set-Cookie': cookie(req, 'am_session', '', 0) });
  }

  // --- área do cliente ---
  if (p === '/api/me' && m === 'GET') {
    const c = currentCustomer(req);
    if (!c) return json(res, 401, { error: 'login' });
    return json(res, 200, me(c));
  }

  if (p === '/api/progress' && m === 'POST') {
    const c = currentCustomer(req);
    if (!c) return json(res, 401, { error: 'login' });
    const b = await readJson(req);
    if (!validRef(b.ref)) return json(res, 400, { error: 'ref inválida' });
    const int = (v) => (Number.isInteger(v) && v >= 0 && v < 1e5 ? v : null);
    saveProgress(c.id, { ref: b.ref, page: int(b.page), pages: int(b.pages), done: typeof b.done === 'boolean' ? b.done : undefined });
    return json(res, 200, { ok: true, progress: progressOf(c.id) });
  }

  if (p === '/api/events' && m === 'POST') {
    const c = currentCustomer(req);
    if (!c) return json(res, 401, { error: 'login' });
    const { events = [] } = await readJson(req);
    for (const e of events.slice(0, 50)) {
      if (!['impression', 'open'].includes(e?.type) || !cat.offers[e.offerId]) continue;
      logOfferEvent({ customerId: c.id, offerId: e.offerId, placement: String(e.placement || '').slice(0, 20), ref: validRef(e.ref) ? e.ref : null, type: e.type });
    }
    return json(res, 200, { ok: true });
  }

  // Clique numa oferta: mede e manda para o checkout com UTMs + id do clique + e-mail
  let mm;
  if ((mm = /^\/go\/([\w-]+)$/.exec(p)) && m === 'GET') {
    const offer = cat.offers[mm[1]];
    if (!offer) return redirect(res, '/');
    const c = currentCustomer(req);
    if (!c) return redirect(res, '/entrar');
    const placement = String(url.searchParams.get('p') || 'direct').slice(0, 20);
    const ref = url.searchParams.get('r');
    const clickId = 'am_' + crypto.randomBytes(9).toString('base64url');
    logOfferEvent({ customerId: c.id, offerId: mm[1], placement, ref: validRef(ref) ? ref : null, type: 'click', clickId });
    if (isPlaceholderUrl(offer.checkoutUrl)) return redirect(res, `/checkout-pendente?oferta=${encodeURIComponent(mm[1])}`);
    const dest = new URL(offer.checkoutUrl);
    const add = (k, v) => { if (k && v && !dest.searchParams.has(k)) dest.searchParams.set(k, v); };
    add('utm_source', 'area-membros');
    add('utm_medium', placement);
    add('utm_campaign', mm[1]);
    add('utm_content', `${mm[1]}_${placement}`);
    add('src', clickId);
    add('sck', clickId);
    add(cat.settings.checkoutParams?.email, c.email);
    add(cat.settings.checkoutParams?.name, c.name);
    return redirect(res, dest.toString());
  }

  // PDFs: /api/files/<entregavel>[/<parte>]
  if ((mm = /^\/api\/files\/([\w-]+)(?:\/([\w-]+))?$/.exec(p)) && (m === 'GET' || m === 'HEAD')) {
    const c = currentCustomer(req);
    if (!c) return json(res, 401, { error: 'login' });
    const owned = ownedDeliverables(cat, new Set(ownedProducts(c.id)));
    const f = fileFor(cat, mm[1], mm[2], owned);
    if (!f) return json(res, 403, { error: 'Você ainda não tem acesso a este conteúdo.' });
    const download = url.searchParams.has('download');
    const full = path.join(CONTENT_DIR, path.basename(f.file));
    const name = f.file;
    if (serveFile(req, res, full, { type: 'application/pdf', cache: 'private, max-age=3600', download, name })) return;
    const pdf = placeholderPdf({ title: f.title, parent: f.parent || cat.settings.appName, file: f.file });
    return send(res, 200, m === 'HEAD' ? '' : pdf, {
      'Content-Type': 'application/pdf', 'Content-Length': pdf.length, 'Cache-Control': 'private, no-cache',
      'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(name)}`,
    });
  }

  // --- webhook de vendas ---
  if ((mm = /^\/webhook\/([\w-]+)$/.exec(p)) && m === 'POST') {
    const a = Buffer.from(mm[1]); const b = Buffer.from(WEBHOOK_TOKEN);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return json(res, 404, { error: 'não encontrado' });
    const body = await readBody(req);
    relayToRetina(body, req.headers['content-type']);
    const result = await processSale(body, 'webhook');
    db.prepare('INSERT INTO webhook_log (ts, ok, summary, body) VALUES (?, ?, ?, ?)').run(Date.now(), result.ok ? 1 : 0, JSON.stringify(result), body.slice(0, 20000));
    db.prepare('DELETE FROM webhook_log WHERE id <= (SELECT MAX(id) - 500 FROM webhook_log)').run();
    // 200 mesmo quando não reconhece o produto, para a plataforma não ficar reenviando: o problema aparece no painel.
    return json(res, 200, result);
  }

  // --- painel admin ---
  if (p === '/api/admin/login' && m === 'POST') {
    const { password } = await readJson(req);
    if (limited('admin:' + clientIp(req), 8, 15 * 60e3)) return json(res, 429, { error: 'Muitas tentativas. Aguarde alguns minutos.' });
    const a = Buffer.from(sha256(String(password || ''))); const b = Buffer.from(sha256(ADMIN_PASSWORD));
    if (!crypto.timingSafeEqual(a, b)) return json(res, 401, { error: 'Senha incorreta.' });
    return json(res, 200, { ok: true }, { 'Set-Cookie': cookie(req, 'am_admin', createSession(null, true), 30 * 86400) });
  }
  if (p.startsWith('/api/admin/')) {
    if (!isAdmin(req)) return json(res, 401, { error: 'login' });
    if (p === '/api/admin/overview' && m === 'GET') {
      const days = Math.min(365, Math.max(1, Number(url.searchParams.get('days')) || 30));
      return json(res, 200, {
        ...overview(cat, { days, contentDir: CONTENT_DIR }),
        webhookUrl: `${PUBLIC_URL}/webhook/${WEBHOOK_TOKEN}`,
        products: Object.entries(cat.products).map(([id, pr]) => ({ id, name: pr.name, price: pr.price })),
      });
    }
    if (p === '/api/admin/customers' && m === 'GET') return json(res, 200, { customers: searchCustomers(cat, String(url.searchParams.get('q') || '').trim().slice(0, 100)) });
    if (p === '/api/admin/webhooks' && m === 'GET') return json(res, 200, { log: db.prepare('SELECT id, ts, ok, summary, body FROM webhook_log ORDER BY id DESC LIMIT 30').all() });
    if (p === '/api/admin/grant' && m === 'POST') {
      const b = await readJson(req);
      const e = normEmail(b.email);
      if (!isEmail(e)) return json(res, 400, { error: 'E-mail inválido.' });
      if (!cat.products[b.product]) return json(res, 400, { error: 'Produto inválido.' });
      const cust = getOrCreateCustomer(e, b.name || null);
      recordPurchase(cat, { customerId: cust.id, productId: b.product, txId: `manual-${randomId(6)}`, status: 'approved', value: Number(b.value) || 0, source: 'manual' });
      return json(res, 200, { ok: true });
    }
    if (p === '/api/admin/revoke' && m === 'POST') {
      const b = await readJson(req);
      db.prepare("UPDATE purchases SET status='refunded', updated_at=? WHERE id=?").run(Date.now(), Number(b.purchaseId));
      return json(res, 200, { ok: true });
    }
    if (p === '/api/admin/login-link' && m === 'POST') {
      const b = await readJson(req);
      const c = customerByEmail(b.email);
      if (!c) return json(res, 404, { error: 'Cliente não encontrado.' });
      // Para o suporte mandar pelo WhatsApp quando o e-mail não chega. Vale 24h, uso único.
      return json(res, 200, { link: createLoginLink(c.id, 86400e3) });
    }
    if (p === '/api/admin/logout' && m === 'POST') return json(res, 200, { ok: true }, { 'Set-Cookie': cookie(req, 'am_admin', '', 0) });
    return json(res, 404, { error: 'não encontrado' });
  }

  if (p.startsWith('/api/')) return json(res, 404, { error: 'não encontrado' });
  if (m !== 'GET' && m !== 'HEAD') return send(res, 405, 'método não permitido');
  return serveStatic(req, res, p);
}

/** Processa uma venda (webhook ou simulação): cria o cliente, libera/revoga produtos e manda o e-mail de acesso. */
export async function processSale(body, source) {
  const payload = typeof body === 'string' ? parsePayload(body) : body;
  if (!payload) return { ok: false, error: 'payload inválido' };
  const sale = parseSale(payload, cat);
  if (!sale.email) return { ok: false, error: 'e-mail do comprador não encontrado', ...sale };
  if (!sale.products.length) return { ok: false, error: 'nenhum produto do catálogo reconhecido (confira products[].match)', ...sale };
  if (sale.status === 'pending') return { ok: true, ignored: 'pagamento pendente', ...sale };

  const existed = !!customerByEmail(sale.email);
  const customer = getOrCreateCustomer(sale.email, sale.name);
  const hadProducts = ownedProducts(customer.id).length > 0;
  const unlocked = [];
  for (const productId of sale.products) {
    const value = sale.products.length === 1 && sale.value ? sale.value : cat.products[productId].price;
    const r = recordPurchase(cat, { customerId: customer.id, productId, txId: sale.tx, status: sale.status, value, source, clickId: sale.clickId });
    if (r.becameApproved) unlocked.push(productId);
  }
  if (unlocked.length) {
    const titles = unlocked.flatMap((pid) => cat.products[pid].grants.map((g) => cat.deliverables[g].title));
    sendAccess(customer, existed && hadProducts ? 'new' : 'welcome', [...new Set(titles)]).catch(() => {});
  }
  return { ok: true, customer: customer.email, status: sale.status, products: sale.products, unlocked, clickId: sale.clickId };
}

function relayToRetina(body, contentType) {
  if (!process.env.RETINA_WEBHOOK_URL) return;
  fetch(process.env.RETINA_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': contentType || 'application/json' }, body })
    .catch((e) => console.error('[retina] falha ao repassar webhook:', e.message));
}

export const server = http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  try { await handle(req, res); } catch (e) {
    if (!res.headersSent) json(res, e.status || 500, { error: e.status ? e.message : 'Erro interno.' });
    if (!e.status) console.error(e);
  }
});

if (process.env.NO_LISTEN !== '1') {
  server.listen(PORT, () => {
    console.log(`\n🪵 Área de membros em ${PUBLIC_URL}  (porta ${PORT})`);
    console.log(`   Painel:  ${PUBLIC_URL}/admin   senha: ${process.env.ADMIN_PASSWORD ? '(ADMIN_PASSWORD)' : ADMIN_PASSWORD}`);
    console.log(`   Webhook: ${PUBLIC_URL}/webhook/${WEBHOOK_TOKEN}`);
    if (!emailConfigured()) console.log('   E-mail:  não configurado (RESEND_API_KEY); links de acesso aparecem aqui no terminal.');
    console.log('');
  });
}
